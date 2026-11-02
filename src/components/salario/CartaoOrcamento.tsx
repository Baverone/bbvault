import { useId } from 'react';
import { formatarDinheiro } from '../../dinheiro.ts';
import { Dica } from '../treino/comum.tsx';
import { ROMANOS, calcularOrcamento, type LinhaSalario } from './calculos.ts';

interface CartaoOrcamentoProps {
  linhas: LinhaSalario[];
  onLinhas: (linhas: LinhaSalario[]) => void;
  divisao: string;
  onDivisao: (valor: string) => void;
  tv: string;
  onTv: (valor: string) => void;
  /** Gera o `id` de uma linha nova. */
  novoId: () => number;
}

const dinheiro = (n: number) => `$${formatarDinheiro(n)}`;

/** «Peso no orçamento»: a folha semanal contra o salário mínimo da divisão. */
export function CartaoOrcamento({ linhas, onLinhas, divisao, onDivisao, tv, onTv, novoId }: CartaoOrcamentoProps) {
  const base = useId();
  const r = calcularOrcamento(linhas, divisao, tv);
  const o = r.orcamento;

  const mudar = (id: number, parte: Partial<LinhaSalario>) =>
    onLinhas(linhas.map((l) => (l.id === id ? { ...l, ...parte } : l)));
  // A última linha não desaparece: fica vazia.
  const remover = (id: number) => {
    const resto = linhas.filter((l) => l.id !== id);
    onLinhas(resto.length > 0 ? resto : [{ id: novoId(), nome: '', salario: '' }]);
  };
  const juntar = () => onLinhas([...linhas, { id: novoId(), nome: '', salario: '' }]);

  const nomeDivisao = ROMANOS[Number(divisao) - 1];
  let aviso;
  if (r.haErrosLinhas) aviso = <Dica>Corrige as linhas a vermelho para ver o total.</Dica>;
  else if (r.semSalarios) aviso = <Dica>Escreve pelo menos um salário (ou junta a previsão do cartão acima).</Dica>;

  return (
    <section className="cartao" aria-labelledby={`${base}-t`}>
      <h2 id={`${base}-t`}>Peso no orçamento</h2>
      <p className="resumo">
        Soma os salários por semana e compara com o salário mínimo da divisão. Abaixo do mínimo paga-se o mínimo
        na mesma.
      </p>

      <div className="objetivos">
        {linhas.map((l, i) => {
          const erro = r.erros[i];
          const id = `${base}-${l.id}`;
          return (
            <div className="linha objetivo" key={l.id}>
              <div className="campo">
                <label htmlFor={`${id}-nome`}>Nome (opcional)</label>
                <input
                  id={`${id}-nome`}
                  type="text"
                  autoComplete="off"
                  value={l.nome}
                  onChange={(e) => mudar(l.id, { nome: e.target.value })}
                />
              </div>
              <div className="campo">
                <label htmlFor={`${id}-salario`}>Salário por semana</label>
                <input
                  id={`${id}-salario`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className={erro ? 'erro' : undefined}
                  value={l.salario}
                  aria-invalid={erro ? true : undefined}
                  aria-describedby={erro ? `${id}-erro` : undefined}
                  onChange={(e) => mudar(l.id, { salario: e.target.value })}
                />
                {erro && (
                  <span className="erro-msg" id={`${id}-erro`}>
                    {erro}
                  </span>
                )}
              </div>
              <div className="campo campo-botao">
                <button
                  type="button"
                  className="botao secundario"
                  onClick={() => remover(l.id)}
                  aria-label={`Remover a linha ${i + 1}`}
                >
                  Remover
                </button>
              </div>
            </div>
          );
        })}
        <button type="button" className="botao secundario" onClick={juntar}>
          + linha
        </button>
      </div>

      <div className="linha">
        <div className="campo">
          <label htmlFor={`${base}-divisao`}>Divisão</label>
          <select id={`${base}-divisao`} value={divisao} onChange={(e) => onDivisao(e.target.value)}>
            <option value="">—</option>
            {ROMANOS.map((nome, i) => (
              <option key={nome} value={String(i + 1)}>
                Divisão {nome}
              </option>
            ))}
          </select>
          <span className="ajuda">de I a VI</span>
        </div>
        <div className="campo">
          <label htmlFor={`${base}-tv`}>Contrato de TV por semana</label>
          <input
            id={`${base}-tv`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className={r.erroTv ? 'erro' : undefined}
            value={tv}
            aria-invalid={r.erroTv ? true : undefined}
            aria-describedby={r.erroTv ? `${base}-tv-erro` : undefined}
            onChange={(e) => onTv(e.target.value)}
          />
          {r.erroTv ? (
            <span className="erro-msg" id={`${base}-tv-erro`}>
              {r.erroTv}
            </span>
          ) : (
            <span className="ajuda">por exemplo 157 130</span>
          )}
        </div>
      </div>

      <div role="status">
        {aviso}
        {r.piso === null && !r.erroTv && (
          <Dica>Escolhe a divisão e indica o contrato de TV para ver o salário mínimo.</Dica>
        )}
        {(o !== null || r.piso !== null) && (
          <dl className="quadro">
            {o !== null && (
              <>
                <dt>Total por semana</dt>
                <dd>{dinheiro(o.semana)}</dd>
              </>
            )}
            {r.piso !== null && (
              <>
                <dt>Salário mínimo da divisão {nomeDivisao}</dt>
                <dd>{dinheiro(r.piso)}</dd>
              </>
            )}
            {o !== null && (
              <>
                <dt>Face ao mínimo</dt>
                <dd>
                  {o.diferenca === 0
                    ? 'no mínimo'
                    : `${o.diferenca > 0 ? 'acima' : 'abaixo'} do mínimo por ${dinheiro(Math.abs(o.diferenca))}`}
                </dd>
                <dt>Na época</dt>
                <dd>
                  entre {dinheiro(o.epoca.min)} e {dinheiro(o.epoca.max)} (12 a 14 semanas pagas, confirmado pelo manual)
                </dd>
              </>
            )}
          </dl>
        )}
        {o !== null && o.diferenca < 0 && (
          <p className="aviso" role="note">
            Nota: abaixo do mínimo paga-se o mínimo, por isso a época conta com {dinheiro(o.pagoPorSemana)} por
            semana.
          </p>
        )}
      </div>
      <Dica>O salário mínimo não se aplica nas primeiras 24 semanas de uma equipa nova.</Dica>
    </section>
  );
}
