import test from 'node:test';
import assert from 'node:assert/strict';
import type { SkillsTsp } from '../escalas.ts';
import { somarDias } from '../calendario.ts';
import type { JogadorTreino } from './modelo.ts';
import { semanasAte } from './projecao.ts';
import { planear } from './plano.ts';

function poste(extra: Partial<SkillsTsp> = {}, potencial = 9): JogadorTreino {
  return {
    idade: 20,
    cm: 213,
    potencial,
    skills: { JS: 3, JR: 2, OD: 4, HA: 3, DR: 3, PA: 2, IS: 8, ID: 10, RB: 9, SB: 10, ...extra },
    posicao: 'C',
    minutos: 48,
  };
}

const INICIO = '2026-11-06';

test('plano_salta_objetivo_ja_cumprido: SB ja cumprido nao gera bloco', () => {
  const r = planear(poste(), { ID: 12, SB: 10 }, 6, INICIO);
  assert.ok(r.ok, r.ok ? '' : r.motivo);
  assert.equal(r.valor.blocos.length, 1);
  assert.equal(r.valor.blocos[0].treino, 'inside-defense');
  assert.deepEqual(r.valor.blocos[0].grupo, ['C']);
  assert.equal(r.valor.total.esperado, r.valor.blocos[0].semanas);
});

test('plano_salta_objetivo_ja_cumprido: as secundarias do bloco de SB cumprem o ID', () => {
  // Sozinho, o ID 11 precisa de pelo menos uma semana de treino.
  const sozinho = semanasAte(poste(), { treino: 'inside-defense', grupo: ['C'] }, 'ID', 11, 6, INICIO);
  assert.ok(sozinho.ok);
  assert.ok((sozinho.valor.esperado?.semanas ?? 0) >= 1);

  const r = planear(poste(), { SB: 15, ID: 11 }, 6, INICIO);
  assert.ok(r.ok, r.ok ? '' : r.motivo);
  assert.equal(r.valor.blocos.length, 1);
  assert.equal(r.valor.blocos[0].treino, 'shot-blocking');
});

test('plano_ordem_pelo_mais_longo: o objetivo mais longo sozinho vem primeiro', () => {
  // Na entrada o ID vem primeiro, mas o SB leva mais semanas sozinho.
  const r = planear(poste(), { ID: 13, SB: 16 }, 6, INICIO);
  assert.ok(r.ok, r.ok ? '' : r.motivo);
  assert.deepEqual(
    r.valor.blocos.map((b) => b.treino),
    ['shot-blocking', 'inside-defense'],
  );
  const soma = r.valor.blocos.reduce((t, b) => t + b.semanas, 0);
  assert.equal(r.valor.total.esperado, soma);
  assert.equal(r.valor.fim, somarDias(INICIO, 7 * (soma - 1)));
  const { rapido, esperado, lento } = r.valor.total;
  assert.ok(rapido !== null && esperado !== null && lento !== null);
  assert.ok(rapido <= esperado && esperado <= lento);
  // O 2.o bloco e mais curto do que o ID sozinho: as secundarias do SB contaram.
  const sozinho = semanasAte(poste(), { treino: 'inside-defense', grupo: ['C'] }, 'ID', 13, 6, INICIO);
  assert.ok(sozinho.ok && sozinho.valor.esperado);
  assert.ok(r.valor.blocos[1].semanas < sozinho.valor.esperado.semanas);
});

test('plano com tudo ja cumprido: sem blocos, total 0, fim no inicio', () => {
  const r = planear(poste(), { SB: 10, ID: 9 }, 6, INICIO);
  assert.ok(r.ok);
  assert.deepEqual(r.valor.blocos, []);
  assert.deepEqual(r.valor.total, { rapido: 0, esperado: 0, lento: 0 });
  assert.equal(r.valor.fim, INICIO);
});

test('plano sem treino para a posicao falha com motivo', () => {
  const r = planear(poste(), { PA: 5 }, 6, INICIO);
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.motivo, 'nenhum treino de PA inclui a posição C');
});

test('plano com treinador 2 falha', () => {
  const r = planear(poste(), { SB: 12 }, 2, INICIO);
  assert.equal(r.ok, false);
});

test('plano com grupo mais estreito de 3 posicoes falha', () => {
  // Para um SF, o Shot Blocking so tem o grupo C/PF/SF.
  const sf: JogadorTreino = { ...poste(), posicao: 'SF' };
  const r = planear(sf, { SB: 12 }, 6, INICIO);
  assert.equal(r.ok, false);
});

test('plano que bate no tecto no esperado: ok, sem total nem fim, com aviso do objetivo', () => {
  const j = poste({ JS: 10, JR: 10, OD: 10, HA: 10, DR: 10, PA: 10, IS: 9, ID: 9, RB: 9, SB: 9 }, 5);
  const r = planear(j, { SB: 14 }, 6, INICIO);
  assert.ok(r.ok, r.ok ? '' : r.motivo);
  assert.equal(r.valor.total.esperado, null);
  assert.equal(r.valor.fim, null);
  assert.ok(r.avisos.some((a) => a.includes('SB 14')), r.avisos.join(' | '));
});
