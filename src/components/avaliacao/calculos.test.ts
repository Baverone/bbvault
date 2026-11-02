import test from 'node:test';
import assert from 'node:assert/strict';
import { SKILLS_TSP } from '../../domain/escalas.ts';
import { compararPerfil, bandaAltura } from '../../domain/avaliacao.ts';
import { intervalosDaBanda, linhasProjecao, perfilIndicativo, rotuloBanda, situacaoTecto } from './calculos.ts';

test('rotuloBanda: simbolos e traco longo, em cm', () => {
  assert.equal(rotuloBanda('<=187'), '≤187 cm');
  assert.equal(rotuloBanda('188-195'), '188–195 cm');
  assert.equal(rotuloBanda('196-202'), '196–202 cm');
  assert.equal(rotuloBanda('203-212'), '203–212 cm');
  assert.equal(rotuloBanda('>=213'), '≥213 cm');
});

test('intervalosDaBanda: p25 <= p75 em todas as skills de todas as bandas', () => {
  for (const cm of [180, 190, 200, 210, 220]) {
    const banda = compararPerfil(cm, Object.fromEntries(SKILLS_TSP.map((k) => [k, 10])) as never).banda;
    const r = intervalosDaBanda(banda);
    assert.ok(r.n > 0);
    for (const k of SKILLS_TSP) assert.ok(r.skills[k].p25 <= r.skills[k].p75, `${banda} ${k}`);
  }
});

test('intervalosDaBanda bate com compararPerfil: abaixo/dentro/acima segundo p25 e p75', () => {
  const banda = bandaAltura(210);
  const { skills: iv, amostraPequena } = intervalosDaBanda(banda);
  const base = Object.fromEntries(SKILLS_TSP.map((k) => [k, iv[k].p25])) as never as Record<(typeof SKILLS_TSP)[number], number>;
  const r = compararPerfil(210, base);
  assert.equal(r.amostraPequena, amostraPequena);
  for (const k of SKILLS_TSP) assert.equal(r.skills[k], 'dentro', k);
});

test('intervalosDaBanda: banda desconhecida atira', () => {
  assert.throws(() => intervalosDaBanda('0-1'));
});

test('situacaoTecto: sem tecto, abaixo, igual e acima', () => {
  assert.equal(situacaoTecto(80, null), 'sem');
  assert.equal(situacaoTecto(80, 107), 'abaixo');
  assert.equal(situacaoTecto(107, 107), 'no');
  assert.equal(situacaoTecto(120, 107), 'acima');
});

const AOS = [
  { idade: 24 as const, mediana: 107, p90: 107 },
  { idade: 26 as const, mediana: 107, p90: 107 },
];

test('linhasProjecao: TSP acima do tecto -> sem linhas e com a mensagem', () => {
  const r = linhasProjecao(120, 107, AOS);
  assert.deepEqual(r.linhas, []);
  assert.equal(
    r.mensagem,
    'O TSP atual (120) já chega ao máximo visto para este potencial (107). Acima disso não há dados, por isso não há projeção.',
  );
});

test('linhasProjecao: TSP igual ao tecto tambem nao projeta', () => {
  const r = linhasProjecao(107, 107, AOS);
  assert.deepEqual(r.linhas, []);
  assert.ok(r.mensagem?.includes('(107)'));
});

test('linhasProjecao: abaixo do tecto passa as linhas e nenhuma fica abaixo do TSP atual', () => {
  const r = linhasProjecao(100, 144, [
    { idade: 24, mediana: 98, p90: 99 },
    { idade: 26, mediana: 130, p90: 140 },
  ]);
  assert.equal(r.mensagem, null);
  assert.deepEqual(r.linhas, [
    { idade: 24, mediana: 100, p90: 100 },
    { idade: 26, mediana: 130, p90: 140 },
  ]);
  for (const l of r.linhas) assert.ok(l.mediana >= 100 && l.p90 >= 100);
});

test('linhasProjecao: sem tecto passa as linhas (com o piso no TSP atual)', () => {
  const r = linhasProjecao(50, null, [{ idade: 28, mediana: 60, p90: 60 }]);
  assert.equal(r.mensagem, null);
  assert.deepEqual(r.linhas, [{ idade: 28, mediana: 60, p90: 60 }]);
});

test('perfilIndicativo: menos de 10 internacionais ou amostraPequena', () => {
  assert.equal(perfilIndicativo({ n: 9, amostraPequena: false }), true);
  assert.equal(perfilIndicativo({ n: 10, amostraPequena: false }), false);
  assert.equal(perfilIndicativo({ n: 18, amostraPequena: true }), true);
});

test('perfilIndicativo nos perfis reais: <=187 (4), 196-202 (9) e >=213 (6) sao indicativos; 188-195 (18) e 203-212 (10) nao', () => {
  const dica = (banda: string) => perfilIndicativo(intervalosDaBanda(banda));
  assert.deepEqual(
    ['<=187', '188-195', '196-202', '203-212', '>=213'].map(dica),
    [true, false, true, false, true],
  );
});
