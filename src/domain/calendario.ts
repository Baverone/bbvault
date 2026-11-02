/**
 * O calendário do BuzzerBeater: datas `AAAA-MM-DD` com aritmética em UTC.
 * Nunca se usa a hora local, para o resultado não mudar com o fuso do PC.
 *
 * Domínio puro: sem React.
 */

export type Data = string;

const MS_DIA = 86_400_000;

/** A data `AAAA-MM-DD` como número de dias desde 1970-01-01 (UTC). */
function paraDias(d: Data): number {
  const [ano, mes, dia] = d.split('-').map(Number);
  return Date.UTC(ano, mes - 1, dia) / MS_DIA;
}

/** O número de dias desde 1970-01-01 (UTC) como `AAAA-MM-DD`. */
function deDias(dias: number): Data {
  return new Date(dias * MS_DIA).toISOString().slice(0, 10);
}

/** A data `d` mais `n` dias (`n` pode ser negativo). */
export function somarDias(d: Data, n: number): Data {
  return deDias(paraDias(d) + n);
}

/** A primeira sexta-feira a partir de `d`, incluindo `d`. */
export function proximaSexta(d: Data): Data {
  const SEXTA = 5;
  const diaSemana = new Date(paraDias(d) * MS_DIA).getUTCDay();
  return somarDias(d, (SEXTA - diaSemana + 7) % 7);
}

/** Uma sexta em que a idade dos jogadores muda, conta a partir desta. */
export const MUDANCA_IDADE_ANCORA: Data = '2026-11-13';

/** Os dias entre duas mudanças de idade. */
export const PERIODO_EPOCA_DIAS = 98;

/**
 * Verdadeiro quando `sexta` é uma mudança de idade: a diferença de dias para a
 * âncora é múltipla de 98. O módulo é positivo, para contar também para trás.
 */
export function eMudancaDeIdade(sexta: Data): boolean {
  const diferenca = paraDias(sexta) - paraDias(MUDANCA_IDADE_ANCORA);
  return ((diferenca % PERIODO_EPOCA_DIAS) + PERIODO_EPOCA_DIAS) % PERIODO_EPOCA_DIAS === 0;
}

/**
 * Os dias de `hoje` até à próxima mudança de idade, de 1 a 98. Se `hoje` já é
 * a sexta da mudança, a idade acabou de subir e a seguinte está a 98 dias.
 */
export function diasAteMudancaDeIdade(hoje: Data): number {
  const diferenca = paraDias(hoje) - paraDias(MUDANCA_IDADE_ANCORA);
  const passados = ((diferenca % PERIODO_EPOCA_DIAS) + PERIODO_EPOCA_DIAS) % PERIODO_EPOCA_DIAS;
  return PERIODO_EPOCA_DIAS - passados;
}
