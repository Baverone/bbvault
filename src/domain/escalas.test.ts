import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nomeSkill,
  SKILL_MAXIMA,
  POSICOES,
  POTENCIAIS,
  SKILLS,
  SKILLS_TSP,
  TREINADORES,
  tsp,
  validarSkills,
} from './escalas.ts';

test('nomeSkill: 1 a 20 pela escala, acima de 20 legendary, abaixo de 1 travessao', () => {
  assert.equal(nomeSkill(1), 'atrocious');
  assert.equal(nomeSkill(9), 'proficient');
  assert.equal(nomeSkill(20), 'legendary');
  assert.equal(nomeSkill(27), 'legendary');
  assert.equal(nomeSkill(0), '—');
});

test('POTENCIAIS e TREINADORES: nomes pelo indice', () => {
  assert.equal(POTENCIAIS.length, 12);
  assert.equal(POTENCIAIS[9], 'MVP');
  assert.equal(TREINADORES.length, 7);
  assert.equal(TREINADORES[5], 'exceptional');
});

test('SKILLS: as 10 do TSP mais ST e FT; cinco posicoes', () => {
  assert.equal(SKILLS_TSP.length, 10);
  assert.equal(SKILLS.length, 12);
  assert.deepEqual([...POSICOES], ['PG', 'SG', 'SF', 'PF', 'C']);
});

test('tsp soma as dez skills do TSP', () => {
  const jogador = { JS: 17, JR: 10, OD: 15, HA: 14, DR: 15, PA: 7, IS: 10, ID: 6, RB: 3, SB: 5 };
  assert.equal(tsp(jogador), 102);
});

test('validarSkills converte strings de formulario para numero', () => {
  assert.deepEqual(validarSkills({ JS: '25', JR: 10 }, ['JS', 'JR']), {
    ok: true,
    skills: { JS: 25, JR: 10 },
  });
});

test('validarSkills: vazio, zero, texto, decimal e ausente sao erradas', () => {
  for (const v of [0, '', 'abc', 1.5, '1.5', undefined]) {
    assert.deepEqual(validarSkills({ JS: v }, ['JS']), { ok: false, erradas: ['JS'] });
  }
  assert.deepEqual(validarSkills({}, ['JS']), { ok: false, erradas: ['JS'] });
});

test('validarSkills: 21 a 40 sao validas, 41 para cima nao', () => {
  assert.equal(SKILL_MAXIMA, 40);
  assert.deepEqual(validarSkills({ JS: 21 }, ['JS']), { ok: true, skills: { JS: 21 } });
  assert.deepEqual(validarSkills({ JS: 40, JR: '40' }, ['JS', 'JR']), { ok: true, skills: { JS: 40, JR: 40 } });
  for (const v of [41, '41', 99, '100']) {
    assert.deepEqual(validarSkills({ JS: v }, ['JS']), { ok: false, erradas: ['JS'] });
  }
});

test('validarSkills so olha as skills pedidas em quais', () => {
  assert.deepEqual(validarSkills({ JS: 0, JR: 5 }, ['JR']), { ok: true, skills: { JR: 5 } });
});

test('validarSkills lista as erradas pela ordem de quais', () => {
  assert.deepEqual(validarSkills({ JS: 0, JR: 'x', OD: 3 }, ['JS', 'JR', 'OD']), {
    ok: false,
    erradas: ['JS', 'JR'],
  });
});
