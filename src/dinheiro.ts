/**
 * Dinheiro para mostrar e para ler: inteiros com o separador de milhares pt-PT.
 * Puro (sem React).
 */

/** Só dígitos, ou grupos de 3 dígitos separados por espaço (também o fixo) ou ponto. */
const SO_DIGITOS = /^\d+$/;
const COM_MILHARES = /^\d{1,3}(?:[.\s]\d{3})+$/;

/**
 * O valor escrito como inteiro ≥ 0, ou `null`. Aceita `293833`, `293 833` e
 * `293.833` (o ponto é separador de milhares, não casa decimal). O resto —
 * vazio, letras, sinais, vírgulas, grupos mal formados — não é um valor.
 */
export function lerDinheiro(texto: string): number | null {
  const t = texto.trim();
  if (!SO_DIGITOS.test(t) && !COM_MILHARES.test(t)) return null;
  const n = Number(t.replace(/[.\s]/g, ''));
  return Number.isSafeInteger(n) ? n : null;
}

const MILHARES = new Intl.NumberFormat('pt-PT', { useGrouping: 'always', maximumFractionDigits: 0 });
const UMA_CASA = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 1 });

/** `293833` como `293 833` (espaço fixo; também com 4 dígitos, que o pt-PT por defeito não agrupa). */
export function formatarDinheiro(n: number): string {
  return MILHARES.format(n);
}

/** Uma fração como percentagem com uma casa: `0.0572` → `5,7%`. */
export function formatarPercentagem(fracao: number): string {
  return `${UMA_CASA.format(fracao * 100)}%`;
}
