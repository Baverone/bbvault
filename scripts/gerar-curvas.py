"""Gera src/data/curvas.json a partir dos dados locais do autor.

Uso:  py scripts/gerar-curvas.py <pasta dados> <saida>

Le nuvem/regras-treino.json (curva de idade e tecto por potencial) e
nuvem/perfis_aa_por_altura.json (perfis A por altura). Compara o que leu com as
tabelas da seccao 4.3 da spec; se nao baterem, falha com a diferenca e nao
escreve nada. Na saida so entram numeros agregados (percentis), sem jogadores.
"""
import json
import os
import re
import sys

# Tabelas da spec (seccao 4.3 e 4.1). Nao se mudam para bater com os dados.
MEDIANA = {18: 17, 19: 15, 20: 12, 21: 10, 22: 9, 23: 8, 24: 8, 25: 6, 26: 5, 27: 4, 28: 2}
P90 = {18: 20, 19: 18, 20: 15, 21: 13, 22: 11, 23: 11, 24: 10, 25: 9, 26: 7, 27: 7, 28: None}
TECTO = {5: 97, 6: 103, 7: 107, 8: 111, 9: 144, 10: 163, 11: 163}
TECTO_10_E_11 = (163, 158)  # a spec diz «158 e 163»; o 11 usa o maior dos dois

BANDAS = ['<=187', '188-195', '196-202', '203-212', '>=213']
RENOMEAR = {'HD': 'HA', 'DV': 'DR', 'RE': 'RB'}
SKILLS_TSP = ['JS', 'JR', 'OD', 'HA', 'DR', 'PA', 'IS', 'ID', 'RB', 'SB']

FONTE = (
    'Curva de idade e tectos por potencial da selecao (base do staff portugues, '
    'recalibrada a 05/09/2026); perfis A por altura (so percentis, sem jogadores).'
)


def pares(texto):
    """'18:17 19:15' -> {18: 17, 19: 15}"""
    return {int(a): int(b) for a, b in re.findall(r'(\d+):(\d+)', texto)}


def ler_idade(regras):
    s = regras['ageCurve']
    m_med = re.search(r'Mediana[^:]*:\s*((?:\d+:\d+\s*)+)', s)
    m_p90 = re.search(r'P90[^:]*:\s*((?:\d+:\d+\s*)+)', s)
    if not m_med or not m_p90:
        raise SystemExit('ageCurve: nao encontrei a mediana ou o P90 no texto')
    return pares(m_med.group(1)), pares(m_p90.group(1))


def ler_tecto(regras):
    s = regras['selecao']
    m = re.search(r'TETO POR POTENCIAL[^:]*:\s*((?:\d+:\d+\s*)+)', s)
    if not m:
        raise SystemExit('selecao: nao encontrei o tecto por potencial no texto')
    return pares(m.group(1))


def comparar(nome, lido, esperado, diferencas):
    for k in sorted(set(lido) | set(esperado)):
        if lido.get(k) != esperado.get(k):
            diferencas.append(f'{nome}[{k}]: ficheiro={lido.get(k)} spec={esperado.get(k)}')


def main():
    if len(sys.argv) != 3:
        raise SystemExit('uso: py scripts/gerar-curvas.py <pasta dados> <saida>')
    pasta, saida = sys.argv[1], sys.argv[2]

    with open(os.path.join(pasta, 'nuvem', 'regras-treino.json'), encoding='utf-8') as f:
        regras = json.load(f)['regras']
    with open(os.path.join(pasta, 'nuvem', 'perfis_aa_por_altura.json'), encoding='utf-8') as f:
        perfis = json.load(f)

    diferencas = []

    med, p90 = ler_idade(regras)
    comparar('mediana', med, MEDIANA, diferencas)
    # o P90 do ficheiro acaba nos 27; aos 28 a spec diz «sem valor»
    comparar('p90', {a: p90.get(a) for a in MEDIANA}, P90, diferencas)

    tecto = ler_tecto(regras)
    esperado_lido = {k: v for k, v in TECTO.items() if k != 11}
    esperado_lido[11] = TECTO_10_E_11[1]
    esperado_lido[10] = TECTO_10_E_11[0]
    comparar('tecto', tecto, esperado_lido, diferencas)
    tecto[11] = max(tecto[10], tecto[11])
    comparar('tecto (11 = max(t10, t11))', tecto, TECTO, diferencas)

    if list(perfis) != BANDAS:
        diferencas.append(f'bandas: ficheiro={list(perfis)} spec={BANDAS}')

    perfis_saida = {}
    for banda in BANDAS:
        p = perfis.get(banda)
        if p is None:
            continue
        skills = {}
        for k, v in p['skills'].items():
            nome = RENOMEAR.get(k, k)
            skills[nome] = {'p25': v['p25'], 'med': v['med'], 'p75': v['p75']}
        if sorted(skills) != sorted(SKILLS_TSP):
            diferencas.append(f'perfis[{banda}] skills: {sorted(skills)}')
            continue
        for nome, v in skills.items():
            if not (v['p25'] <= v['med'] <= v['p75']):
                diferencas.append(f'perfis[{banda}][{nome}] percentis fora de ordem: {v}')
        perfis_saida[banda] = {
            'n': p['n'],
            'amostraPequena': bool(p.get('amostraPequena', False)),
            'skills': {k: skills[k] for k in SKILLS_TSP},
        }

    if diferencas:
        print('As curvas lidas NAO batem com a spec (seccao 4.3). Nada foi escrito:', file=sys.stderr)
        for d in diferencas:
            print('  ' + d, file=sys.stderr)
        sys.exit(1)

    resultado = {
        'fonte': FONTE,
        'tspPorEpoca': {str(a): {'mediana': MEDIANA[a], 'p90': P90[a]} for a in MEDIANA},
        'tectoPorPotencial': {str(k): tecto[k] for k in sorted(TECTO)},
        'perfisAltura': perfis_saida,
    }
    with open(saida, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'ok: {saida} (idades {min(MEDIANA)}-{max(MEDIANA)}, tecto {sorted(TECTO)}, '
          f'bandas {list(perfis_saida)})')


if __name__ == '__main__':
    main()
