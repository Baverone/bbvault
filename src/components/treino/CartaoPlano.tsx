import { useId } from 'react';
import { SKILLS_TSP, type SkillTsp } from '../../domain/escalas.ts';
import { CENARIOS, NOME_CENARIO, TREINOS } from '../../domain/treino/modelo.ts';
import { formatarData } from '../../formato.ts';
import {
  sextasDoBloco,
  type LinhaObjetivo,
  type LinhasValidadas,
  type ResultadoPlano,
} from './calculos.ts';
import { Avisos, Dica, JogadorPendente, SemEstimativa } from './comum.tsx';
import type { ContextoTreino } from './contexto.ts';

interface CartaoPlanoProps {
  ctx: ContextoTreino;
  linhas: LinhaObjetivo[];
  onLinhas: (linhas: LinhaObjetivo[]) => void;
  validacao: LinhasValidadas;
  /** `null` quando não há nada para planear (sem jogador certo ou sem objetivos). */
  plano: ResultadoPlano | null;
  /** Verdadeiro se o cenário esperado chega a todos os objetivos. */
  completo: boolean;
}

function nomeTreino(id: string): string {
  return TREINOS.find((t) => t.id === id)?.nome ?? id;
}

/** O resultado do plano: blocos, totais nos três cenários e a data de fim. */
function ResultadoDoPlano({ ctx, plano, completo }: { ctx: ContextoTreino; plano: ResultadoPlano; completo: boolean }) {
  if (!plano.ok) return <SemEstimativa motivo={plano.motivo} />;
  const { blocos, total, fim } = plano.valor;
  // As semanas já gastas antes de cada bloco.
  const antes = blocos.map((_, i) => blocos.slice(0, i).reduce((soma, b) => soma + b.semanas, 0));
  return (
    <>
      <Avisos lista={plano.avisos} />
      {!completo && (
        <p className="aviso" role="alert">
          <strong>Plano incompleto.</strong> No cenário esperado nem todos os objetivos são alcançáveis (ver o aviso
          acima): os blocos abaixo cobrem só os objetivos anteriores ao que falha, e o total esperado e a data de fim
          não existem.
        </p>
      )}
      {blocos.length === 0 && completo ? (
        <Dica>Os objetivos já estão cumpridos: não é preciso treinar.</Dica>
      ) : (
        <>
          <h3>{completo ? 'Blocos de treino (cenário esperado)' : 'Blocos de treino — incompletos (cenário esperado)'}</h3>
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Treino</th>
                  <th>Grupo</th>
                  <th className="num">Semanas</th>
                  <th>Sextas</th>
                </tr>
              </thead>
              <tbody>
                {blocos.map((b, i) => {
                  const sextas = sextasDoBloco(ctx.inicio, antes[i], b.semanas);
                  return (
                    <tr key={`${b.treino}-${i}`}>
                      <td>{i + 1}</td>
                      <td>{nomeTreino(b.treino)}</td>
                      <td>{b.grupo.join('/')}</td>
                      <td className="num">{b.semanas}</td>
                      <td>
                        {formatarData(sextas.de)} a {formatarData(sextas.ate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <h3>Total</h3>
      <div className="tabela-wrap">
        <table>
          <thead>
            <tr>
              <th>Cenário</th>
              <th className="num">Semanas</th>
            </tr>
          </thead>
          <tbody>
            {CENARIOS.map((c) => (
              <tr key={c}>
                <td>{NOME_CENARIO[c]}</td>
                <td className="num">{total[c] === null ? 'sem estimativa' : total[c]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {fim !== null && total.esperado !== null && total.esperado > 0 && (
        <p className="resumo">
          Acaba na sexta <strong>{formatarData(fim, true)}</strong> (última semana de treino, no esperado).
        </p>
      )}
    </>
  );
}

/** «Que treino dar»: objetivos skill → nível e a sequência de blocos. */
export function CartaoPlano({ ctx, linhas, onLinhas, validacao, plano, completo }: CartaoPlanoProps) {
  const base = useId();

  const mudar = (i: number, parte: Partial<LinhaObjetivo>) =>
    onLinhas(linhas.map((l, j) => (j === i ? { ...l, ...parte } : l)));
  const remover = (i: number) => onLinhas(linhas.filter((_, j) => j !== i));
  const juntar = () => {
    const usadas = linhas.map((l) => l.skill);
    const livre = SKILLS_TSP.find((s) => !usadas.includes(s)) ?? SKILLS_TSP[0];
    onLinhas([...linhas, { skill: livre, alvo: '' }]);
  };

  const haErros = validacao.erros.some((e) => e !== undefined);
  let corpo;
  if (validacao.vazio) corpo = <Dica>Indica pelo menos um nível alvo.</Dica>;
  else if (haErros) corpo = <Dica>Corrige as linhas a vermelho para ver o plano.</Dica>;
  else if (ctx.jogador === null) corpo = <JogadorPendente pendencias={ctx.pendencias} />;
  else if (plano === null) corpo = null;
  else corpo = <ResultadoDoPlano ctx={ctx} plano={plano} completo={completo} />;

  return (
    <section className="cartao" aria-labelledby={`${base}-t`}>
      <h2 id={`${base}-t`}>Que treino dar</h2>
      <p className="resumo">
        Cada objetivo usa o treino cuja primária é essa skill, com o grupo mais estreito que inclui a posição do
        jogador.
      </p>
      <div className="objetivos">
        {linhas.map((l, i) => {
          const erro = validacao.erros[i];
          const id = `${base}-${i}`;
          return (
            <div className="linha objetivo" key={i}>
              <div className="campo">
                <label htmlFor={`${id}-skill`}>Skill</label>
                <select
                  id={`${id}-skill`}
                  value={l.skill}
                  onChange={(e) => mudar(i, { skill: e.target.value as SkillTsp })}
                >
                  {SKILLS_TSP.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor={`${id}-alvo`}>Nível alvo</label>
                <input
                  id={`${id}-alvo`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className={erro ? 'erro' : undefined}
                  value={l.alvo}
                  aria-invalid={erro ? true : undefined}
                  onChange={(e) => mudar(i, { alvo: e.target.value })}
                />
                {erro && <span className="erro-msg">{erro}</span>}
              </div>
              <div className="campo campo-botao">
                <button
                  type="button"
                  className="botao secundario"
                  onClick={() => remover(i)}
                  disabled={linhas.length === 1}
                  aria-label={`Remover o objetivo ${i + 1}`}
                >
                  Remover
                </button>
              </div>
            </div>
          );
        })}
        <button type="button" className="botao secundario" onClick={juntar}>
          + objetivo
        </button>
      </div>
      {corpo}
    </section>
  );
}
