"""Ajusta o modelo de salario e escreve src/data/salario.json.

Uso:  py scripts/ajustar-salario.py <pasta dados> <saida>

Modelo:  ln(salario) = a + soma(b_k * skill_k)  sobre as 12 skills, com um ajuste
separado por posicao listada (Point Guard, Shooting Guard, ...). Os dados de mercado
e os planteis ficam fora do repositorio: a pasta entra por argumento e a saida so tem
os coeficientes, a amostra e a mediana do erro relativo.

So se escrevem as posicoes com amostra suficiente (PG, SF, PF, C). O SG tem poucos
jogadores e a pagina deriva-o de PG e SF.

Precisa de numpy (py -m pip install numpy).
"""
import csv
import datetime
import glob
import json
import os
import sys

import numpy as np

SK = ['JS', 'JR', 'OD', 'HA', 'DR', 'PA', 'IS', 'ID', 'RB', 'SB', 'ST', 'FT']
SIGLA = {
    'Point Guard': 'PG',
    'Shooting Guard': 'SG',
    'Small Forward': 'SF',
    'Power Forward': 'PF',
    'Center': 'C',
}
MIN_AMOSTRA = 40  # abaixo disto a posicao nao se escreve (o SG tem 28)
ESCREVER = ['PG', 'SF', 'PF', 'C']
CASAS = 6

FONTE = (
    'Ajuste ln(salario) = a + soma(b*skill) por posicao listada, sobre jogadores de mercado '
    'recolhidos entre 17/08 e 07/09/2026. A formula verdadeira do jogo nao e publica.'
)


def acrescentar(P, pid, idade, sal, skills):
    """Um registo por (id, salario); linhas incompletas ou nao numericas ficam de fora."""
    if not sal or any(skills.get(k) in (None, '') for k in SK):
        return
    try:
        rec = dict(id=str(pid), idade=int(idade), sal=float(sal), sk={k: int(skills[k]) for k in SK})
    except (TypeError, ValueError):
        return
    P[(rec['id'], rec['sal'])] = rec


def recolher(pasta):
    P = {}
    pos_por_id = {}

    with open(os.path.join(pasta, 'mercado', 'listagens.jsonl'), encoding='utf-8') as f:
        for linha in f:
            o = json.loads(linha)
            acrescentar(P, o['id'], o['idade'], o.get('salario'), o.get('skills') or {})
            pos_por_id[str(o['id'])] = o.get('pos')

    ficheiros = (
        glob.glob(os.path.join(pasta, 'mercado', '*.csv'))
        + glob.glob(os.path.join(pasta, 'planteis', '*.csv'))
        + glob.glob(os.path.join(pasta, 'roster-*.csv'))
    )
    for caminho in sorted(ficheiros):
        with open(caminho, encoding='utf-8-sig') as f:
            for r in csv.DictReader(f, delimiter=';'):
                acrescentar(P, r.get('id'), r.get('idade'), r.get('salario'), r)
                if r.get('pos'):
                    pos_por_id[str(r['id'])] = r['pos']
    return list(P.values()), pos_por_id


def ajustar(rs):
    X = np.array([[r['sk'][k] for k in SK] for r in rs], float)
    y = np.array([r['sal'] for r in rs])
    A = np.c_[np.ones(len(X)), X]
    b, *_ = np.linalg.lstsq(A, np.log(y), rcond=None)
    b = np.round(b, CASAS)  # o erro mede-se com os coeficientes que vao para o JSON
    previsto = np.exp(A @ b)
    erro = float(np.median(np.abs(previsto / y - 1)))
    return b, erro


def main():
    if len(sys.argv) != 3:
        raise SystemExit('uso: py scripts/ajustar-salario.py <pasta dados> <saida>')
    pasta, saida = sys.argv[1], sys.argv[2]

    rows, pos_por_id = recolher(pasta)
    print('jogadores com salario e 12 skills:', len(rows))

    por_pos = {}
    for r in rows:
        nome = pos_por_id.get(r['id'])
        sigla = SIGLA.get(nome)
        if sigla:
            por_pos.setdefault(sigla, []).append(r)

    posicoes = {}
    for sigla in ['PG', 'SG', 'SF', 'PF', 'C']:
        rs = por_pos.get(sigla, [])
        if len(rs) < MIN_AMOSTRA or sigla not in ESCREVER:
            print(f'{sigla}: amostra {len(rs)} (nao escrita)')
            continue
        b, erro = ajustar(rs)
        print(f'{sigla}: amostra {len(rs)}, erro mediano {erro:.3f}')
        posicoes[sigla] = {
            'a': float(b[0]),
            'b': {k: float(v) for k, v in zip(SK, b[1:])},
            'erroMediano': round(erro, 4),
            'amostra': len(rs),
        }

    faltam = [p for p in ESCREVER if p not in posicoes]
    if faltam:
        raise SystemExit(f'faltam posicoes com amostra suficiente: {faltam}')

    resultado = {
        'fonte': FONTE,
        'geradoEm': datetime.date.today().isoformat(),
        'posicoes': posicoes,
    }
    with open(saida, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('escrito', saida)


if __name__ == '__main__':
    main()
