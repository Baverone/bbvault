import { useEffect, useRef, useState } from 'react';
import { CartaoOrcamento } from '../components/salario/CartaoOrcamento.tsx';
import { CartaoPrever } from '../components/salario/CartaoPrever.tsx';
import { NotaSalario } from '../components/salario/NotaSalario.tsx';
import type { LinhaSalario } from '../components/salario/calculos.ts';
import { formatarDinheiro } from '../dinheiro.ts';
import { guardarJogador, jogadorVazio, lerJogador, type JogadorGuardado } from '../storage/jogador.ts';

export function SalarioPage() {
  const [jogador, setJogador] = useState<JogadorGuardado>(() => lerJogador() ?? jogadorVazio());
  const proximoId = useRef(2);
  const novoId = () => proximoId.current++;
  const [linhas, setLinhas] = useState<LinhaSalario[]>([{ id: 1, nome: '', salario: '' }]);
  const [divisao, setDivisao] = useState('');
  const [tv, setTv] = useState('');

  // Guarda o jogador para as outras páginas; se o browser não deixar, segue sem guardar.
  useEffect(() => {
    guardarJogador(jogador);
  }, [jogador]);

  // A previsão entra como uma linha nova (ou ocupa a primeira, se ainda estiver vazia).
  const juntar = (posicao: string, salario: number) => {
    const nova = { id: novoId(), nome: `Previsão ${posicao}`, salario: formatarDinheiro(salario) };
    setLinhas((atuais) => {
      const vazia = atuais.length === 1 && atuais[0].nome.trim() === '' && atuais[0].salario.trim() === '';
      return vazia ? [nova] : [...atuais, nova];
    });
  };

  return (
    <>
      <CartaoPrever jogador={jogador} onChange={setJogador} onJuntar={juntar} />
      <CartaoOrcamento
        linhas={linhas}
        onLinhas={setLinhas}
        divisao={divisao}
        onDivisao={setDivisao}
        tv={tv}
        onTv={setTv}
        novoId={novoId}
      />
      <NotaSalario />
    </>
  );
}
