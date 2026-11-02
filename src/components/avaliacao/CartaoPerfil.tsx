import { useId } from 'react';
import { SKILLS_TSP, type SkillsTsp } from '../../domain/escalas.ts';
import { compararPerfil } from '../../domain/avaliacao.ts';
import type { Pendencias } from '../../domain/validacao.ts';
import { Dica, JogadorPendente } from '../treino/comum.tsx';
import { intervalosDaBanda, perfilIndicativo, rotuloBanda } from './calculos.ts';

interface CartaoPerfilProps {
  cm: number | null;
  /** As 10 skills do TSP; `null` enquanto o jogador tiver erros ou campos por preencher. */
  skills: SkillsTsp | null;
  pendencias: Pendencias;
}

/** «Comparado com internacionais da mesma altura»: cada skill contra o intervalo p25–p75 da banda. */
export function CartaoPerfil({ cm, skills, pendencias }: CartaoPerfilProps) {
  const base = useId();
  const r = cm !== null && skills !== null ? compararPerfil(cm, skills) : null;
  const perfil = r ? intervalosDaBanda(r.banda) : null;
  return (
    <section className="cartao" aria-labelledby={`${base}-t`}>
      <h2 id={`${base}-t`}>Comparado com internacionais da mesma altura</h2>
      {r === null || perfil === null || skills === null ? (
        <JogadorPendente pendencias={pendencias} />
      ) : (
        <>
          <p className="resumo">
            Banda de altura <strong>{rotuloBanda(r.banda)}</strong>, com {perfil.n} internacionais. Cada skill é
            comparada com o intervalo entre o percentil 25 e o 75 do perfil.
          </p>
          {perfilIndicativo(perfil) && (
            <p className="aviso" role="note">
              Perfil indicativo (poucos internacionais): com {perfil.n} nesta altura, os intervalos mudam muito de um jogador para outro.
            </p>
          )}
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th className="num">Tens</th>
                  <th className="num">P25 a P75</th>
                  <th>Posição</th>
                </tr>
              </thead>
              <tbody>
                {SKILLS_TSP.map((k) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td className="num">{skills[k]}</td>
                    <td className="num">
                      {perfil.skills[k].p25} a {perfil.skills[k].p75}
                    </td>
                    <td>
                      <span className={`etiqueta etiqueta-${r.skills[k]}`}>{r.skills[k]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Dica>«Dentro» inclui os extremos, o P25 e o P75. ST e FT não entram nos perfis.</Dica>
    </section>
  );
}
