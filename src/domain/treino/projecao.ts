/**
 * A projeção semana a semana de um jogador, num cenário (rápido, esperado ou
 * lento), e as semanas até uma skill chegar a um nível. Regras da spec, 4.1.
 *
 * Domínio puro: sem React.
 */

import curvas from '../../data/curvas.json' with { type: 'json' };
import { SKILLS_TSP, tsp, type Posicao, type SkillTsp, type SkillsTsp } from '../escalas.ts';
import { eMudancaDeIdade, somarDias, type Data } from '../calendario.ts';
import {
  AVISOS,
  CENARIOS,
  FRACAO_SECUNDARIA,
  MOTIVOS,
  NOME_CENARIO,
  PARAMETROS_CENARIO,
  TREINOS,
  ganhoSemanal,
  juntarAvisos,
  type Bloco,
  type Cenario,
  type Estimativa,
  type JogadorTreino,
} from './modelo.ts';

export interface SemanaProjetada {
  sexta: Data;
  idade: number;
  /** Com decimais. */
  skills: SkillsTsp;
  /** A soma das partes inteiras. */
  tsp: number;
}

/** O máximo de semanas que `semanasAte` (e cada bloco do plano) simula. */
export const LIMITE_SEMANAS = 400;

/**
 * Os ganhos acumulam erro de vírgula flutuante (10 × 0,1 dá 0,999…): sem esta
 * folga, um valor que chegou a 18 podia contar como 17. É muito menor do que
 * qualquer ganho semanal, por isso não antecipa nenhum nível a sério.
 */
const EPSILON = 1e-9;

/** O nível inteiro de um valor com decimais (com a folga do `EPSILON`). */
export function nivel(valor: number): number {
  return Math.floor(valor + EPSILON);
}

function tspProjetado(s: SkillsTsp): number {
  const comFolga = { ...s };
  for (const k of SKILLS_TSP) comFolga[k] = s[k] + EPSILON;
  return tsp(comFolga);
}

const TECTO: Record<string, number> = curvas.tectoPorPotencial;

/** Um bloco já conferido contra a tabela de treinos e a posição do jogador. */
export interface BlocoResolvido {
  treino: string;
  grupo: Posicao[];
  primaria: SkillTsp;
  secundarias: SkillTsp[];
}

function mesmoGrupo(a: readonly Posicao[], b: readonly Posicao[]): boolean {
  return a.length === b.length && a.every((p) => b.includes(p));
}

/**
 * Confere o bloco: o treino existe, tem esse grupo, o jogador joga numa posição
 * do grupo e há ganho para a idade, o treinador e o número de posições.
 */
export function resolverBloco(
  j: JogadorTreino,
  bloco: Omit<Bloco, 'semanas'>,
  treinador: number,
): Estimativa<BlocoResolvido> {
  const t = TREINOS.find((x) => x.id === bloco.treino);
  if (!t) return { ok: false, motivo: `treino desconhecido: ${bloco.treino}` };
  const g = t.grupos.find((x) => mesmoGrupo(x.posicoes, bloco.grupo));
  if (!g) return { ok: false, motivo: `o treino ${t.nome} não tem o grupo ${bloco.grupo.join('/')}` };
  if (!g.posicoes.includes(j.posicao)) return { ok: false, motivo: MOTIVOS.foraDoGrupo };
  const ganho = ganhoSemanal(j.idade, j.minutos, treinador, g.posicoes.length);
  if (!ganho.ok) return ganho;
  return {
    ok: true,
    valor: { treino: t.id, grupo: [...g.posicoes], primaria: t.primaria, secundarias: [...g.secundarias] },
    avisos: [],
  };
}

/** O estado de uma simulação, que avança uma semana de cada vez. */
export interface Simulacao {
  readonly cenario: Cenario;
  readonly inicio: Data;
  readonly tecto: number | undefined;
  /** A próxima semana a calcular (0 = a sexta de início). */
  k: number;
  idade: number;
  skills: SkillsTsp;
  noTecto: boolean;
  avisos: string[];
}

export function novaSimulacao(j: JogadorTreino, inicio: Data, cenario: Cenario): Simulacao {
  const skills = { ...j.skills };
  for (const k of SKILLS_TSP) skills[k] = j.skills[k] + PARAMETROS_CENARIO[cenario].inicio;
  const tecto = TECTO[String(j.potencial)];
  return {
    cenario,
    inicio,
    tecto,
    k: 0,
    idade: j.idade,
    skills,
    noTecto: false,
    avisos: tecto === undefined ? [AVISOS.semTecto] : [],
  };
}

/** A sexta da próxima semana da simulação. */
export function sextaAtual(sim: Simulacao): Data {
  return somarDias(sim.inicio, 7 * sim.k);
}

/**
 * Calcula a semana k: a idade sobe antes, se essa sexta for de mudança (também
 * na k = 0, porque essa sexta já é da época nova); depois a primária ganha
 * `ganho × mult` e cada secundária uma fração disso. Marca `noTecto` quando o
 * TSP chega ao tecto do potencial.
 */
export function avancarSemana(
  sim: Simulacao,
  j: JogadorTreino,
  bloco: BlocoResolvido,
  treinador: number,
): Estimativa<SemanaProjetada> {
  const sexta = sextaAtual(sim);
  if (eMudancaDeIdade(sexta)) sim.idade += 1;
  const ganho = ganhoSemanal(sim.idade, j.minutos, treinador, bloco.grupo.length);
  if (!ganho.ok) return ganho;
  juntarAvisos(sim.avisos, ganho.avisos);

  const primaria = ganho.valor * PARAMETROS_CENARIO[sim.cenario].mult;
  sim.skills[bloco.primaria] += primaria;
  for (const s of bloco.secundarias) sim.skills[s] += FRACAO_SECUNDARIA * primaria;
  sim.k += 1;

  const semana = { sexta, idade: sim.idade, skills: { ...sim.skills }, tsp: tspProjetado(sim.skills) };
  if (sim.tecto !== undefined && semana.tsp >= sim.tecto) {
    sim.noTecto = true;
    juntarAvisos(sim.avisos, [AVISOS.tecto]);
  }
  return { ok: true, valor: semana, avisos: [] };
}

export type ResultadoCorrida =
  | { chegou: true; semanas: number; sexta: Data }
  | { chegou: false; porque: 'tecto' | 'limite' };

/**
 * Corre o bloco até `nivel(skill) >= alvo`, no máximo `limite` semanas. Sem
 * semanas de treino (alvo já atingido) a `sexta` é a da próxima semana.
 */
export function correrAte(
  sim: Simulacao,
  j: JogadorTreino,
  bloco: BlocoResolvido,
  skill: SkillTsp,
  alvo: number,
  treinador: number,
  limite = LIMITE_SEMANAS,
): Estimativa<ResultadoCorrida> {
  if (nivel(sim.skills[skill]) >= alvo) {
    return { ok: true, valor: { chegou: true, semanas: 0, sexta: sextaAtual(sim) }, avisos: [] };
  }
  for (let n = 1; n <= limite; n++) {
    if (sim.noTecto) return { ok: true, valor: { chegou: false, porque: 'tecto' }, avisos: [] };
    const passo = avancarSemana(sim, j, bloco, treinador);
    if (!passo.ok) return passo;
    // A semana que chega ao tecto conta; só as seguintes ficam sem número.
    if (nivel(sim.skills[skill]) >= alvo) {
      return { ok: true, valor: { chegou: true, semanas: n, sexta: passo.valor.sexta }, avisos: [] };
    }
  }
  return {
    ok: true,
    valor: { chegou: false, porque: sim.noTecto ? 'tecto' : 'limite' },
    avisos: [],
  };
}

/** O aviso de um objetivo sem número num cenário. */
export function avisoSemEstimativa(
  skill: SkillTsp,
  alvo: number,
  cenario: Cenario,
  porque: 'tecto' | 'limite',
): string {
  const razao = porque === 'tecto' ? 'bate no tecto do potencial' : `mais de ${LIMITE_SEMANAS} semanas`;
  return `sem estimativa para ${skill} ${alvo} no cenário ${NOME_CENARIO[cenario]}: ${razao}`;
}

/** A projeção semana a semana de uma sequência de blocos, num cenário. */
export function projetar(
  j: JogadorTreino,
  blocos: Bloco[],
  treinador: number,
  inicio: Data,
  cenario: Cenario,
): Estimativa<{ semanas: SemanaProjetada[]; parouNoTecto: boolean }> {
  const resolvidos: { bloco: BlocoResolvido; semanas: number }[] = [];
  for (const b of blocos) {
    const r = resolverBloco(j, b, treinador);
    if (!r.ok) return r;
    resolvidos.push({ bloco: r.valor, semanas: b.semanas });
  }

  const sim = novaSimulacao(j, inicio, cenario);
  const semanas: SemanaProjetada[] = [];
  for (const { bloco, semanas: n } of resolvidos) {
    for (let i = 0; i < n; i++) {
      const passo = avancarSemana(sim, j, bloco, treinador);
      if (!passo.ok) return passo;
      semanas.push(passo.valor);
      if (sim.noTecto) return { ok: true, valor: { semanas, parouNoTecto: true }, avisos: sim.avisos };
    }
  }
  return { ok: true, valor: { semanas, parouNoTecto: false }, avisos: sim.avisos };
}

/**
 * As semanas de treino até `skill` chegar a `alvo`, em cada cenário. Um
 * cenário que bate no tecto ou passa das 400 semanas antes do alvo fica `null`.
 */
export function semanasAte(
  j: JogadorTreino,
  bloco: Omit<Bloco, 'semanas'>,
  skill: SkillTsp,
  alvo: number,
  treinador: number,
  inicio: Data,
): Estimativa<Record<Cenario, { semanas: number; sexta: Data } | null>> {
  const resolvido = resolverBloco(j, bloco, treinador);
  if (!resolvido.ok) return resolvido;

  const avisos: string[] = [];
  const valor = {} as Record<Cenario, { semanas: number; sexta: Data } | null>;
  for (const c of CENARIOS) {
    const sim = novaSimulacao(j, inicio, c);
    const r = correrAte(sim, j, resolvido.valor, skill, alvo, treinador);
    if (!r.ok) return r;
    juntarAvisos(avisos, sim.avisos);
    if (r.valor.chegou) {
      valor[c] = { semanas: r.valor.semanas, sexta: r.valor.sexta };
    } else {
      valor[c] = null;
      juntarAvisos(avisos, [avisoSemEstimativa(skill, alvo, c, r.valor.porque)]);
    }
  }
  return { ok: true, valor, avisos };
}
