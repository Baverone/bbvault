import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularOrcamento,
  haSkillsAcimaDe20,
  lerContratoTv,
  lerDivisao,
  resumoModelo,
  validarSalarios,
} from './calculos.ts';
import type { Skills } from '../../domain/escalas.ts';

const linha = (salario: string, id = 1, nome = '') => ({ id, nome, salario });

test('lerDivisao: so 1 a 6', () => {
  assert.equal(lerDivisao('1'), 1);
  assert.equal(lerDivisao('6'), 6);
  for (const mau of ['', '0', '7', 'II', '2.5', '-1', 'x']) assert.equal(lerDivisao(mau), null, mau);
});

test('lerContratoTv: positivo; aceita os tres formatos', () => {
  assert.equal(lerContratoTv('157130'), 157130);
  assert.equal(lerContratoTv('157 130'), 157130);
  assert.equal(lerContratoTv('157.130'), 157130);
  for (const mau of ['', '0', 'abc', '-3', '1,5']) assert.equal(lerContratoTv(mau), null, mau);
});

test('validarSalarios: linhas vazias ficam de fora, as erradas dao erro e bloqueiam', () => {
  const ok = validarSalarios([linha('100 000', 1), linha('', 2), linha('50.000', 3)]);
  assert.deepEqual(ok.valores, [100000, 50000]);
  assert.deepEqual(ok.erros, [undefined, undefined, undefined]);
  assert.equal(ok.vazio, false);

  const mau = validarSalarios([linha('100000', 1), linha('abc', 2), linha('-5', 3)]);
  assert.equal(mau.valores, null);
  assert.equal(mau.erros[0], undefined);
  assert.ok(mau.erros[1] && mau.erros[2]);

  const vazio = validarSalarios([linha('', 1), linha('  ', 2)]);
  assert.equal(vazio.vazio, true);
  assert.deepEqual(vazio.valores, []);
});

test('salario 0 e valido (nao negativo)', () => {
  assert.deepEqual(validarSalarios([linha('0')]).valores, [0]);
});

test('divisao II com TV 157 130: o minimo e 293 833', () => {
  const r = calcularOrcamento([linha('100000')], '2', '157 130');
  assert.equal(r.piso, 293833);
  assert.ok(r.orcamento);
  assert.equal(r.orcamento.piso, 293833);
  assert.equal(r.orcamento.semana, 100000);
  assert.equal(r.orcamento.pagoPorSemana, 293833);
  assert.equal(r.orcamento.diferenca, 100000 - 293833);
  assert.deepEqual(r.orcamento.epoca, { min: 12 * 293833, max: 14 * 293833 });
});

test('acima do minimo: paga-se o total', () => {
  const r = calcularOrcamento([linha('200 000', 1), linha('150.000', 2)], '2', '157130');
  assert.ok(r.orcamento);
  assert.equal(r.orcamento.semana, 350000);
  assert.equal(r.orcamento.diferenca, 350000 - 293833);
  assert.equal(r.orcamento.pagoPorSemana, 350000);
});

test('sem divisao ou sem TV valida: nao ha minimo nem orcamento', () => {
  const a = calcularOrcamento([linha('100000')], '', '157130');
  assert.equal(a.piso, null);
  assert.equal(a.orcamento, null);
  assert.equal(a.erroTv, undefined);

  const b = calcularOrcamento([linha('100000')], '2', '');
  assert.equal(b.piso, null);
  assert.equal(b.erroTv, undefined);

  const c = calcularOrcamento([linha('100000')], '2', '0');
  assert.equal(c.piso, null);
  assert.ok(c.erroTv);
  const d = calcularOrcamento([linha('100000')], '2', 'abc');
  assert.ok(d.erroTv);
});

test('com o piso e sem salarios: so o minimo; com erro numa linha: nada de total', () => {
  const sem = calcularOrcamento([linha('')], '4', '100000');
  assert.equal(sem.piso, 100000);
  assert.equal(sem.orcamento, null);
  assert.equal(sem.semSalarios, true);

  const erro = calcularOrcamento([linha('x')], '4', '100000');
  assert.equal(erro.piso, 100000);
  assert.equal(erro.orcamento, null);
  assert.equal(erro.haErrosLinhas, true);
});

test('resumoModelo: cinco posicoes, amostra e erro do salario.json; SG derivado', () => {
  const r = resumoModelo();
  assert.deepEqual(r.map((x) => x.posicao), ['PG', 'SG', 'SF', 'PF', 'C']);
  const pg = r[0];
  assert.equal(pg.amostra, 81);
  assert.equal(pg.erro, 0.0572);
  assert.equal(pg.derivado, false);
  const sg = r[1];
  assert.equal(sg.derivado, true);
  assert.equal(sg.amostra, null);
  assert.equal(sg.erro, Math.max(0.0572, 0.0498));
  for (const x of r) assert.ok(x.erro > 0 && x.erro < 1);
});

test('haSkillsAcimaDe20: so 21 para cima conta (20 ainda esta na escala)', () => {
  const base = Object.fromEntries(['JS', 'JR', 'OD', 'HA', 'DR', 'PA', 'IS', 'ID', 'RB', 'SB', 'ST', 'FT'].map((k) => [k, 20])) as Skills;
  assert.equal(haSkillsAcimaDe20(base), false);
  assert.equal(haSkillsAcimaDe20({ ...base, FT: 21 }), true);
  assert.equal(haSkillsAcimaDe20({ ...base, JS: 40 }), true);
});
