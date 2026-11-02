import test from 'node:test';
import assert from 'node:assert/strict';
import { AVISOS, CENARIOS, MOTIVOS, TREINOS, ganhoSemanal, gruposCom } from './modelo.ts';

function valor<T>(e: { ok: true; valor: T; avisos: string[] } | { ok: false; motivo: string }) {
  assert.ok(e.ok, e.ok ? '' : e.motivo);
  return e;
}

test('pg_21_pressure_taxa: ganho aos 21, treinador 6, 1 posicao, 48 min', () => {
  const r = valor(ganhoSemanal(21, 48, 6, 1));
  assert.ok(r.valor >= 0.52 && r.valor <= 0.64, `ganho ${r.valor}`);
  assert.deepEqual(r.avisos, []);
});

test('referencia: 20 anos, treinador 6, 1 posicao, 48 min da a base 0.67', () => {
  const r = valor(ganhoSemanal(20, 48, 6, 1));
  assert.ok(Math.abs(r.valor - 0.67) < 1e-12);
});

test('minutos_abaixo_do_limiar: 30 min aos 20 anos da 0.67 x 30/48, com aviso', () => {
  const r = valor(ganhoSemanal(20, 30, 6, 1));
  assert.ok(Math.abs(r.valor - (0.67 * 30) / 48) < 1e-9, `ganho ${r.valor}`);
  assert.ok(Math.abs(r.valor - 0.419) < 0.001);
  assert.deepEqual(r.avisos, [AVISOS.minutos]);
});

test('minutos_na_folga: 47 min aos 20 anos da fator 1, sem aviso', () => {
  const r = valor(ganhoSemanal(20, 47, 6, 1));
  assert.ok(Math.abs(r.valor - 0.67) < 1e-12);
  assert.deepEqual(r.avisos, []);
});

test('limiar de minutos depende da idade (45 aos 18-19, 40 a partir dos 27)', () => {
  assert.deepEqual(valor(ganhoSemanal(19, 44, 6, 1)).avisos, []);
  assert.deepEqual(valor(ganhoSemanal(19, 43, 6, 1)).avisos, [AVISOS.minutos]);
  assert.deepEqual(valor(ganhoSemanal(27, 39, 6, 1)).avisos, []);
  const r = valor(ganhoSemanal(27, 30, 6, 1));
  assert.ok(Math.abs(r.valor - (0.67 * 0.333 * 30) / 40) < 1e-9);
});

test('sem_estimativa_treinador_2: treinador de nivel 1-2 nao responde', () => {
  for (const t of [1, 2]) {
    const r = ganhoSemanal(20, 48, t, 1);
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.motivo, MOTIVOS.treinador);
  }
});

test('sem_estimativa_tres_posicoes: ganho com 3 posicoes nao responde', () => {
  const r = ganhoSemanal(20, 48, 6, 3);
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.motivo, MOTIVOS.tresPosicoes);
});

test('2 posicoes: fator 0.62, com aviso de estimativa', () => {
  const r = valor(ganhoSemanal(20, 48, 6, 2));
  assert.ok(Math.abs(r.valor - 0.67 * 0.62) < 1e-12);
  assert.deepEqual(r.avisos, [AVISOS.duasPosicoes]);
});

test('idade abaixo de 18 e rejeitada', () => {
  const r = ganhoSemanal(17, 48, 6, 1);
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.motivo, MOTIVOS.idade);
});

test('idade acima de 28 usa o fator dos 28, com aviso', () => {
  const r28 = valor(ganhoSemanal(28, 48, 6, 1));
  const r31 = valor(ganhoSemanal(31, 48, 6, 1));
  assert.equal(r31.valor, r28.valor);
  assert.deepEqual(r31.avisos, [AVISOS.idadeAcima28]);
});

test('avisos em ordem estavel: idade, minutos, posicoes', () => {
  const r = valor(ganhoSemanal(30, 10, 6, 2));
  assert.deepEqual(r.avisos, [AVISOS.idadeAcima28, AVISOS.minutos, AVISOS.duasPosicoes]);
});

test('gruposCom: so os grupos do treino que incluem a posicao', () => {
  assert.deepEqual(gruposCom('shot-blocking', 'C'), [['C'], ['C', 'PF'], ['C', 'PF', 'SF']]);
  assert.deepEqual(gruposCom('shot-blocking', 'SF'), [['C', 'PF', 'SF']]);
  assert.deepEqual(gruposCom('shot-blocking', 'PG'), []);
  assert.deepEqual(gruposCom('nao-existe', 'C'), []);
});

test('TREINOS e CENARIOS vem dos dados', () => {
  assert.equal(TREINOS.length, 10);
  assert.deepEqual([...CENARIOS], ['rapido', 'esperado', 'lento']);
});
