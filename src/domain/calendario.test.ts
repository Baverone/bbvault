import test from 'node:test';
import assert from 'node:assert/strict';
import {
  diasAteMudancaDeIdade,
  eMudancaDeIdade,
  MUDANCA_IDADE_ANCORA,
  PERIODO_EPOCA_DIAS,
  proximaSexta,
  somarDias,
} from './calendario.ts';

test('constantes da mudanca de idade', () => {
  assert.equal(MUDANCA_IDADE_ANCORA, '2026-11-13');
  assert.equal(PERIODO_EPOCA_DIAS, 98);
});

test('somarDias atravessa o fim do ano e o fim de fevereiro em UTC', () => {
  assert.equal(somarDias('2026-12-30', 3), '2027-01-02');
  assert.equal(somarDias('2026-03-01', -1), '2026-02-28');
  assert.equal(somarDias('2026-11-02', 0), '2026-11-02');
});

test('proximaSexta: a primeira sexta a partir de d, incluindo d', () => {
  assert.equal(proximaSexta('2026-11-02'), '2026-11-06');
  assert.equal(proximaSexta('2026-11-06'), '2026-11-06');
  assert.equal(proximaSexta('2026-11-07'), '2026-11-13');
});

test('eMudancaDeIdade: multiplos de 98 dias a partir da ancora, para a frente e para tras', () => {
  assert.equal(eMudancaDeIdade('2026-11-13'), true);
  assert.equal(eMudancaDeIdade('2027-02-19'), true);
  assert.equal(eMudancaDeIdade('2027-05-28'), true);
  assert.equal(eMudancaDeIdade('2026-08-07'), true);
  assert.equal(eMudancaDeIdade('2026-11-20'), false);
  assert.equal(eMudancaDeIdade('2026-11-06'), false);
});

test('diasAteMudancaDeIdade: de 1 a 98, e 98 na propria sexta da mudanca', () => {
  assert.equal(diasAteMudancaDeIdade('2026-11-02'), 11);
  assert.equal(diasAteMudancaDeIdade('2026-11-12'), 1);
  assert.equal(diasAteMudancaDeIdade('2026-11-13'), 98);
  assert.equal(diasAteMudancaDeIdade('2026-11-14'), 97);
  assert.equal(diasAteMudancaDeIdade('2027-02-18'), 1);
  assert.equal(diasAteMudancaDeIdade('2027-02-19'), 98);
  // antes da ancora tambem
  assert.equal(diasAteMudancaDeIdade('2026-08-07'), 98);
  assert.equal(diasAteMudancaDeIdade('2026-08-08'), 97);
});
