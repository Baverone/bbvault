/**
 * O plano de treino para uma lista de objetivos (skill → nível): uma sequência
 * de blocos «treino X durante N semanas». Regras da spec, 3.1 e 4.1.
 *
 * Domínio puro: sem React.
 */

import type { Posicao, SkillTsp } from '../escalas.ts';
import { somarDias, type Data } from '../calendario.ts';
import { CENARIOS, TREINOS, juntarAvisos, type Bloco, type Cenario, type Estimativa, type JogadorTreino } from './modelo.ts';
import {
  avisoSemEstimativa,
  correrAte,
  novaSimulacao,
  resolverBloco,
  semanasAte,
  type BlocoResolvido,
} from './projecao.ts';

interface Objetivo {
  skill: SkillTsp;
  alvo: number;
  bloco: BlocoResolvido;
  /** Semanas que levaria sozinho no cenário esperado (Infinity se não chega). */
  sozinho: number;
}

/** O treino cuja primária é `skill`, com o grupo mais estreito que inclui a posição. */
function escolherGrupo(skill: SkillTsp, posicao: Posicao): Omit<Bloco, 'semanas'> | null {
  let melhor: Omit<Bloco, 'semanas'> | null = null;
  for (const t of TREINOS) {
    if (t.primaria !== skill) continue;
    for (const g of t.grupos) {
      if (!g.posicoes.includes(posicao)) continue;
      if (melhor === null || g.posicoes.length < melhor.grupo.length) {
        melhor = { treino: t.id, grupo: [...g.posicoes] };
      }
    }
  }
  return melhor;
}

/**
 * Planeia os blocos: começa pelo objetivo que leva mais semanas sozinho e
 * simula em sequência, com as secundárias a contar para os blocos seguintes.
 * `blocos` e `fim` são do cenário esperado; `total` é de cada cenário.
 */
export function planear(
  j: JogadorTreino,
  objetivos: Partial<Record<SkillTsp, number>>,
  treinador: number,
  inicio: Data,
): Estimativa<{ blocos: Bloco[]; total: Record<Cenario, number | null>; fim: Data | null }> {
  const lista: Objetivo[] = [];
  for (const [skill, alvo] of Object.entries(objetivos) as [SkillTsp, number | undefined][]) {
    if (alvo === undefined) continue;
    const escolha = escolherGrupo(skill, j.posicao);
    if (!escolha) return { ok: false, motivo: `nenhum treino de ${skill} inclui a posição ${j.posicao}` };
    const bloco = resolverBloco(j, escolha, treinador);
    if (!bloco.ok) return bloco;
    const sozinho = semanasAte(j, escolha, skill, alvo, treinador, inicio);
    if (!sozinho.ok) return sozinho;
    lista.push({ skill, alvo, bloco: bloco.valor, sozinho: sozinho.valor.esperado?.semanas ?? Infinity });
  }
  // O sort é estável: nos empates fica a ordem da entrada.
  lista.sort((a, b) => (a.sozinho === b.sozinho ? 0 : a.sozinho > b.sozinho ? -1 : 1));

  const avisos: string[] = [];
  const total = {} as Record<Cenario, number | null>;
  let blocos: Bloco[] = [];
  for (const c of CENARIOS) {
    const sim = novaSimulacao(j, inicio, c);
    const blocosC: Bloco[] = [];
    let semanas: number | null = 0;
    let falha: string | null = null;
    for (const o of lista) {
      const r = correrAte(sim, j, o.bloco, o.skill, o.alvo, treinador);
      if (!r.ok) return r;
      if (!r.valor.chegou) {
        falha = avisoSemEstimativa(o.skill, o.alvo, c, r.valor.porque);
        semanas = null;
        break;
      }
      // Um objetivo já atingido quando chega a sua vez não gera bloco.
      if (r.valor.semanas > 0) {
        blocosC.push({ treino: o.bloco.treino, grupo: [...o.bloco.grupo], semanas: r.valor.semanas });
        semanas += r.valor.semanas;
      }
    }
    juntarAvisos(avisos, sim.avisos);
    if (falha) juntarAvisos(avisos, [falha]);
    total[c] = semanas;
    if (c === 'esperado') blocos = blocosC;
  }

  const t = total.esperado;
  const fim = t === null ? null : t === 0 ? inicio : somarDias(inicio, 7 * (t - 1));
  return { ok: true, valor: { blocos, total, fim }, avisos };
}
