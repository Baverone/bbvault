/**
 * O modelo de treino da spec (secção 4.1): a tabela de treinos e o ganho
 * semanal na primária. Os números vêm todos do `treino.json`; quando não há
 * número para um caso, a resposta é «sem estimativa», com o motivo.
 *
 * Domínio puro: sem React.
 */

import treino from '../../data/treino.json' with { type: 'json' };
import type { Posicao, SkillTsp, SkillsTsp } from '../escalas.ts';

/** Uma resposta com número (e os avisos que se aplicam) ou sem estimativa. */
export type Estimativa<T> = { ok: true; valor: T; avisos: string[] } | { ok: false; motivo: string };

export type Cenario = 'rapido' | 'esperado' | 'lento';
export const CENARIOS: readonly Cenario[] = ['rapido', 'esperado', 'lento'];
export const NOME_CENARIO: Record<Cenario, string> = {
  rapido: 'rápido',
  esperado: 'esperado',
  lento: 'lento',
};

/** O multiplicador do ganho e o valor somado ao nível visível no arranque. */
export const PARAMETROS_CENARIO: Record<Cenario, { mult: number; inicio: number }> = treino.cenarios;

/** A fração do ganho da primária que cada secundária ganha. */
export const FRACAO_SECUNDARIA: number = treino.secundaria;

export interface JogadorTreino {
  idade: number;
  cm: number;
  potencial: number;
  skills: SkillsTsp;
  posicao: Posicao;
  minutos: number;
}

/** Um bloco de treino: o id do treino, o grupo de posições e quantas semanas. */
export interface Bloco {
  treino: string;
  grupo: Posicao[];
  semanas: number;
}

export interface GrupoTreino {
  posicoes: Posicao[];
  secundarias: SkillTsp[];
}

export interface Treino {
  id: string;
  nome: string;
  primaria: SkillTsp;
  grupos: GrupoTreino[];
}

/** A tabela de treinos (o `dados.test.ts` confere as siglas e as posições). */
export const TREINOS: readonly Treino[] = treino.treinos as Treino[];

/** Os grupos de posições do treino que incluem `posicao`, pela ordem da tabela. */
export function gruposCom(treinoId: string, posicao: Posicao): Posicao[][] {
  const t = TREINOS.find((x) => x.id === treinoId);
  if (!t) return [];
  return t.grupos.filter((g) => g.posicoes.includes(posicao)).map((g) => [...g.posicoes]);
}

export const MOTIVOS = {
  idade: 'no BuzzerBeater não há jogadores com menos de 18 anos',
  treinador: 'sem dados para treinadores de nível 1–2',
  tresPosicoes: 'sem dados para treinos de 3 posições',
  foraDoGrupo: 'o jogador não joga em nenhuma posição deste grupo, por isso não treina',
} as const;

export const AVISOS = {
  idadeAcima28: 'sem curva acima dos 28; usado o fator dos 28',
  minutos: 'treino parcial: o manual diz que treina menos; os dados do autor sugerem quase zero',
  duasPosicoes: 'fator de 2 posições é estimativa',
  tecto: 'a partir daqui o treino abranda muito; não há número',
  semTecto: 'sem tecto conhecido para este potencial',
} as const;

/** Junta avisos a uma lista, sem repetir e pela ordem em que aparecem. */
export function juntarAvisos(lista: string[], novos: readonly string[]): void {
  for (const a of novos) if (!lista.includes(a)) lista.push(a);
}

const FATOR_IDADE: Record<string, number> = treino.fatorIdade;
const FATOR_TREINADOR: Record<string, number> = treino.fatorTreinador;
const FATOR_POSICOES: Record<string, number> = treino.fatorPosicoes;
const IDADE_MAXIMA_CURVA = 28;

/** O limiar de minutos para a idade (o primeiro escalão com `ate` ≥ idade). */
function limiarMinutos(idade: number): number {
  const escalao = treino.limiarMinutos.find((l) => idade <= l.ate);
  return (escalao ?? treino.limiarMinutos[treino.limiarMinutos.length - 1]).minutos;
}

/**
 * O ganho semanal na primária, no cenário esperado:
 * base × idade × treinador × posições × minutos.
 */
export function ganhoSemanal(
  idade: number,
  minutos: number,
  treinador: number,
  nPosicoes: number,
): Estimativa<number> {
  if (!(idade >= 18)) return { ok: false, motivo: MOTIVOS.idade };
  if (!(treinador >= 3)) return { ok: false, motivo: MOTIVOS.treinador };
  const fTreinador = FATOR_TREINADOR[String(treinador)];
  if (fTreinador === undefined) {
    return { ok: false, motivo: `sem dados para treinadores de nível ${treinador}` };
  }
  if (nPosicoes >= 3) return { ok: false, motivo: MOTIVOS.tresPosicoes };
  const fPosicoes = FATOR_POSICOES[String(nPosicoes)];
  if (fPosicoes === undefined) {
    return { ok: false, motivo: `sem dados para treinos de ${nPosicoes} posições` };
  }
  if (!(minutos >= 0)) return { ok: false, motivo: 'minutos inválidos' };

  const avisos: string[] = [];
  const idadeCurva = Math.min(Math.trunc(idade), IDADE_MAXIMA_CURVA);
  if (idade > IDADE_MAXIMA_CURVA) avisos.push(AVISOS.idadeAcima28);
  const fIdade = FATOR_IDADE[String(idadeCurva)];

  const limiar = limiarMinutos(idade);
  let fMinutos = 1;
  if (minutos < limiar - treino.folgaMinutos) {
    // Abaixo da folga, o fator é minutos ÷ limiar (sem descontar a folga).
    fMinutos = minutos / limiar;
    avisos.push(AVISOS.minutos);
  }
  if (nPosicoes === 2) avisos.push(AVISOS.duasPosicoes);

  return { ok: true, valor: treino.base * fIdade * fTreinador * fPosicoes * fMinutos, avisos };
}
