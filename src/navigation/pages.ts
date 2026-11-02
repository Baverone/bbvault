/**
 * A NAVEGAÇÃO, num sítio só.
 *
 * A barra de topo, o título de cada página e os cartões do Início saem todos
 * desta lista. Uma página nova é uma linha aqui, e não um botão novo numa barra.
 *
 * O título de cada página é o MESMO rótulo do menu: carregar em «Treino» e
 * chegar a uma página com outro nome é a página a discordar do menu.
 */
export type PageId = 'inicio' | 'treino' | 'salario' | 'avaliacao';

export interface PageMeta {
  id: PageId;
  label: string;
  /** A frase curta que diz para que serve (cartões do Início). */
  nota: string;
  /** O subtítulo do cabeçalho da página. */
  subtitulo: string;
}

export const PAGES: readonly PageMeta[] = [
  {
    id: 'inicio',
    label: 'Início',
    nota: 'o que o site faz',
    subtitulo: 'Calculadoras para o BuzzerBeater',
  },
  {
    id: 'treino',
    label: 'Treino',
    nota: 'quanto tempo falta para chegar às skills que queres',
    subtitulo: 'Projeção do treino, semana a semana',
  },
  {
    id: 'salario',
    label: 'Salário',
    nota: 'quanto custa um jogador por semana',
    subtitulo: 'Salário estimado a partir das skills',
  },
  {
    id: 'avaliacao',
    label: 'Avaliação',
    nota: 'quão forte é um jogador e até onde pode chegar',
    subtitulo: 'Avaliação e potencial de um jogador',
  },
];

export function pageById(id: string): PageMeta | undefined {
  return PAGES.find((p) => p.id === id);
}

/** O título do separador do browser para uma página. */
export function pageTitle(id: PageId): string {
  const meta = pageById(id);
  return meta && id !== 'inicio' ? `${meta.label} · BBVault` : 'BBVault';
}
