import test from 'node:test';
import assert from 'node:assert/strict';
import type { SkillsTsp } from '../../domain/escalas.ts';
import { proximaSexta } from '../../domain/calendario.ts';
import type { JogadorTreino } from '../../domain/treino/modelo.ts';
import { planear } from '../../domain/treino/plano.ts';
import {
  blocosDoPlano,
  blocosParaProjecao,
  projetarTres,
  sextasDoBloco,
  tempoAteAlvo,
  textoPendencias,
  validarLinhas,
} from './calculos.ts';

const skills: SkillsTsp = { JS: 3, JR: 2, OD: 4, HA: 3, DR: 3, PA: 2, IS: 8, ID: 8, RB: 9, SB: 14 };
const poste: JogadorTreino = { idade: 20, cm: 213, potencial: 9, skills, posicao: 'C', minutos: 48 };
const INICIO = proximaSexta('2026-11-02');

test('proximaSexta de uma segunda e a sexta dessa semana', () => {
  assert.equal(INICIO, '2026-11-06');
});

test('validarLinhas: vazias ignoradas, erradas e repetidas dao erro, nada se calcula com erro', () => {
  const v = validarLinhas([
    { skill: 'SB', alvo: '18' },
    { skill: 'ID', alvo: '' },
  ]);
  assert.deepEqual(v.objetivos, { SB: 18 });
  assert.equal(v.vazio, false);

  assert.equal(validarLinhas([{ skill: 'SB', alvo: '' }]).vazio, true);
  assert.equal(validarLinhas([{ skill: 'SB', alvo: '' }]).objetivos, null);

  for (const mau of ['0', '41', 'x', '-1', '1.5']) {
    const r = validarLinhas([{ skill: 'SB', alvo: mau }]);
    assert.ok(r.erros[0], mau);
    assert.equal(r.objetivos, null);
  }
  const rep = validarLinhas([
    { skill: 'SB', alvo: '18' },
    { skill: 'SB', alvo: '19' },
  ]);
  assert.ok(rep.erros[1]);
  assert.equal(rep.erros[0], undefined);
  assert.equal(rep.objetivos, null);
});

test('plano incompleto nao serve de base a projecao; completo serve', () => {
  const alto: SkillsTsp = { JS: 10, JR: 10, OD: 10, HA: 10, DR: 10, PA: 10, IS: 9, ID: 9, RB: 9, SB: 9 };
  const incompleto = planear({ ...poste, potencial: 5, skills: alto }, { SB: 14 }, 6, INICIO);
  assert.ok(incompleto.ok);
  assert.equal(incompleto.valor.total.esperado, null);
  assert.equal(blocosDoPlano(incompleto), null);

  const completo = planear(poste, { SB: 18 }, 6, INICIO);
  assert.ok(completo.ok);
  const blocos = blocosDoPlano(completo);
  assert.ok(blocos && blocos.length === 1);
  assert.equal(blocosDoPlano(null), null);
});

test('blocosParaProjecao: sem plano e o treino escolhido N semanas; com plano corta em N', () => {
  const escolhido = { treino: 'shot-blocking', grupo: ['C' as const] };
  assert.deepEqual(blocosParaProjecao(null, escolhido, 4), [{ ...escolhido, semanas: 4 }]);
  const plano = [
    { treino: 'shot-blocking', grupo: ['C' as const], semanas: 5 },
    { treino: 'inside-defense', grupo: ['C' as const], semanas: 3 },
  ];
  assert.deepEqual(
    blocosParaProjecao(plano, escolhido, 6).map((b) => b.semanas),
    [5, 1],
  );
  assert.deepEqual(
    blocosParaProjecao(plano, escolhido, 98).map((b) => b.semanas),
    [5, 3],
  );
  assert.deepEqual(
    blocosParaProjecao(plano, escolhido, 2).map((b) => b.semanas),
    [2],
  );
});

test('poste 20 anos SB 14 a 18: 5 / 7 / 9 semanas a contar da proxima sexta', () => {
  const r = tempoAteAlvo(poste, { treino: 'shot-blocking', grupo: ['C'] }, 'SB', 18, 6, INICIO);
  assert.ok(r.ok);
  const { rapido, esperado, lento } = r.valor;
  assert.ok(rapido && esperado && lento);
  assert.deepEqual([rapido.semanas, esperado.semanas, lento.semanas], [5, 7, 9]);
  assert.equal(esperado.sexta, '2026-12-18');
});

test('projetarTres: TSP final por cenario e TSP atual', () => {
  const blocos = blocosParaProjecao(null, { treino: 'shot-blocking', grupo: ['C'] }, 4);
  const r = projetarTres(poste, blocos, 6, INICIO);
  assert.ok(r.ok);
  assert.equal(r.valor.tspAtual, 3 + 2 + 4 + 3 + 3 + 2 + 8 + 8 + 9 + 14);
  assert.equal(r.valor.porCenario.esperado.semanas.length, 4);
  assert.ok(r.valor.porCenario.rapido.tspFinal >= r.valor.porCenario.esperado.tspFinal);
  assert.ok(r.valor.porCenario.esperado.tspFinal >= r.valor.porCenario.lento.tspFinal);
});

test('projetarTres: grupo de 3 posicoes ou treinador 1-2 da sem estimativa', () => {
  const tres = projetarTres(poste, [{ treino: 'shot-blocking', grupo: ['C', 'PF', 'SF'], semanas: 4 }], 6, INICIO);
  assert.equal(tres.ok, false);
  const fraco = projetarTres(poste, [{ treino: 'shot-blocking', grupo: ['C'], semanas: 4 }], 2, INICIO);
  assert.equal(fraco.ok, false);
});

test('sextasDoBloco: de e ate', () => {
  assert.deepEqual(sextasDoBloco('2026-11-06', 0, 5), { de: '2026-11-06', ate: '2026-12-04' });
  assert.deepEqual(sextasDoBloco('2026-11-06', 5, 3), { de: '2026-12-11', ate: '2026-12-25' });
});

test('textoPendencias: so diz «a vermelho» do que esta a vermelho', () => {
  const soFaltam = textoPendencias({ faltam: ['idade', 'SB'], errados: [] });
  assert.ok(soFaltam.startsWith('Faltam campos por preencher: idade, SB.'));
  assert.ok(!soFaltam.includes('vermelho'));
  const soErrados = textoPendencias({ faltam: [], errados: ['OD'] });
  assert.ok(soErrados.startsWith('Corrige os campos a vermelho (OD).'));
  assert.ok(!soErrados.includes('Faltam') && !soErrados.includes('faltam'));
  const ambos = textoPendencias({ faltam: ['cm'], errados: ['OD'] });
  assert.ok(ambos.includes('vermelho (OD); faltam campos por preencher: cm'));
});
