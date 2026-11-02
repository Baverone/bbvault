import { useEffect, useMemo, useState } from 'react';
import { JogadorForm } from '../components/JogadorForm.tsx';
import { CartaoForca } from '../components/avaliacao/CartaoForca.tsx';
import { CartaoPerfil } from '../components/avaliacao/CartaoPerfil.tsx';
import { CartaoPotencial } from '../components/avaliacao/CartaoPotencial.tsx';
import { NotaAvaliacao } from '../components/avaliacao/NotaAvaliacao.tsx';
import {
  pendencias as calcularPendencias,
  validarJogador,
  type CampoJogador,
  type OpcoesJogador,
} from '../domain/validacao.ts';
import { guardarJogador, jogadorVazio, lerJogador, type JogadorGuardado } from '../storage/jogador.ts';

const CAMPOS: readonly CampoJogador[] = ['idade', 'cm', 'potencial'];

interface Pedido {
  campos: readonly CampoJogador[];
  opcoes: OpcoesJogador;
}

// Cada cartão pede só o que lhe serve: a força quer as 12 skills, o perfil a altura,
// o potencial a idade e o potencial.
const PARA_FORCA: Pedido = { campos: [], opcoes: { exigir12: true } };
const PARA_PERFIL: Pedido = { campos: ['cm'], opcoes: {} };
const PARA_POTENCIAL: Pedido = { campos: ['idade', 'potencial'], opcoes: {} };

function validar(jogador: JogadorGuardado, p: Pedido) {
  return {
    valores: validarJogador(jogador, p.campos, p.opcoes).valores,
    pendencias: calcularPendencias(jogador, p.campos, p.opcoes),
  };
}

export function AvaliacaoPage() {
  const [jogador, setJogador] = useState<JogadorGuardado>(() => lerJogador() ?? jogadorVazio());

  // Guarda o jogador para as outras páginas; se o browser não deixar, segue sem guardar.
  useEffect(() => {
    guardarJogador(jogador);
  }, [jogador]);

  const forca = useMemo(() => validar(jogador, PARA_FORCA), [jogador]);
  const perfil = useMemo(() => validar(jogador, PARA_PERFIL), [jogador]);
  const potencial = useMemo(() => validar(jogador, PARA_POTENCIAL), [jogador]);

  return (
    <>
      <section className="cartao" aria-labelledby="avaliacao-jogador">
        <h2 id="avaliacao-jogador">O jogador</h2>
        <JogadorForm valor={jogador} onChange={setJogador} campos={CAMPOS} exigir12 />
      </section>

      <CartaoForca skills={forca.valores?.skills12 ?? null} pendencias={forca.pendencias} />
      <CartaoPerfil
        cm={perfil.valores?.cm ?? null}
        skills={perfil.valores?.skills ?? null}
        pendencias={perfil.pendencias}
      />
      <CartaoPotencial
        idade={potencial.valores?.idade ?? null}
        potencial={potencial.valores?.potencial ?? null}
        skills={potencial.valores?.skills ?? null}
        pendencias={potencial.pendencias}
      />
      <NotaAvaliacao />
    </>
  );
}
