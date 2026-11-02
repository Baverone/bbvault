import { formatarPercentagem } from '../../dinheiro.ts';
import { PISO_POR_DIVISAO } from '../../domain/salario.ts';
import { NotaMetodo, type ItemMetodo } from '../NotaMetodo.tsx';
import { ROMANOS, resumoModelo } from './calculos.ts';

const NUMERO = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 1 });

function itemPosicao(p: ReturnType<typeof resumoModelo>[number]): ItemMetodo {
  if (p.derivado) {
    return {
      certeza: 'estimativa',
      texto: `${p.posicao}: sem ajuste próprio, porque há poucos ${p.posicao} na amostra. O modelo é a média dos coeficientes de PG e SF e o erro mediano é o maior dos dois, ${formatarPercentagem(p.erro)}.`,
    };
  }
  return {
    certeza: 'provável',
    texto: `${p.posicao}: ajustado com ${p.amostra} registos de mercado; erro mediano de ${formatarPercentagem(p.erro)}.`,
  };
}

/** Os mínimos da spec, em percentagem do contrato de TV (V e VI com o mesmo valor). */
function textoMinimos(): string {
  const partes = ROMANOS.map((nome, i) => {
    const d = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    return `${nome}: ${NUMERO.format(PISO_POR_DIVISAO[d] * 100)}%`;
  });
  return partes.join(' · ');
}

export function NotaSalario() {
  const itens: ItemMetodo[] = [
    {
      certeza: 'provável',
      texto:
        'Modelo por posição: ln(salário) = a + soma de b × skill, sobre as 12 skills, com um ajuste por posição a jogadores de mercado recolhidos entre 17/08 e 07/09/2026. É uma aproximação, não a fórmula do jogo, que não é pública. O erro típico mostrado é o erro mediano do ajuste, que está em cada posição abaixo: metade dos jogadores da amostra ficou mais longe do que isto, não é um intervalo de confiança. Acima de 20 nas skills o modelo extrapola.',
    },
    ...resumoModelo().map(itemPosicao),
    {
      certeza: 'confirmado',
      texto: `Salário mínimo: o contrato de TV por semana vezes uma percentagem que depende da divisão (${textoMinimos()}). Abaixo do mínimo paga-se o mínimo. Não se aplica nas primeiras 24 semanas de uma equipa nova.`,
    },
    {
      certeza: 'confirmado',
      texto:
        'Salário na época: o total por semana vezes 12 a 14 semanas pagas (confirmado pelo manual). Segundo o manual, uma equipa fora dos playoffs pode não pagar as duas últimas semanas, e algumas saltam uma.',
    },
  ];
  const naoEntra = [
    'O salário depois das subidas a meio da época: só é recalculado no início da época, e a previsão é para a época seguinte.',
    'Qualquer coisa além das 12 skills, da posição e da divisão: idade, altura e potencial não entram no modelo.',
  ];
  return <NotaMetodo titulo="Nota de método: o que é confirmado e o que é estimativa" itens={itens} naoEntra={naoEntra} />;
}
