/** Datas para mostrar: a de hoje (UTC) e o formato dia/mês. */

import type { Data } from './domain/calendario.ts';

/** A data de hoje como `AAAA-MM-DD`, pelos getters UTC (nunca a hora local). */
export function hojeUtc(agora: Date = new Date()): Data {
  const dois = (n: number) => String(n).padStart(2, '0');
  const ano = String(agora.getUTCFullYear()).padStart(4, '0');
  return `${ano}-${dois(agora.getUTCMonth() + 1)}-${dois(agora.getUTCDate())}`;
}

/** `AAAA-MM-DD` como `DD/MM` (ou `DD/MM/AAAA` com `comAno`). */
export function formatarData(d: Data, comAno = false): string {
  const [ano, mes, dia] = d.split('-');
  return comAno ? `${dia}/${mes}/${ano}` : `${dia}/${mes}`;
}
