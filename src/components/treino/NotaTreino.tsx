import { NotaMetodo, type ItemMetodo } from '../NotaMetodo.tsx';

/** Um item por fator da secção 4.1 da spec, com a certeza que a spec lhe dá. */
const ITENS: readonly ItemMetodo[] = [
  {
    certeza: 'provável',
    texto:
      'Base de 0,67 níveis por semana na skill primária. Medida em postes de 20 anos (SB de 14 a 18, 49 semanas-jogador, ±0,06), com treinador de nível 6, 1 posição e 48 minutos; já inclui o efeito do cross-training, cerca de −10%.',
  },
  {
    certeza: 'provável',
    texto:
      'Idade: a mediana do TSP por época da seleção portuguesa, relativa aos 20 anos (18: 1,417 · 19: 1,250 · 20: 1,000 · 21: 0,833 · 22: 0,750 · 23 e 24: 0,667 · 25: 0,500 · 26: 0,417 · 27: 0,333 · 28: 0,167). A partir dos 29 anos não há curva: usa-se o fator dos 28 e a página avisa. A idade sobe nas sextas de mudança de idade, e essa semana já conta com a idade nova.',
  },
  {
    certeza: 'estimativa',
    texto:
      'Treinador: estimativa da comunidade, relativa ao nível 6 (7: 1,010 · 6: 1,000 · 5: 0,980 · 4: 0,939 · 3: 0,869). Para os níveis 1 e 2 não há dados e a página não responde.',
  },
  {
    certeza: 'estimativa',
    texto:
      'Treino de 2 posições: fator 0,62, tirado do modelo antigo do autor. Com 1 posição o fator é 1; com 3 posições não há número e a página não responde.',
  },
  {
    certeza: 'confirmado',
    texto:
      'Minutos, limiares: o manual diz que quem joga menos treina menos. O limiar depende da idade (45 minutos aos 18–19 anos, 48 aos 20–26 e 40 a partir dos 27) e há 1 minuto de folga.',
  },
  {
    certeza: 'estimativa',
    texto:
      'Minutos, abaixo do limiar: o treino conta na proporção dos minutos (minutos ÷ limiar). Os dados do autor sugerem que, abaixo do limiar, o treino é quase nulo, e a página avisa.',
  },
  {
    certeza: 'estimativa',
    texto:
      'Skills secundárias: cada uma ganha 0,15 do ganho da primária (tirado do modelo antigo: HA +0,09 com OD +0,60).',
  },
  {
    certeza: 'estimativa',
    texto:
      'Intervalo: rápido (ganho × 1,15, a partir do nível visível + 0,99), esperado (× 1,00, a partir de + 0,5) e lento (× 0,85, a partir de + 0,0). Os ±15% cobrem a dispersão medida (cerca de ±9%) e a incerteza dos fatores. Uma skill chega ao nível N quando o valor com decimais é N ou mais.',
  },
  {
    certeza: 'provável',
    texto:
      'Tabela de treinos, com as primárias e secundárias de cada grupo de posições: vem de um post da comunidade de 2011 e bate com o histórico de equipas do autor.',
  },
  {
    certeza: 'provável',
    texto:
      'Tecto do potencial: o TSP máximo observado por potencial (5: 97 · 6: 103 · 7: 107 · 8: 111 · 9: 144 · 10: 163 · 11: 163). Quando o TSP projetado lá chega, a projeção pára: a partir daí o treino abranda muito e não há número. Nos potenciais 0–4 não há tecto, e a página avisa.',
  },
];

const NAO_ENTRA: readonly string[] = [
  'O efeito do nível de partida da skill.',
  'O efeito da altura.',
  'O elástico.',
  'O treinador de formação.',
  'Os treinos «Team», que treinam o plantel todo: não há números para eles.',
];

const PORQUE_NAO_ENTRA = 'Ou não têm número conhecido, ou só têm um caso isolado.';

export function NotaTreino() {
  return (
    <NotaMetodo
      titulo="Nota de método: o que é confirmado e o que é estimativa"
      itens={ITENS}
      naoEntra={NAO_ENTRA}
      naoEntraNota={PORQUE_NAO_ENTRA}
    />
  );
}
