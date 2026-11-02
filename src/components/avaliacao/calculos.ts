/**
 * Pequenas contas da página de Avaliação que o domínio não dá: o texto das
 * bandas de altura, os intervalos p25–p75 de cada perfil e a posição do TSP
 * face ao tecto. Puro (sem React).
 */

import curvas from '../../data/curvas.json' with { type: 'json' };
import type { SkillTsp } from '../../domain/escalas.ts';

/** `<=187` → `≤187 cm`, `188-195` → `188–195 cm`, `>=213` → `≥213 cm`. */
export function rotuloBanda(banda: string): string {
  return `${banda.replace('<=', '≤').replace('>=', '≥').replace('-', '–')} cm`;
}

export interface IntervaloSkill {
  p25: number;
  p75: number;
}

export interface PerfilBanda {
  /** Quantos internacionais tem o perfil. */
  n: number;
  amostraPequena: boolean;
  skills: Record<SkillTsp, IntervaloSkill>;
}

/** O intervalo p25–p75 de cada skill na banda (o mesmo que `compararPerfil` usa). */
export function intervalosDaBanda(banda: string): PerfilBanda {
  const perfil = (curvas.perfisAltura as Record<string, (typeof curvas.perfisAltura)['188-195'] | undefined>)[banda];
  if (!perfil) throw new Error(`banda de altura desconhecida: ${banda}`);
  const skills = {} as Record<SkillTsp, IntervaloSkill>;
  for (const k of Object.keys(perfil.skills) as SkillTsp[]) {
    skills[k] = { p25: perfil.skills[k].p25, p75: perfil.skills[k].p75 };
  }
  return { n: perfil.n, amostraPequena: perfil.amostraPequena, skills };
}

/** Poucos internacionais na banda (menos de 10) ou marcada como amostra pequena: o perfil é só indicativo. */
export function perfilIndicativo(perfil: Pick<PerfilBanda, 'n' | 'amostraPequena'>): boolean {
  return perfil.n < 10 || perfil.amostraPequena;
}

export type SituacaoTecto = 'sem' | 'abaixo' | 'no' | 'acima';

/** O TSP atual contra o tecto do potencial (`null` = potencial sem tecto). */
export function situacaoTecto(tspAtual: number, tecto: number | null): SituacaoTecto {
  if (tecto === null) return 'sem';
  if (tspAtual > tecto) return 'acima';
  return tspAtual === tecto ? 'no' : 'abaixo';
}

export interface LinhaProjecao {
  idade: 24 | 26 | 28;
  mediana: number;
  p90: number;
}

/**
 * As linhas da tabela do potencial. Se o TSP atual já chega ao tecto não há
 * dados acima dele: não há linhas e vem a mensagem. Nas outras, nenhuma célula
 * fica abaixo do TSP atual.
 */
export function linhasProjecao(
  tspAtual: number,
  tecto: number | null,
  aos: readonly LinhaProjecao[],
): { linhas: LinhaProjecao[]; mensagem: string | null } {
  if (tecto !== null && tspAtual >= tecto) {
    return {
      linhas: [],
      mensagem: `O TSP atual (${tspAtual}) já chega ao máximo visto para este potencial (${tecto}). Acima disso não há dados, por isso não há projeção.`,
    };
  }
  return {
    linhas: aos.map((a) => ({
      idade: a.idade,
      mediana: Math.max(tspAtual, a.mediana),
      p90: Math.max(tspAtual, a.p90),
    })),
    mensagem: null,
  };
}
