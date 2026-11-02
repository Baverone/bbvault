import { useId, useMemo, useState } from 'react';
import { JogadorForm } from '../JogadorForm.tsx';
import { preverSalario } from '../../domain/salario.ts';
import { pendencias as calcularPendencias, validarJogador, type CampoJogador } from '../../domain/validacao.ts';
import { formatarDinheiro, formatarPercentagem } from '../../dinheiro.ts';
import type { JogadorGuardado } from '../../storage/jogador.ts';
import { Dica, JogadorPendente } from '../treino/comum.tsx';
import { haSkillsAcimaDe20 } from './calculos.ts';

const CAMPOS: readonly CampoJogador[] = ['posicao'];
const OPCOES = { exigir12: true } as const;
const POSICAO = { rotulo: 'Posição', ajuda: 'a posição que o jogo mostra no jogador' } as const;

interface CartaoPreverProps {
  jogador: JogadorGuardado;
  onChange: (valor: JogadorGuardado) => void;
  /** Acrescenta o salário previsto à lista do orçamento. */
  onJuntar: (posicao: string, salario: number) => void;
}

/** A primeira letra maiúscula (a nota do domínio vem em minúsculas). */
function frase(texto: string): string {
  return `${texto[0].toUpperCase()}${texto.slice(1)}.`;
}

/** «Prever o salário»: posição e 12 skills → salário por semana, com o erro típico do modelo. */
export function CartaoPrever({ jogador, onChange, onJuntar }: CartaoPreverProps) {
  const base = useId();
  const [juntado, setJuntado] = useState<string | null>(null);
  const validacao = useMemo(() => validarJogador(jogador, CAMPOS, OPCOES), [jogador]);
  const pendencias = useMemo(() => calcularPendencias(jogador, CAMPOS, OPCOES), [jogador]);
  const haErros = pendencias.faltam.length + pendencias.errados.length > 0;

  const { posicao, skills12 } = validacao.valores ?? {};
  const previsao = posicao !== undefined && skills12 !== undefined ? preverSalario(posicao, skills12) : null;
  const assinatura = previsao && posicao ? `${posicao}:${previsao.salario}` : null;

  return (
    <section className="cartao" aria-labelledby={`${base}-t`}>
      <h2 id={`${base}-t`}>Prever o salário</h2>
      <p className="resumo">
        Posição e 12 skills dão o salário previsto por semana, com o erro típico do modelo para essa posição.
      </p>
      <JogadorForm valor={jogador} onChange={onChange} campos={CAMPOS} exigir12 posicao={POSICAO} />

      {previsao && posicao ? (
        <div role="status">
          <p className="resultado">
            <span className="valor-grande">${formatarDinheiro(previsao.salario)}</span> por semana
          </p>
          <p className="resumo">
            Erro típico do modelo: <strong>{formatarPercentagem(previsao.margem)}</strong> — metade dos jogadores da
            amostra ficou mais longe do que isto.
          </p>
          <Dica>
            É a mediana do erro relativo do ajuste para a posição {posicao}; não é um intervalo de confiança, e um
            jogador em concreto pode ficar muito mais longe.
          </Dica>
          {skills12 !== undefined && haSkillsAcimaDe20(skills12) && (
            <p className="aviso" role="note">
              Há skills acima de 20: acima de 20 o modelo está a extrapolar.
            </p>
          )}
          {previsao.nota && (
            <p className="aviso" role="note">
              {frase(previsao.nota)}
            </p>
          )}
        </div>
      ) : (
        haErros && <JogadorPendente pendencias={pendencias} />
      )}

      <Dica>O salário só é recalculado no início da época; subidas a meio não o mudam.</Dica>

      <div className="acoes">
        <button
          type="button"
          className="botao"
          disabled={previsao === null}
          onClick={() => {
            if (!previsao || !posicao || !assinatura) return;
            onJuntar(posicao, previsao.salario);
            setJuntado(assinatura);
          }}
        >
          Juntar ao orçamento
        </button>
        {juntado !== null && juntado === assinatura && (
          <span className="ajuda" role="status">
            Acrescentado à lista do cartão seguinte.
          </span>
        )}
      </div>
    </section>
  );
}
