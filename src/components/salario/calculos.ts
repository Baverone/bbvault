/**
 * A cola entre os formulários da página de Salário e o domínio: lê o que se
 * escreveu, valida, e só então chama `orcamento`. Puro (sem React).
 */

import salario from '../../data/salario.json' with { type: 'json' };
import { POSICOES, type Posicao, type Skills } from '../../domain/escalas.ts';
import { modeloSalario, orcamento, pisoSalarial, type Divisao, type Orcamento } from '../../domain/salario.ts';
import { inteiroEntre } from '../../domain/validacao.ts';
import { lerDinheiro } from '../../dinheiro.ts';

/** As divisões em algarismos romanos, de I a VI (o índice + 1 é o número). */
export const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;

export const ERRO_SALARIO = 'O salário é um inteiro, por exemplo 293833, 293 833 ou 293.833.';
export const ERRO_TV = 'O contrato de TV é um valor acima de 0, por exemplo 157 130.';

/** Uma linha «nome (opcional), salário» do orçamento. O `id` serve de chave React. */
export interface LinhaSalario {
  id: number;
  nome: string;
  salario: string;
}

/** A divisão escolhida (1 a 6), ou `null`. */
export function lerDivisao(texto: string): Divisao | null {
  return inteiroEntre(texto, 1, 6) as Divisao | null;
}

/** O contrato de TV por semana: um valor acima de 0, ou `null`. */
export function lerContratoTv(texto: string): number | null {
  const n = lerDinheiro(texto);
  return n !== null && n > 0 ? n : null;
}

export interface SalariosValidados {
  /** Um erro por linha (alinhado com `linhas`); `undefined` onde está certo ou vazio. */
  erros: (string | undefined)[];
  /** Os salários das linhas preenchidas; `null` se alguma linha tiver erro. */
  valores: number[] | null;
  /** Nenhuma linha tem salário escrito. */
  vazio: boolean;
}

/** Linhas sem salário ficam de fora; as escritas têm de ser inteiros ≥ 0. */
export function validarSalarios(linhas: readonly LinhaSalario[]): SalariosValidados {
  const erros: (string | undefined)[] = linhas.map(() => undefined);
  const valores: number[] = [];
  linhas.forEach((l, i) => {
    if (l.salario.trim() === '') return;
    const n = lerDinheiro(l.salario);
    if (n === null) erros[i] = ERRO_SALARIO;
    else valores.push(n);
  });
  const haErros = erros.some((e) => e !== undefined);
  return { erros, valores: haErros ? null : valores, vazio: valores.length === 0 && !haErros };
}

export interface ResultadoOrcamento {
  /** Os erros por linha (alinhados com `linhas`). */
  erros: (string | undefined)[];
  /** O erro do contrato de TV, só se escreveram algo que não serve. */
  erroTv: string | undefined;
  haErrosLinhas: boolean;
  /** Nenhum salário escrito. */
  semSalarios: boolean;
  /** O salário mínimo da divisão; `null` sem divisão ou sem contrato de TV certo. */
  piso: number | null;
  /** O orçamento completo; `null` se faltar o piso ou os salários, ou houver erros. */
  orcamento: Orcamento | null;
}

/** Valida tudo o que se escreveu e só calcula com o que está certo. */
export function calcularOrcamento(linhas: readonly LinhaSalario[], divisao: string, tv: string): ResultadoOrcamento {
  const salarios = validarSalarios(linhas);
  const d = lerDivisao(divisao);
  const contrato = lerContratoTv(tv);
  const erroTv = tv.trim() !== '' && contrato === null ? ERRO_TV : undefined;
  const piso = d !== null && contrato !== null ? pisoSalarial(d, contrato) : null;
  return {
    erros: salarios.erros,
    erroTv,
    haErrosLinhas: salarios.valores === null,
    semSalarios: salarios.vazio,
    piso,
    orcamento:
      d !== null && contrato !== null && salarios.valores !== null && !salarios.vazio
        ? orcamento(salarios.valores, d, contrato)
        : null,
  };
}

/** Alguma skill acima de 20: o modelo foi ajustado na escala do jogo e passa a extrapolar. */
export function haSkillsAcimaDe20(skills: Skills): boolean {
  return Object.values(skills).some((v) => v > 20);
}

export interface LinhaModelo {
  posicao: Posicao;
  /** Os jogadores do ajuste; `null` no SG, que não tem ajuste próprio. */
  amostra: number | null;
  /** O erro mediano relativo do ajuste (fração). */
  erro: number;
  derivado: boolean;
}

/** O que a nota de método diz de cada posição: a amostra e o erro do `salario.json`. */
export function resumoModelo(): LinhaModelo[] {
  return POSICOES.map((posicao) => {
    const m = modeloSalario(posicao);
    const ajustada = m.derivado ? null : salario.posicoes[posicao as Exclude<Posicao, 'SG'>];
    return { posicao, amostra: ajustada?.amostra ?? null, erro: m.erroMediano, derivado: m.derivado };
  });
}
