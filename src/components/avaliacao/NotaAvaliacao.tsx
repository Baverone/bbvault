import { NotaMetodo, type ItemMetodo } from '../NotaMetodo.tsx';

const ITENS: readonly ItemMetodo[] = [
  {
    certeza: 'estimativa',
    texto:
      'Força por posição: média das skills pesada pelo que o jogo paga em cada posição, na escala de 1 a 20; estimativa nossa, não uma fórmula do jogo. Os pesos são os do modelo de salário (uma aproximação), e a nota é 100 × soma de b × (skill − 1) ÷ soma de b × 19, entre 0 e 100. Skills acima de 20 dão no máximo 100.',
  },
  {
    certeza: 'provável',
    texto:
      'Perfis por altura: percentis 25 e 75 de cada skill nas bandas ≤187, 188–195, 196–202, 203–212 e ≥213 cm. As curvas e os perfis vêm de dados resumidos da seleção portuguesa, sem jogadores. Com menos de 10 internacionais na banda, a página avisa que o perfil é indicativo.',
  },
  {
    certeza: 'provável',
    texto:
      'TSP por época (mediana e P90) e TSP máximo por potencial (5: 97 · 6: 103 · 7: 107 · 8: 111 · 9: 144 · 10: 163 · 11: 163): as mesmas curvas da seleção. Nos potenciais 0–4 não há máximo e a página avisa.',
  },
  {
    certeza: 'estimativa',
    texto:
      'Projeção aos 24, 26 e 28 anos: o TSP atual mais o ganho por época, de hoje até à idade alvo, em mediana e em P90 (somados em separado), sem passar o máximo do potencial. A época em curso conta só a parte que falta: os dias até à próxima mudança de idade a dividir por 98 (na própria sexta da mudança conta inteira). As somas arredondam-se às unidades. Aos 28 o P90 não tem valor e usa-se a mediana.',
  },
];

const NAO_ENTRA: readonly string[] = [
  'O treino que o jogador vai fazer: a projeção segue a curva típica da seleção, não o teu plano.',
  'O valor de mercado do jogador.',
  'ST e FT na comparação por altura e no TSP: só entram na força por posição.',
];

export function NotaAvaliacao() {
  return (
    <NotaMetodo titulo="Nota de método: o que é confirmado e o que é estimativa" itens={ITENS} naoEntra={NAO_ENTRA} />
  );
}
