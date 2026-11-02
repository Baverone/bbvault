import { useId, useState } from 'react';
import { SKILLS_TSP } from '../../domain/escalas.ts';
import { SEMANAS_MAXIMAS } from '../../domain/validacao.ts';
import { CENARIOS, NOME_CENARIO, TREINOS, type Bloco } from '../../domain/treino/modelo.ts';
import { nivel } from '../../domain/treino/projecao.ts';
import { formatarData } from '../../formato.ts';
import { blocosParaProjecao, lerSemanas, projetarTres } from './calculos.ts';
import { Avisos, Dica, JogadorPendente, SemEstimativa } from './comum.tsx';
import type { ContextoTreino } from './contexto.ts';

interface CartaoProjecaoProps {
  ctx: ContextoTreino;
  /** Os blocos do plano do cartão «Que treino dar», se esse plano serve (completo e com blocos). */
  plano: Bloco[] | null;
  /** Há objetivos escritos, mas o plano não serve (incompleto ou sem estimativa). */
  planoNaoServe: boolean;
}

function nomeTreino(id: string): string {
  return TREINOS.find((t) => t.id === id)?.nome ?? id;
}

/** «Como fica daqui a N semanas»: semana a semana no esperado e o TSP final nos três cenários. */
export function CartaoProjecao({ ctx, plano, planoNaoServe }: CartaoProjecaoProps) {
  const base = useId();
  const [texto, setTexto] = useState('');
  const n = lerSemanas(texto);
  const errado = texto.trim() !== '' && n === null;

  const fonte =
    plano !== null ? (
      <p className="resumo">
        A usar o plano do cartão «Que treino dar» ({plano.length} {plano.length === 1 ? 'bloco' : 'blocos'},{' '}
        {plano.reduce((s, b) => s + b.semanas, 0)} semanas no esperado).
      </p>
    ) : (
      <p className="resumo">
        A usar o treino escolhido em cima: {nomeTreino(ctx.escolhido.treino)} ({ctx.escolhido.grupo.join('/')}).
        {planoNaoServe && ' O plano do cartão «Que treino dar» não está completo, por isso não é usado.'}
      </p>
    );

  let corpo;
  if (texto.trim() === '') corpo = <Dica>Indica quantas semanas queres projetar (1 a {SEMANAS_MAXIMAS}).</Dica>;
  else if (n === null) corpo = null;
  else if (ctx.jogador === null) corpo = <JogadorPendente pendencias={ctx.pendencias} />;
  else {
    const r = projetarTres(ctx.jogador, blocosParaProjecao(plano, ctx.escolhido, n), ctx.treinador, ctx.inicio);
    if (!r.ok) corpo = <SemEstimativa motivo={r.motivo} />;
    else {
      const { porCenario, tspAtual, semanasPlano } = r.valor;
      const esperado = porCenario.esperado;
      corpo = (
        <>
          <Avisos lista={r.avisos} />
          {semanasPlano < n && (
            <Dica>
              O plano acaba na semana {semanasPlano}: mostram-se {semanasPlano} semanas, não {n}.
            </Dica>
          )}
          <h3>TSP final</h3>
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cenário</th>
                  <th className="num">TSP atual</th>
                  <th className="num">TSP final</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {CENARIOS.map((c) => (
                  <tr key={c}>
                    <td>{NOME_CENARIO[c]}</td>
                    <td className="num">{tspAtual}</td>
                    <td className="num">{porCenario[c].tspFinal}</td>
                    <td>
                      {porCenario[c].parouNoTecto
                        ? `parou no tecto na semana ${porCenario[c].semanas.length}`
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Semana a semana (cenário esperado)</h3>
          <div className="tabela-wrap tabela-alta">
            <table>
              <thead>
                <tr>
                  <th className="num">Sem.</th>
                  <th>Sexta</th>
                  <th className="num">Idade</th>
                  {SKILLS_TSP.map((s) => (
                    <th className="num" key={s}>
                      {s}
                    </th>
                  ))}
                  <th className="num">TSP</th>
                </tr>
              </thead>
              <tbody>
                {esperado.semanas.map((semana, i) => (
                  <tr key={semana.sexta}>
                    <td className="num">{i + 1}</td>
                    <td>{formatarData(semana.sexta, true)}</td>
                    <td className="num">{semana.idade}</td>
                    {SKILLS_TSP.map((s) => (
                      <td className="num" key={s}>
                        {nivel(semana.skills[s])}
                      </td>
                    ))}
                    <td className="num">{semana.tsp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }
  }

  return (
    <section className="cartao" aria-labelledby={`${base}-t`}>
      <h2 id={`${base}-t`}>Como fica daqui a N semanas</h2>
      {fonte}
      <div className="linha">
        <div className="campo">
          <label htmlFor={`${base}-n`}>Semanas (N)</label>
          <input
            id={`${base}-n`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className={errado ? 'erro' : undefined}
            value={texto}
            aria-invalid={errado ? true : undefined}
            onChange={(e) => setTexto(e.target.value)}
          />
          {errado ? (
            <span className="erro-msg">N é um inteiro entre 1 e {SEMANAS_MAXIMAS}.</span>
          ) : (
            <span className="ajuda">1 a {SEMANAS_MAXIMAS}</span>
          )}
        </div>
      </div>
      {corpo}
    </section>
  );
}
