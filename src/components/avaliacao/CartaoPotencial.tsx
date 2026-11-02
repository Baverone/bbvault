import { useId } from 'react';
import { tsp, type SkillsTsp } from '../../domain/escalas.ts';
import { projecaoPotencial } from '../../domain/avaliacao.ts';
import type { Pendencias } from '../../domain/validacao.ts';
import { hojeUtc } from '../../formato.ts';
import { Avisos, Dica, JogadorPendente } from '../treino/comum.tsx';
import { linhasProjecao } from './calculos.ts';

interface CartaoPotencialProps {
  idade: number | null;
  potencial: number | null;
  /** As 10 skills do TSP; `null` enquanto o jogador tiver erros ou campos por preencher. */
  skills: SkillsTsp | null;
  pendencias: Pendencias;
}

/** «Potencial»: o TSP atual contra o tecto e a projeção aos 24, 26 e 28 anos. */
export function CartaoPotencial({ idade, potencial, skills, pendencias }: CartaoPotencialProps) {
  const base = useId();
  const atual = skills !== null ? tsp(skills) : null;
  const p = idade !== null && potencial !== null && atual !== null ? projecaoPotencial(idade, atual, potencial, hojeUtc()) : null;
  const tabela = p && atual !== null ? linhasProjecao(atual, p.tecto, p.aos) : null;
  return (
    <section className="cartao" aria-labelledby={`${base}-t`}>
      <h2 id={`${base}-t`}>Potencial</h2>
      {p === null || atual === null ? (
        <JogadorPendente pendencias={pendencias} />
      ) : (
        <>
          <p className="resumo">
            TSP atual: <strong>{atual}</strong>
            {p.tecto !== null && (
              <>
                {' '}
                · máximo visto para este potencial: <strong>{p.tecto}</strong>
              </>
            )}
          </p>
          <Avisos lista={p.avisos} />
          {tabela?.mensagem ? (
            <p className="aviso" role="note">
              {tabela.mensagem}
            </p>
          ) : p.aos.length === 0 ? (
            <Dica>
              A partir dos 28 anos não há idades-alvo à frente (24, 26 e 28): só se mostra o TSP atual{p.tecto !== null && ' e o máximo'}.
            </Dica>
          ) : (
            <>
              <div className="tabela-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Aos</th>
                      <th className="num">Mediana</th>
                      <th className="num">Melhor caso (P90)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabela?.linhas.map((a) => (
                      <tr key={a.idade}>
                        <td>{a.idade} anos</td>
                        <td className="num">{a.mediana}</td>
                        <td className="num">{a.p90}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Dica>
                TSP esperado nessa idade: o atual mais o ganho por época da seleção, em mediana e em P90, sem passar o
                máximo do potencial. A época em curso conta só a parte que ainda falta até à próxima mudança de idade.
              </Dica>
            </>
          )}
        </>
      )}
    </section>
  );
}
