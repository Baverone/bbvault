/**
 * Valida o jogador de um formulário (strings) antes de qualquer cálculo.
 *
 * As funções de domínio não guardam contra NaN nem contra valores fora do
 * normal; quem as chama valida primeiro. Um campo com erro → nada se calcula.
 *
 * Domínio puro: sem React.
 */

import type { JogadorGuardado } from '../storage/jogador.ts';
import {
  POSICOES,
  POTENCIAIS,
  SKILLS,
  SKILLS_TSP,
  SKILL_MAXIMA,
  validarSkills,
  type Posicao,
  type Skill,
  type Skills,
  type SkillsTsp,
} from './escalas.ts';
import { MOTIVOS } from './treino/modelo.ts';

/** O nível alvo de uma skill: inteiro de 1 a 40 (acima de 20 o jogo chama-lhe «legendary»). */
export const ALVO_MAXIMO = SKILL_MAXIMA;
/** As semanas de uma projeção: de 1 a 98 (uma época). */
export const SEMANAS_MAXIMAS = 98;

/** Os campos do jogador que um formulário pode mostrar (as skills aparecem sempre). */
export type CampoJogador = 'idade' | 'cm' | 'potencial' | 'posicao' | 'minutos';

export const IDADE_MINIMA = 18;
/** Só para apanhar gralhas: o jogo não tem jogadores tão velhos. */
export const IDADE_MAXIMA = 50;
export const CM_MINIMO = 160;
export const CM_MAXIMO = 240;
export const MINUTOS_MAXIMOS = 48;

export type ErrosJogador = Partial<Record<CampoJogador | Skill, string>>;

/** Os valores já em número; só vêm os campos pedidos (as skills do TSP vêm sempre). */
export interface ValoresJogador {
  idade?: number;
  cm?: number;
  potencial?: number;
  posicao?: Posicao;
  minutos?: number;
  skills: SkillsTsp;
  /** As 12 skills; só vêm quando se pediu `exigir12`. */
  skills12?: Skills;
}

export interface OpcoesJogador {
  /** Salário e Avaliação precisam das 12 skills: ST e FT passam a ser obrigatórias. */
  exigir12?: boolean;
}

export interface ResultadoJogador {
  erros: ErrosJogador;
  /** `null` se houver algum erro: nesse caso nada se calcula. */
  valores: ValoresJogador | null;
}

/** Um inteiro escrito só com dígitos (com espaços à volta), ou NaN. */
function inteiro(texto: string): number {
  return /^\s*\d+\s*$/.test(texto) ? Number(texto) : NaN;
}

/** O inteiro escrito em `texto` se estiver entre `min` e `max`; senão `null`. */
export function inteiroEntre(texto: string, min: number, max: number): number | null {
  const n = inteiro(texto);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/**
 * Valida os `campos` pedidos, as 10 skills do TSP (obrigatórias) e ST/FT
 * (opcionais: vazias passam, escritas têm de estar certas). Com `exigir12`,
 * ST e FT também são obrigatórias e os valores trazem as 12 em `skills12`.
 */
export function validarJogador(
  j: JogadorGuardado,
  campos: readonly CampoJogador[],
  opcoes: OpcoesJogador = {},
): ResultadoJogador {
  const exigir12 = opcoes.exigir12 === true;
  const erros: ErrosJogador = {};
  const valores: Omit<ValoresJogador, 'skills'> = {};
  const pede = (c: CampoJogador) => campos.includes(c);

  if (pede('idade')) {
    const n = inteiro(j.idade);
    if (j.idade.trim() === '') erros.idade = 'Indica a idade.';
    else if (!Number.isInteger(n)) erros.idade = 'A idade é um número inteiro.';
    else if (n < IDADE_MINIMA) erros.idade = `${MOTIVOS.idade[0].toUpperCase()}${MOTIVOS.idade.slice(1)}.`;
    else if (n > IDADE_MAXIMA) erros.idade = `A idade vai até aos ${IDADE_MAXIMA} anos.`;
    else valores.idade = n;
  }
  if (pede('cm')) {
    const n = inteiroEntre(j.cm, CM_MINIMO, CM_MAXIMO);
    if (n === null) erros.cm = `A altura é um inteiro entre ${CM_MINIMO} e ${CM_MAXIMO} cm.`;
    else valores.cm = n;
  }
  if (pede('potencial')) {
    const n = inteiroEntre(j.potencial, 0, POTENCIAIS.length - 1);
    if (n === null) erros.potencial = 'Escolhe o potencial.';
    else valores.potencial = n;
  }
  if (pede('posicao')) {
    if (!POSICOES.includes(j.posicao)) erros.posicao = 'Escolhe a posição.';
    else valores.posicao = j.posicao;
  }
  if (pede('minutos')) {
    const n = inteiroEntre(j.minutos, 0, MINUTOS_MAXIMOS);
    if (n === null) erros.minutos = `Os minutos são um inteiro entre 0 e ${MINUTOS_MAXIMOS}.`;
    else valores.minutos = n;
  }

  const todas = validarSkills(j.skills, exigir12 ? SKILLS : SKILLS_TSP);
  if (!todas.ok) {
    for (const s of todas.erradas) erros[s] = `Inteiro de 1 a ${SKILL_MAXIMA}.`;
  }
  if (!exigir12) {
    for (const s of SKILLS) {
      if ((SKILLS_TSP as readonly Skill[]).includes(s)) continue;
      const texto = j.skills[s];
      if (texto.trim() !== '' && !validarSkills(j.skills, [s]).ok) erros[s] = `Inteiro de 1 a ${SKILL_MAXIMA}.`;
    }
  }

  if (Object.keys(erros).length > 0 || !todas.ok) return { erros, valores: null };
  const skills = {} as SkillsTsp;
  for (const s of SKILLS_TSP) skills[s] = todas.skills[s];
  return { erros, valores: { ...valores, skills, ...(exigir12 ? { skills12: todas.skills } : {}) } };
}

/** Os campos que impedem o cálculo, separados por o que se vê no ecrã. */
export interface Pendencias {
  /** Campos vazios: por preencher. */
  faltam: string[];
  /** Campos com texto que não serve (0, letras, fora dos limites): a vermelho. */
  errados: string[];
}

const NOME_CAMPO: Record<CampoJogador, string> = {
  idade: 'idade',
  cm: 'altura',
  potencial: 'potencial',
  posicao: 'posição',
  minutos: 'minutos',
};

/** Divide os erros do jogador em «faltam» (vazios) e «errados» (com texto inválido). */
export function pendencias(
  j: JogadorGuardado,
  campos: readonly CampoJogador[],
  opcoes: OpcoesJogador = {},
): Pendencias {
  const { erros } = validarJogador(j, campos, opcoes);
  const faltam: string[] = [];
  const errados: string[] = [];
  const junta = (nome: string, texto: string) => (texto.trim() === '' ? faltam : errados).push(nome);
  for (const c of campos) {
    if (erros[c] === undefined) continue;
    junta(NOME_CAMPO[c], c === 'posicao' ? 'x' : j[c]);
  }
  for (const s of SKILLS) {
    if (erros[s] !== undefined) junta(s, j.skills[s]);
  }
  return { faltam, errados };
}
