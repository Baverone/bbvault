import { useId } from 'react';
import { POSICOES, type Skills } from '../../domain/escalas.ts';
import { forcaPorPosicao } from '../../domain/avaliacao.ts';
import type { Pendencias } from '../../domain/validacao.ts';
import { Dica, JogadorPendente } from '../treino/comum.tsx';

interface CartaoForcaProps {
  /** As 12 skills; `null` enquanto o jogador tiver erros ou campos por preencher. */
  skills: Skills | null;
  pendencias: Pendencias;
}

/** «Força por posição»: uma barra de 0 a 100 por posição, a melhor em destaque. */
export function CartaoForca({ skills, pendencias }: CartaoForcaProps) {
  const base = useId();
  const forca = skills ? forcaPorPosicao(skills) : null;
  return (
    <section className="cartao" aria-labelledby={`${base}-t`}>
      <h2 id={`${base}-t`}>Força por posição</h2>
      {forca === null ? (
        <JogadorPendente pendencias={pendencias} />
      ) : (
        <>
          <p className="resumo">
            Melhor posição: <strong>{forca.melhor}</strong> (nota {forca.notas[forca.melhor]} em 100).
          </p>
          <ul className="barras">
            {POSICOES.map((p) => {
              const melhor = p === forca.melhor;
              return (
                <li className={melhor ? 'barra-linha melhor' : 'barra-linha'} key={p}>
                  <span className="barra-nome">{p}</span>
                  <span className="barra" aria-hidden="true">
                    <span className="barra-valor" style={{ width: `${forca.notas[p]}%` }} />
                  </span>
                  <span className="barra-nota">
                    {forca.notas[p]}
                    {melhor && <span className="barra-melhor"> melhor</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <Dica>
        Estimativa nossa: o jogo paga mais pelas skills que contam em cada posição; a nota usa esses pesos. É a média
        das skills pesada pelo que o jogo paga em cada posição, na escala de 1 a 20; não é uma fórmula do jogo.
      </Dica>
    </section>
  );
}
