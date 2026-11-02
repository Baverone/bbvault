"""Teste de aceitacao 5 da spec: o modelo de salario acerta nos planteis de agosto?

Uso:  py scripts/verificar-salario.py <pasta dados>

Le src/data/salario.json e os planteis de agosto (planteis/*-2026-08-20.csv,
planteis/*-2026-08-28.csv, roster-*.csv). Os planteis nao trazem a posicao;
para cada jogador usa-se a posicao do modelo com o MENOR erro relativo para ele. Isto
mede o teto do que o modelo consegue (a melhor posicao possivel por jogador), nao o
erro de um utilizador que escolha a posicao. O SG e a media dos coeficientes de PG e SF.

So corre neste PC, com os dados locais; nao entra nos testes do repositorio.
Imprime so numeros agregados. Sai com codigo 1 se a mediana do erro for > 0,10.
"""
import csv
import glob
import json
import math
import os
import statistics
import sys

SK = ['JS', 'JR', 'OD', 'HA', 'DR', 'PA', 'IS', 'ID', 'RB', 'SB', 'ST', 'FT']
LIMITE = 0.10


def carregar_modelo():
    caminho = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', 'salario.json')
    with open(caminho, encoding='utf-8') as f:
        pos = json.load(f)['posicoes']
    modelo = {p: m for p, m in pos.items()}
    pg, sf = pos['PG'], pos['SF']
    modelo['SG'] = {
        'a': (pg['a'] + sf['a']) / 2,
        'b': {k: (pg['b'][k] + sf['b'][k]) / 2 for k in SK},
    }
    return modelo


def prever(m, skills):
    return math.exp(m['a'] + sum(m['b'][k] * skills[k] for k in SK))


def ler_planteis(pasta):
    ficheiros = (
        glob.glob(os.path.join(pasta, 'planteis', '*-2026-08-20.csv'))
        + glob.glob(os.path.join(pasta, 'planteis', '*-2026-08-28.csv'))
        + glob.glob(os.path.join(pasta, 'roster-*.csv'))
    )
    vistos = {}
    for caminho in sorted(ficheiros):
        with open(caminho, encoding='utf-8-sig') as f:
            for r in csv.DictReader(f, delimiter=';'):
                try:
                    sal = float(r['salario'])
                    skills = {k: int(r[k]) for k in SK}
                except (KeyError, TypeError, ValueError):
                    continue
                if sal <= 0:
                    continue
                # o mesmo jogador com o mesmo salario e skills conta uma vez
                vistos[(r['id'], sal, tuple(skills[k] for k in SK))] = (sal, skills)
    return list(vistos.values()), len(ficheiros)


def main():
    if len(sys.argv) != 2:
        raise SystemExit('uso: py scripts/verificar-salario.py <pasta dados>')
    modelo = carregar_modelo()
    jogadores, n_ficheiros = ler_planteis(sys.argv[1])
    if not jogadores:
        raise SystemExit('nenhum jogador lido nos planteis de agosto')

    erros = []
    escolhas = {}
    for sal, skills in jogadores:
        melhor = min(
            ((abs(prever(m, skills) / sal - 1), p) for p, m in modelo.items()),
            key=lambda t: t[0],
        )
        erros.append(melhor[0])
        escolhas[melhor[1]] = escolhas.get(melhor[1], 0) + 1

    mediana = statistics.median(erros)
    print(f'ficheiros lidos: {n_ficheiros}; jogadores (sem repetidos): {len(jogadores)}')
    print('Os planteis nao trazem a posicao: para cada jogador usa-se a posicao do modelo com o')
    print('menor erro. Isto mede o teto do modelo, nao o erro de quem escolhe a posicao.')
    print('Posicao escolhida: ' + ', '.join(f'{p} {n}' for p, n in sorted(escolhas.items())))
    print(f'Mediana do erro relativo: {mediana:.4f} ({mediana * 100:.1f}%); limite {LIMITE:.2f}')
    if mediana > LIMITE:
        print('FALHA: mediana acima do limite')
        sys.exit(1)
    print('OK')


if __name__ == '__main__':
    main()
