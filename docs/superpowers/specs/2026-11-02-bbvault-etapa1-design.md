# bbvault — 1.ª etapa: calculadoras de Treino, Salário e Avaliação

Aprovado pelo André a 02/11/2026, em conversa. Este documento passa esse desenho a escrito.

## Para que serve

O André quer uma ferramenta para o BuzzerBeater com sete partes: Treino, Salário,
Pavilhão, Plantel, Alinhamento, Mercado e Avaliação de jogador. Vai ser feita em três
etapas:

1. **Calculadoras** que só precisam do que se escreve nelas: Treino, Salário e Avaliação.
   **Este documento cobre só esta etapa.**
2. Ajudantes que precisam dos dados das equipas dele: Plantel e Pavilhão. Têm uma parte
   privada, com o login do cofre, e os dados são recolhidos só em leitura pela sessão do
   browser.
3. Ajudantes que juntam tudo: Alinhamento, Mercado e o valor de mercado na Avaliação.

Regra que vale para todas as etapas: **a ferramenta recomenda, o botão é dele.** Nada
licita, compra, vende ou mexe na conta do jogo.

**Quem a usa:** o André e amigos. É um site público em `bb.baverone.com`, e as
calculadoras não precisam de login.

**Está pronto quando** as três calculadoras estiverem publicadas e:
- respondam às perguntas da secção 3;
- mostrem sempre a certeza de cada número;
- passem os testes de aceitação da secção 6.

## Regras de honestidade

- **Nenhum número inventado.** Cada fator do modelo tem fonte e grau de certeza:
  «confirmado», «provável» ou «estimativa». O site mostra-os na nota de método de cada
  página.
- **Quando não há dados, não há número.** A calculadora não responde e diz porquê. Isto
  vale para o treino de 3 posições, para treinadores de nível 1–2 e para a projeção
  depois do tecto do potencial.
- **O treino sai sempre como intervalo:** rápido, esperado e lento. O jogo não mostra as
  casas decimais das skills, e vários fatores do treino são estimativas.
- **Dados privados.** O André autorizou no site público as curvas resumidas da base da
  seleção portuguesa: TSP por época e por idade, TSP máximo por potencial e perfis por
  altura. **Dados de jogadores nunca vão para o site.** Caminhos do PC e notas locais
  ficam em `.local/`, que está no `.gitignore`.

## 1. O site

- **Projeto:** `01-Projetos\bbvault`, repositório `Baverone/bbvault`, publicado no
  GitHub Pages em `bb.baverone.com` a cada envio para `main`, como o tibiavault.
- **Tecnologia:** a mesma do tibiavault, ou seja React 19 + Vite + TypeScript, `oxlint`
  e testes com `node --experimental-strip-types --test`.
  - A lógica do jogo fica em `src/domain/` e é pura, sem React, para se poder testar.
  - As páginas ficam em `src/pages/`.
- **Língua:** o site é em português de Portugal. As skills usam as siglas do jogo:
  JS, JR, OD, HA, DR, PA, IS, ID, RB, SB, mais ST e FT.
- **Páginas:** Início, Treino, Salário e Avaliação.
  - Cada calculadora termina com uma nota de método: de onde vem cada número e quão certo
    é.
  - Funciona no telemóvel a 375 px, sem scroll horizontal.
- **Dados das calculadoras:** ficam em ficheiros JSON em `src/data/`, cada um com a sua
  fonte:
  - `treino.json`: tabela de treinos, fatores e datas;
  - `salario.json`: coeficientes por posição;
  - `curvas.json`: curvas resumidas por idade e por potencial e perfis por altura.
- **Sem estado no servidor.** Para não se perder o que se escreveu, o último jogador
  introduzido fica no `localStorage` do browser, dentro de try/catch.

## 2. Escalas (comuns às três calculadoras)

- **Skills:** níveis inteiros a partir de 1.
  - Os nomes vão de 1 «atrocious» a 20 «legendary», e acima de 20 o nome continua
    «legendary» com o número.
  - Os 20 nomes, por ordem: atrocious, pitiful, awful, inept, mediocre, average,
    respectable, strong, proficient, prominent, prolific, sensational, tremendous,
    wondrous, marvelous, prodigious, stupendous, phenomenal, colossal, legendary.
- **Potencial,** de 0 a 11: announcer, bench warmer, role player, 6th man, starter, star,
  allstar, perennial allstar, superstar, MVP, hall of famer, all-time great.
- **Treinador,** de 1 a 7: minimal, basic, competent, advanced, superior, exceptional,
  world-renowned.
- **TSP** é a soma de JS, JR, OD, HA, DR, PA, IS, ID, RB e SB. Não entram ST, FT nem a
  experiência.
- **Calendário:**
  - A época tem 14 semanas (98 dias) e o treino resolve à sexta-feira.
  - A idade sobe na 1.ª sexta de cada época: 13/11/2026, 19/02/2027, 28/05/2027, e daí em
    diante a cada 98 dias.

## 3. Calculadoras

### 3.1 Treino

**Entradas:**
- idade, altura em cm, potencial e as 10 skills do TSP, mais ST e FT, que só se mostram;
- posição em que o jogador joga e minutos por semana nessa posição;
- nível do treinador;
- treino e grupo de posições. Só se oferecem os grupos que esse treino tem na tabela da
  secção 4.1, e o site avisa se a posição do jogador não está no grupo, porque nesse caso
  ele não treina.

**Três respostas:**
1. **Quanto tempo até subir.** Escolhe-se uma skill e um nível alvo. A resposta dá as
   semanas em rápido, esperado e lento, e a sexta-feira em que cai cada uma.
2. **Que treino dar.** Indicam-se objetivos (skill → nível) e a resposta é uma sequência
   de blocos «treino X durante N semanas».
   - Cada objetivo usa o treino cuja primária é essa skill, com o grupo de posições mais
     estreito que inclua a posição do jogador.
   - Os blocos começam pelo objetivo que fica mais longe, em semanas.
   - As secundárias de cada bloco contam para os blocos seguintes.
   - A resposta mostra as semanas de cada bloco, o total e a data em que acaba, tudo no
     cenário esperado, com o total também em rápido e lento.
3. **Como fica daqui a N semanas.** Usa um plano, que pode ser a resposta 2 ou um treino
   só. Mostra uma tabela semana a semana com as skills e o TSP no cenário esperado, e o TSP
   final em rápido, esperado e lento.

**Avisos que a página mostra quando se aplicam:**
- minutos abaixo do limiar;
- treino de 2 posições, porque o fator é estimativa;
- treino de 3 posições, que fica sem resposta;
- treinador de nível 1–2, que fica sem resposta;
- tecto do potencial atingido;
- idade acima de 28, porque não há curva.

### 3.2 Salário

**Prever o salário:**
- Entram a posição e as 12 skills (as 10 do TSP mais ST e FT). Sai o salário previsto para
  a próxima época, com a margem típica do modelo para essa posição.
- A página diz que **o salário só é recalculado no início da época** e que as subidas a
  meio não o mudam.

**Peso no orçamento:**
- Entram uma lista de salários (nome opcional e salário; cada linha pode vir da previsão),
  a divisão de I a VI e o contrato de TV por semana.
- A resposta dá:
  - o total por semana;
  - o total por época, num intervalo de 12 a 14 semanas pagas: uma equipa fora dos
    playoffs pode não pagar as duas últimas semanas, e algumas saltam uma;
  - o salário mínimo da divisão e a diferença face a ele. Abaixo do mínimo, paga-se o
    mínimo na mesma.

### 3.3 Avaliação de jogador

- **Entradas:** idade, altura, potencial e as 12 skills.
- **Força por posição:** uma nota de 0 a 100 para PG, SG, SF, PF e C, e a melhor posição.
  - A nota de cada posição é o salário que o modelo da secção 4.2 prevê para o jogador
    nessa posição.
  - Divide-se pelo salário previsto, com o mesmo modelo, de um jogador de referência com
    todas as skills a 20.
  - O resultado limita-se a 100.
  - A página diz que é uma **estimativa nossa**, não uma fórmula do jogo, e que «o jogo
    paga mais pelas skills que contam em cada posição».
- **Comparação com internacionais da mesma altura:** para cada skill, diz se está abaixo
  do percentil 25, entre o 25 e o 75, ou acima do 75 dos perfis A por altura.
- **Potencial:**
  - Mostra o TSP atual contra o TSP máximo observado para o potencial do jogador.
  - Projeta o TSP aos 24, 26 e 28 anos, somando a mediana e o P90 por idade da curva da
    secção 4.3, sem passar o máximo do potencial.
  - Para os potenciais 0–4 não há máximo; o site diz isso e só projeta.

## 4. Modelos e números

### 4.1 Treino

**Tabela de treinos.** Vem de um post da comunidade de 2011 e bate com o histórico das
equipas do André, por isso é «provável».

| Treino | Grupos | Primária | Secundárias |
|---|---|---|---|
| Pressure / Outside Defense | PG · PG/SG · PG/SG/SF | OD | HA, DR, ID |
| Ball Handling | PG · PG/SG · PG/SG/SF | HA | OD, DR |
| Passing | PG · PG/SG | PA | HA, DR |
| One on One | PG/SG · SF/PF | DR | HA, JS (+IS em SF/PF) |
| Jump Shot | PG/SG · SG/SF · SF/PF | JS | PG/SG: JR, HA, DR · SG/SF: JR, HA, DR, IS · SF/PF: JR, IS |
| Outside Shooting | SG · PG/SG · SG/SF | JR | JS, HA, DR |
| Inside Shot | C · C/PF · C/PF/SF | IS | JS, ID |
| Inside Defense | C · C/PF · C/PF/SF | ID | DR, IS, SB |
| Rebounding | C/PF | RB | IS, ID |
| Shot Blocking | C · C/PF · C/PF/SF | SB | ID, RB |

Os grupos «Team» ficam de fora nesta etapa: treinam o plantel todo e não há números para
eles.

**Ganho semanal na primária:**

    ganho = 0,67 × idade × treinador × posições × minutos

1. **Base 0,67 níveis/semana** — «provável».
   - Medida nos postes de 20 anos do André: SB de 14 a 18, 49 semanas-jogador, ±0,06.
   - Corresponde a treinador de nível 6, 1 posição e 48 minutos.
   - Já inclui o efeito do cross-training, que é cerca de −10%.
   - Faz de referência: com 20 anos, treinador 6, 1 posição e 48 minutos, todos os fatores
     valem 1.
2. **Idade** — «provável». É a mediana do TSP por época da curva da seleção, dividida
   pela mediana aos 20 anos (12):

   | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 |
   |---|---|---|---|---|---|---|---|---|---|---|
   | 1,417 | 1,250 | 1,000 | 0,833 | 0,750 | 0,667 | 0,667 | 0,500 | 0,417 | 0,333 | 0,167 |

   - A partir dos 29 anos não há curva. A calculadora usa o fator dos 28 e avisa.
   - Verificação: aos 21 anos o André mediu 0,58/semana, ou seja 0,866 da base, e a curva
     dá 0,833.
3. **Treinador** — «estimativa da comunidade», normalizada ao nível 6.

   | Nível | 7 | 6 | 5 | 4 | 3 |
   |---|---|---|---|---|---|
   | Fator | 1,010 | 1,000 | 0,980 | 0,939 | 0,869 |

   Para os níveis 1–2 a calculadora não responde, porque não há dados.
4. **Posições** — com 1 posição o fator é 1.
   - Com 2 posições é **0,62**, uma «estimativa» tirada do modelo antigo do André
     (0,37/0,60).
   - Com 3 posições não há resposta.
5. **Minutos.** O limiar depende da idade: 45 minutos aos 18–19, 48 aos 20–26 e 40 a
   partir dos 27. Há 1 minuto de folga.
   - Com o limiar menos 1 ou mais, o fator é 1.
   - Abaixo disso, o fator é minutos ÷ limiar, como diz o manual («treina menos»).
   - Abaixo do limiar o site também avisa que os dados do André sugerem quase zero.

**Secundárias:** cada uma ganha **0,15 ×** o ganho da primária. É uma estimativa tirada do
modelo antigo (HA +0,09 com OD +0,60).

**Intervalo:**
- **Rápido:** ganho × 1,15, a partir do nível visível + 0,99.
- **Esperado:** ganho × 1,00, a partir do nível visível + 0,5.
- **Lento:** ganho × 0,85, a partir do nível visível + 0,0.
- Uma skill «chega» ao nível N quando o valor com decimais é N ou mais.
- **Os ±15%** cobrem a dispersão medida (cerca de ±9%) e a incerteza dos fatores.

**Tecto do potencial:**
- TSP máximo observado por potencial: 5→97, 6→103, 7→107, 8→111, 9→144, 10→163,
  11→163. Para o 11 usa-se o maior valor entre o 10 e o 11 (158 e 163).
- Quando o TSP projetado chega ao tecto, a projeção pára e diz «a partir daqui o treino
  abranda muito; não há número».
- Para os potenciais 0–4 não há tecto, e o site avisa.

**Não entram no modelo, e a nota de método diz porquê:** o efeito do nível de partida, o
efeito da altura, o elástico e o treinador de formação. Ou não têm número conhecido, ou
só têm um caso isolado.

### 4.2 Salário

- **Modelo:** `ln(salário) = a + Σ b_k · skill_k` sobre as 12 skills, com um ajuste
  separado por posição.
  - O ajuste é feito sobre os cerca de 800 jogadores de mercado recolhidos pelo André
    entre 17/08 e 07/09/2026.
  - O script sai de `.local/salario_fit.py` e passa para `scripts/ajustar-salario.py`, sem
    caminhos do PC: os dados entram por argumento.
  - O script escreve `src/data/salario.json` com `a`, os `b` e a mediana do erro relativo
    de cada posição. Os dados de mercado ficam fora do repositório.
- **SG:** a amostra é pequena (28 jogadores), por isso usa a média dos coeficientes de PG
  e SF, e a página diz isso.
- **Grau de certeza:** «provável». A fórmula verdadeira do jogo não é pública.
- **Salário mínimo** — «confirmado pelo manual». É o contrato de TV × 241,5% na divisão I,
  187% na II, 130% na III, 100% na IV e 70% na V–VI. Não se aplica nas primeiras 24
  semanas de uma equipa nova, e a página avisa.

### 4.3 Curvas da seleção (autorizadas no público)

- **TSP por época, por idade:**

  | Idade | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | Mediana | 17 | 15 | 12 | 10 | 9 | 8 | 8 | 6 | 5 | 4 | 2 |
  | P90 | 20 | 18 | 15 | 13 | 11 | 11 | 10 | 9 | 7 | 7 | — |

  - Aos 28 o P90 não tem valor; usa-se a mediana e a página diz isso.
- **TSP máximo por potencial:** o da secção 4.1.
- **Perfis A por altura:** percentis 25, 50 e 75 de cada skill nas bandas de altura do
  ficheiro original: ≤187, 188–195, 196–202, 203–212 e ≥213 cm.
  - Só vão os percentis, sem jogadores.

## 5. Fora desta etapa

A parte privada e o login; a recolha de dados; o Plantel, o Pavilhão, o Alinhamento e o
Mercado; o valor de mercado; os treinos de equipa; a calibração do treino com o histórico
dos jogadores do André, que fica para a 2.ª etapa com `traininghistory.aspx`.

## 6. Testes de aceitação

1. **Treino, caso do poste de 20 anos.**
   - Dados: 20 anos, poste, Shot Blocking a C, treinador 6, 48 minutos, SB 14→18.
   - O intervalo de semanas tem de conter as 6 semanas observadas (4 níveis a 0,67 por
     semana).
   - O esperado tem de ficar a ±1 semana delas.
2. **Treino, caso PG de 21 anos.**
   - Dados: Pressure a PG, treinador 6, 48 minutos.
   - A taxa esperada tem de estar entre 0,52 e 0,64 níveis/semana. Foram medidos 0,58.
3. **O que fica sem resposta:** treino de 3 posições, treinador de nível 2 e o jogador
   fora do grupo de posições do treino. Cada um dá «sem estimativa», com o motivo.
4. **Mudança de idade.** Uma projeção que passe por 13/11/2026 muda de fator de idade a
   partir dessa sexta.
5. **Salário.**
   - Nos jogadores de agosto das equipas do André, a mediana do erro relativo tem de ser
     ≤ 10%.
   - Os jogadores ficam como fixture local em `.local/`.
   - O teste do repositório usa só jogadores sintéticos, para verificar que o modelo é
     monótono: mais skill da posição dá mais salário.
6. **Salário mínimo:** na divisão II, com contrato de TV de 157 130, dá 293 833.
7. **Avaliação:** um poste com IS, ID, RB e SB altos e o resto baixo tem C ou PF como
   melhor posição; um base com PA, HA e OD altos tem PG.
8. **Interface:** cabe a 375 px sem scroll horizontal; o lint e o build passam.
