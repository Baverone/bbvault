import { useId, useState } from 'react';
import type { SkillTsp } from '../../domain/escalas.ts';
import { NOME_CENARIO, CENARIOS } from '../../domain/treino/modelo.ts';
import { formatarData } from '../../formato.ts';
import { ERRO_ALVO, lerAlvo, tempoAteAlvo } from './calculos.ts';
import { Avisos, Dica, JogadorPendente, SemEstimativa } from './comum.tsx';
import type { ContextoTreino } from './contexto.ts';

interface CartaoTempoProps {
  ctx: ContextoTreino;
  /** As skills que o treino escolhido faz subir: a primária primeiro, depois as secundárias. */
  opcoes: readonly SkillTsp[];
}

/** «Quanto tempo até subir»: semanas e sexta em rápido, esperado e lento. */
export function CartaoTempo({ ctx, opcoes }: CartaoTempoProps) {
  const base = useId();
  const [escolhida, setEscolhida] = useState<SkillTsp | null>(null);
  const [alvo, setAlvo] = useState('');
  const skill = escolhida !== null && opcoes.includes(escolhida) ? escolhida : opcoes[0];
  const alvoLido = lerAlvo(alvo);
  const alvoErrado = alvo.trim() !== '' && alvoLido === null;

  let corpo;
  if (alvo.trim() === '') corpo = <Dica>Escolhe a skill e o nível que queres atingir.</Dica>;
  else if (alvoLido === null) corpo = null;
  else if (ctx.jogador === null) corpo = <JogadorPendente pendencias={ctx.pendencias} />;
  else {
    const r = tempoAteAlvo(ctx.jogador, ctx.escolhido, skill, alvoLido, ctx.treinador, ctx.inicio);
    corpo = !r.ok ? (
      <SemEstimativa motivo={r.motivo} />
    ) : (
      <>
        <Avisos lista={r.avisos} />
        <div className="tabela-wrap">
          <table>
            <thead>
              <tr>
                <th>Cenário</th>
                <th className="num">Semanas</th>
                <th>Sexta em que chega</th>
              </tr>
            </thead>
            <tbody>
              {CENARIOS.map((c) => {
                const v = r.valor[c];
                return (
                  <tr key={c}>
                    <td>{NOME_CENARIO[c]}</td>
                    {v === null ? (
                      <td colSpan={2}>sem estimativa (ver aviso)</td>
                    ) : v.semanas === 0 ? (
                      <td colSpan={2}>já atingido</td>
                    ) : (
                      <>
                        <td className="num">{v.semanas}</td>
                        <td>{formatarData(v.sexta, true)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <section className="cartao" aria-labelledby={`${base}-t`}>
      <h2 id={`${base}-t`}>Quanto tempo até subir</h2>
      <div className="linha">
        <div className="campo">
          <label htmlFor={`${base}-skill`}>Skill</label>
          <select id={`${base}-skill`} value={skill} onChange={(e) => setEscolhida(e.target.value as SkillTsp)}>
            {opcoes.map((s, i) => (
              <option key={s} value={s}>
                {s}
                {i === 0 ? ' (primária do treino)' : ' (secundária)'}
              </option>
            ))}
          </select>
          <span className="ajuda">as que o treino escolhido faz subir</span>
        </div>
        <div className="campo">
          <label htmlFor={`${base}-alvo`}>Nível alvo</label>
          <input
            id={`${base}-alvo`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className={alvoErrado ? 'erro' : undefined}
            value={alvo}
            aria-invalid={alvoErrado ? true : undefined}
            onChange={(e) => setAlvo(e.target.value)}
          />
          {alvoErrado ? <span className="erro-msg">{ERRO_ALVO}</span> : <span className="ajuda">1 a 40</span>}
        </div>
      </div>
      {corpo}
    </section>
  );
}
