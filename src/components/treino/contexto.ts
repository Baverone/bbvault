import type { Pendencias } from '../../domain/validacao.ts';
import type { Data } from '../../domain/calendario.ts';
import type { JogadorTreino } from '../../domain/treino/modelo.ts';
import type { BlocoBase } from './calculos.ts';

/** O que os três cartões de Treino partilham. */
export interface ContextoTreino {
  /** `null` enquanto o jogador tiver erros: nada se calcula. */
  jogador: JogadorTreino | null;
  treinador: number;
  /** O que impede o cálculo do jogador (vazio quando está tudo certo). */
  pendencias: Pendencias;
  /** A primeira sexta (a próxima, a contar de hoje). */
  inicio: Data;
  /** O treino e o grupo escolhidos no topo. */
  escolhido: BlocoBase;
}
