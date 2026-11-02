/**
 * O jogador do formulário, guardado no browser para as páginas o partilharem.
 *
 * Guardam-se as STRINGS tal como foram escritas (um campo vazio ou meio escrito
 * também se guarda), não números. Ler e escrever nunca atiram: numa janela
 * privada, ou com os dados do site bloqueados, o `localStorage` pode atirar logo
 * no acesso; as páginas abrem e calculam na mesma, só não se lembram.
 */

import { POSICOES, SKILLS, type Posicao, type Skill } from '../domain/escalas.ts';

export const CHAVE_JOGADOR = 'bbvault:jogador';

export interface JogadorGuardado {
  idade: string;
  cm: string;
  /** O índice do potencial (0–11) como texto; '' quando ainda não foi escolhido. */
  potencial: string;
  posicao: Posicao;
  minutos: string;
  skills: Record<Skill, string>;
}

/** O formulário por preencher (48 minutos é o valor de referência da spec). */
export function jogadorVazio(): JogadorGuardado {
  const skills = {} as Record<Skill, string>;
  for (const s of SKILLS) skills[s] = '';
  return { idade: '', cm: '', potencial: '', posicao: POSICOES[0], minutos: '48', skills };
}

function eTexto(v: unknown): v is string {
  return typeof v === 'string';
}

/** Confere a forma do que veio do armazenamento; o que falta nas skills fica vazio. */
function comoJogador(v: unknown): JogadorGuardado | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  const { posicao } = o;
  if (!eTexto(o.idade) || !eTexto(o.cm) || !eTexto(o.potencial) || !eTexto(o.minutos)) return null;
  if (!eTexto(posicao) || !(POSICOES as readonly string[]).includes(posicao)) return null;
  if (typeof o.skills !== 'object' || o.skills === null) return null;
  const bruto = o.skills as Record<string, unknown>;
  const vazio = jogadorVazio();
  for (const s of SKILLS) {
    const valor = bruto[s];
    if (valor !== undefined && !eTexto(valor)) return null;
    vazio.skills[s] = valor ?? '';
  }
  return {
    idade: o.idade,
    cm: o.cm,
    potencial: o.potencial,
    posicao: posicao as Posicao,
    minutos: o.minutos,
    skills: vazio.skills,
  };
}

/** O jogador guardado, ou `null` se não há, está estragado ou o armazenamento está bloqueado. */
export function lerJogador(): JogadorGuardado | null {
  try {
    const texto = globalThis.localStorage?.getItem(CHAVE_JOGADOR);
    if (!texto) return null;
    return comoJogador(JSON.parse(texto));
  } catch {
    return null;
  }
}

/** Guarda o jogador; se o armazenamento estiver bloqueado, não faz nada. */
export function guardarJogador(j: JogadorGuardado): void {
  try {
    globalThis.localStorage?.setItem(CHAVE_JOGADOR, JSON.stringify(j));
  } catch {
    // Janela privada ou dados do site bloqueados: segue-se sem guardar.
  }
}
