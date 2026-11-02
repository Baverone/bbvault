import test from 'node:test';
import assert from 'node:assert/strict';
import { POSICOES, SKILLS } from './escalas.ts';
import type { Skill, Skills } from './escalas.ts';
import { modeloSalario, orcamento, pisoSalarial, preverSalario, PISO_POR_DIVISAO } from './salario.ts';

function todas(n: number): Skills {
  const s = {} as Skills;
  for (const k of SKILLS) s[k] = n;
  return s;
}

test('piso por divisao: valores da spec', () => {
  assert.deepEqual(PISO_POR_DIVISAO, { 1: 2.415, 2: 1.87, 3: 1.3, 4: 1.0, 5: 0.7, 6: 0.7 });
});

test('pisoSalarial: arredondado as unidades', () => {
  assert.equal(pisoSalarial(2, 157130), 293833);
  assert.equal(pisoSalarial(3, 97359), 126567);
  assert.equal(pisoSalarial(4, 1000), 1000);
});

test('orcamento: salarios abaixo do piso paga o piso', () => {
  const o = orcamento([100, 200], 4, 500);
  assert.deepEqual(o, {
    semana: 300,
    piso: 500,
    pagoPorSemana: 500,
    diferenca: -200,
    epoca: { min: 6000, max: 7000 },
  });
});

test('orcamento: salarios acima do piso pagam os salarios', () => {
  const o = orcamento([1000, 2000], 4, 500);
  assert.equal(o.pagoPorSemana, 3000);
  assert.equal(o.diferenca, 2500);
  assert.deepEqual(o.epoca, { min: 36000, max: 42000 });
});

test('monotonia: subir 1 nivel na skill com maior b aumenta o salario', () => {
  for (const pos of POSICOES) {
    const { b } = modeloSalario(pos);
    let melhor: Skill = SKILLS[0];
    for (const k of SKILLS) if (b[k] > b[melhor]) melhor = k;
    const base = todas(10);
    const mais = { ...base, [melhor]: 11 };
    assert.ok(
      preverSalario(pos, mais).salario > preverSalario(pos, base).salario,
      `${pos} sobe com ${melhor}`,
    );
  }
});

test('SG e derivado, tem nota e os b sao a media de PG e SF', () => {
  const sg = modeloSalario('SG');
  const pg = modeloSalario('PG');
  const sf = modeloSalario('SF');
  assert.equal(sg.derivado, true);
  assert.equal(pg.derivado, false);
  assert.ok(Math.abs(sg.a - (pg.a + sf.a) / 2) < 1e-12);
  for (const k of SKILLS) assert.ok(Math.abs(sg.b[k] - (pg.b[k] + sf.b[k]) / 2) < 1e-12);
  assert.equal(sg.erroMediano, Math.max(pg.erroMediano, sf.erroMediano));
  const r = preverSalario('SG', todas(10));
  assert.equal(r.nota, 'poucos SG na amostra: média de PG e SF');
  assert.equal(r.margem, sg.erroMediano);
  assert.equal(preverSalario('PG', todas(10)).nota, null);
});

test('todas as skills a 10: salario > 0, finito e inteiro em todas as posicoes', () => {
  for (const pos of POSICOES) {
    const { salario, margem } = preverSalario(pos, todas(10));
    assert.ok(Number.isFinite(salario) && salario > 0, `${pos} ${salario}`);
    assert.ok(Number.isInteger(salario));
    assert.ok(margem > 0);
  }
});
