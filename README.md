# BBVault

Calculadoras para o [BuzzerBeater](https://www.buzzerbeater.com), publicadas em
**https://bb.baverone.com**.

- **Treino:** quanto tempo falta até uma skill subir, que treino dar para chegar a
  um objetivo, e como fica o jogador daqui a N semanas. O resultado é sempre um
  intervalo: rápido, esperado e lento.
- **Salário:** o salário previsto para a próxima época, por posição, e o peso dos
  salários no orçamento face ao salário mínimo da divisão.
- **Avaliação:** força por posição, comparação com os internacionais da mesma
  altura, e até onde o potencial deixa chegar.

As calculadoras recomendam; quem decide no jogo é quem joga. O site não faz
pedidos ao jogo: os cálculos correm no browser de quem o usa.

## Honestidade dos números

Cada página termina com uma nota de método. Diz de onde vem cada número e com que
certeza: confirmado (manual do jogo), provável (medido ou consenso da comunidade)
ou estimativa. Quando não há dados, a calculadora responde «sem estimativa» e diz
porquê, em vez de inventar. O desenho completo está em
[`docs/superpowers/specs/2026-11-02-bbvault-etapa1-design.md`](docs/superpowers/specs/2026-11-02-bbvault-etapa1-design.md).

## Correr localmente

    npm install
    npm run dev      # http://localhost:5180
    npm test         # testes do domínio e dos cálculos (node --test)
    npm run lint
    npm run build

## Dados do modelo

Os números ficam em `src/data/`:

| Ficheiro | O que tem | De onde vem |
|---|---|---|
| `treino.json` | tabela de treinos e fatores do ganho semanal | escrito à mão a partir da spec |
| `curvas.json` | TSP por época e idade, TSP máximo por potencial, perfis por altura | `scripts/gerar-curvas.py` |
| `salario.json` | coeficientes do salário por posição | `scripts/ajustar-salario.py` |

Os dois scripts leem uma pasta de dados local, passada por argumento, e só
escrevem agregados. O `gerar-curvas.py` confere os números com a spec e não
escreve nada se não baterem certo. O `verificar-salario.py` mede o erro do modelo
de salário em plantéis reais.

    py scripts/gerar-curvas.py <pasta de dados> src/data/curvas.json
    py scripts/ajustar-salario.py <pasta de dados> src/data/salario.json
    py scripts/verificar-salario.py <pasta de dados>

**A pasta de dados nunca entra no repositório.** Tem plantéis e dados de mercado.
Os ficheiros em `src/data/` só levam números agregados, sem jogadores, e um teste
falha se um deles ou um script trouxer caminhos ou nomes da máquina.

## Etapas

1. **Calculadoras** (esta): Treino, Salário, Avaliação.
2. Ajudantes com os dados das equipas, numa parte privada: Plantel e Pavilhão.
3. Alinhamento, Mercado e valor de mercado.

Publicação: cada envio para `main` corre os testes, o lint e o build, e publica no
GitHub Pages (`.github/workflows/pages.yml`).
