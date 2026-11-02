/**
 * A previsão de salário (spec 3.2 / 4.2) e o orçamento semanal.
 *
 * O ajuste vem do `salario.json`: ln(salário) = a + Σ b·skill, por posição.
 * Não há SG na amostra, por isso o SG é a média de PG e SF. Domínio puro.
 */
import salario from '../data/salario.json' with { type: 'json' };
import { SKILLS } from './escalas.ts';
import type { Posicao, Skill, Skills } from './escalas.ts';

export type Divisao = 1 | 2 | 3 | 4 | 5 | 6;

export interface ModeloSalario {
  a: number;
  b: Record<Skill, number>;
  erroMediano: number;
  derivado: boolean;
}

const NOTA_SG = 'poucos SG na amostra: média de PG e SF';

type PosicaoAjustada = Exclude<Posicao, 'SG'>;

/** O modelo de uma posição; o SG é derivado (média de PG e SF). */
export function modeloSalario(pos: Posicao): ModeloSalario {
  if (pos === 'SG') {
    const pg = salario.posicoes.PG;
    const sf = salario.posicoes.SF;
    const b = {} as Record<Skill, number>;
    for (const k of SKILLS) b[k] = (pg.b[k] + sf.b[k]) / 2;
    return {
      a: (pg.a + sf.a) / 2,
      b,
      erroMediano: Math.max(pg.erroMediano, sf.erroMediano),
      derivado: true,
    };
  }
  const m = salario.posicoes[pos as PosicaoAjustada];
  return { a: m.a, b: { ...m.b }, erroMediano: m.erroMediano, derivado: false };
}

/** O salário previsto (inteiro), a margem (erro mediano do ajuste) e a nota. */
export function preverSalario(
  pos: Posicao,
  s: Skills,
): { salario: number; margem: number; nota: string | null } {
  const m = modeloSalario(pos);
  let soma = m.a;
  for (const k of SKILLS) soma += m.b[k] * s[k];
  return {
    salario: Math.round(Math.exp(soma)),
    margem: m.erroMediano,
    nota: m.derivado ? NOTA_SG : null,
  };
}

/** O piso salarial como fração do contrato de TV, por divisão (spec 4.2). */
export const PISO_POR_DIVISAO: Record<Divisao, number> = {
  1: 2.415,
  2: 1.87,
  3: 1.3,
  4: 1.0,
  5: 0.7,
  6: 0.7,
};

/** O piso semanal da divisão, arredondado às unidades. */
export function pisoSalarial(divisao: Divisao, contratoTv: number): number {
  return Math.round(PISO_POR_DIVISAO[divisao] * contratoTv);
}

export interface Orcamento {
  semana: number;
  piso: number;
  pagoPorSemana: number;
  diferenca: number;
  epoca: { min: number; max: number };
}

/** A folha semanal contra o piso; a época tem entre 12 e 14 semanas pagas. */
export function orcamento(salarios: number[], divisao: Divisao, contratoTv: number): Orcamento {
  const semana = salarios.reduce((soma, v) => soma + v, 0);
  const piso = pisoSalarial(divisao, contratoTv);
  const pagoPorSemana = Math.max(semana, piso);
  return {
    semana,
    piso,
    pagoPorSemana,
    diferenca: semana - piso,
    epoca: { min: 12 * pagoPorSemana, max: 14 * pagoPorSemana },
  };
}
