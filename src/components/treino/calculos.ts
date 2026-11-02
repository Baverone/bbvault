/**
 * A cola entre os formulários da página de Treino e o domínio: valida o que se
 * escreveu e só então chama `semanasAte`, `planear` e `projetar`. Puro (sem React).
 */

import { tsp, type SkillTsp } from '../../domain/escalas.ts';
import { somarDias, type Data } from '../../domain/calendario.ts';
import { ALVO_MAXIMO, SEMANAS_MAXIMAS, inteiroEntre, type Pendencias } from '../../domain/validacao.ts';
import {
  CENARIOS,
  juntarAvisos,
  type Bloco,
  type Cenario,
  type Estimativa,
  type JogadorTreino,
} from '../../domain/treino/modelo.ts';
import { planear } from '../../domain/treino/plano.ts';
import { projetar, semanasAte, type SemanaProjetada } from '../../domain/treino/projecao.ts';

export type BlocoBase = Omit<Bloco, 'semanas'>;

/** Uma linha «skill → nível alvo» do cartão «Que treino dar». */
export interface LinhaObjetivo {
  skill: SkillTsp;
  alvo: string;
}

export const ERRO_ALVO = `O nível alvo é um inteiro entre 1 e ${ALVO_MAXIMO}.`;

/** O nível alvo escrito, ou `null` se não for um inteiro de 1 a 40. */
export function lerAlvo(texto: string): number | null {
  return inteiroEntre(texto, 1, ALVO_MAXIMO);
}

export interface LinhasValidadas {
  /** Um erro por linha (alinhado com `linhas`); `undefined` onde está certo ou vazio. */
  erros: (string | undefined)[];
  /** Os objetivos, só se não houver erros e houver pelo menos uma linha preenchida. */
  objetivos: Partial<Record<SkillTsp, number>> | null;
  /** Nenhuma linha tem nível alvo escrito. */
  vazio: boolean;
}

/** Linhas sem nível alvo ficam de fora; as escritas têm de estar certas e a skill não se repete. */
export function validarLinhas(linhas: readonly LinhaObjetivo[]): LinhasValidadas {
  const erros: (string | undefined)[] = linhas.map(() => undefined);
  const objetivos: Partial<Record<SkillTsp, number>> = {};
  let preenchidas = 0;
  linhas.forEach((l, i) => {
    if (l.alvo.trim() === '') return;
    preenchidas += 1;
    const alvo = lerAlvo(l.alvo);
    if (alvo === null) erros[i] = ERRO_ALVO;
    else if (objetivos[l.skill] !== undefined) erros[i] = `${l.skill} já tem um objetivo noutra linha.`;
    else objetivos[l.skill] = alvo;
  });
  const haErros = erros.some((e) => e !== undefined);
  return { erros, objetivos: haErros || preenchidas === 0 ? null : objetivos, vazio: preenchidas === 0 };
}

export type SemanasAte = Estimativa<Record<Cenario, { semanas: number; sexta: Data } | null>>;

/** Quanto tempo até a skill chegar ao alvo, com o bloco escolhido. */
export function tempoAteAlvo(
  j: JogadorTreino,
  bloco: BlocoBase,
  skill: SkillTsp,
  alvo: number,
  treinador: number,
  inicio: Data,
): SemanasAte {
  return semanasAte(j, bloco, skill, alvo, treinador, inicio);
}

export type ResultadoPlano = ReturnType<typeof planear>;

/** Um plano é completo quando o cenário esperado chega a todos os objetivos. */
export function planoCompleto(r: ResultadoPlano): boolean {
  return r.ok && r.valor.total.esperado !== null;
}

/** O plano só serve de base à projeção se for completo e tiver blocos. */
export function blocosDoPlano(r: ResultadoPlano | null): Bloco[] | null {
  if (!r || !r.ok || !planoCompleto(r) || r.valor.blocos.length === 0) return null;
  return r.valor.blocos;
}

/**
 * Os blocos para projetar `n` semanas. Com plano, corta-se nas `n` semanas (se o
 * plano for mais curto, a projeção fica pelo plano); sem plano, é o treino
 * escolhido durante as `n` semanas.
 */
export function blocosParaProjecao(plano: Bloco[] | null, escolhido: BlocoBase, n: number): Bloco[] {
  if (plano === null) return [{ ...escolhido, grupo: [...escolhido.grupo], semanas: n }];
  const blocos: Bloco[] = [];
  let restam = n;
  for (const b of plano) {
    if (restam <= 0) break;
    const semanas = Math.min(b.semanas, restam);
    blocos.push({ ...b, grupo: [...b.grupo], semanas });
    restam -= semanas;
  }
  return blocos;
}

/** As semanas pedidas, ou `null` se não forem um inteiro de 1 a 98. */
export function lerSemanas(texto: string): number | null {
  return inteiroEntre(texto, 1, SEMANAS_MAXIMAS);
}

export interface ProjecaoCenario {
  semanas: SemanaProjetada[];
  parouNoTecto: boolean;
  /** O TSP no fim da projeção (ou onde parou, no tecto). */
  tspFinal: number;
}

export type ResultadoProjecao = Estimativa<{
  porCenario: Record<Cenario, ProjecaoCenario>;
  tspAtual: number;
  /** As semanas projetadas (menos do que as pedidas se o plano é mais curto). */
  semanasPlano: number;
}>;

/** A projeção nos três cenários; um `ok: false` (o mesmo motivo em todos) vale para todos. */
export function projetarTres(
  j: JogadorTreino,
  blocos: Bloco[],
  treinador: number,
  inicio: Data,
): ResultadoProjecao {
  const avisos: string[] = [];
  const porCenario = {} as Record<Cenario, ProjecaoCenario>;
  for (const c of CENARIOS) {
    const r = projetar(j, blocos, treinador, inicio, c);
    if (!r.ok) return r;
    juntarAvisos(avisos, r.avisos);
    const ultima = r.valor.semanas[r.valor.semanas.length - 1];
    porCenario[c] = { ...r.valor, tspFinal: ultima ? ultima.tsp : tsp(j.skills) };
  }
  const semanasPlano = blocos.reduce((soma, b) => soma + b.semanas, 0);
  return { ok: true, valor: { porCenario, tspAtual: tsp(j.skills), semanasPlano }, avisos };
}

/** A primeira e a última sexta de um bloco que começa depois de `antes` semanas. */
export function sextasDoBloco(inicio: Data, antes: number, semanas: number): { de: Data; ate: Data } {
  return { de: somarDias(inicio, 7 * antes), ate: somarDias(inicio, 7 * (antes + semanas - 1)) };
}

/**
 * A frase sobre o que impede o cálculo do jogador: os campos a vermelho (texto
 * inválido) e os que faltam preencher (vazios). Só diz «a vermelho» do que o é.
 */
export function textoPendencias({ faltam, errados }: Pendencias): string {
  const partes: string[] = [];
  if (errados.length > 0) partes.push(`corrige os campos a vermelho (${errados.join(', ')})`);
  if (faltam.length > 0) partes.push(`faltam campos por preencher: ${faltam.join(', ')}`);
  const frase = partes.join('; ');
  return `${frase[0].toUpperCase()}${frase.slice(1)}. Enquanto assim estiver, nada é calculado.`;
}
