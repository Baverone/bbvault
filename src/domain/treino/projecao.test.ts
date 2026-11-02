import test from 'node:test';
import assert from 'node:assert/strict';
import type { SkillsTsp } from '../escalas.ts';
import { AVISOS, MOTIVOS, type JogadorTreino } from './modelo.ts';
import { nivel, projetar, semanasAte } from './projecao.ts';

/** Skills baixas, para nenhum caso de teste bater no tecto sem querer. */
function skillsBaixas(extra: Partial<SkillsTsp> = {}): SkillsTsp {
  return { JS: 3, JR: 2, OD: 4, HA: 3, DR: 3, PA: 2, IS: 8, ID: 8, RB: 9, SB: 14, ...extra };
}

function poste(extra: Partial<JogadorTreino> = {}): JogadorTreino {
  return {
    idade: 20,
    cm: 213,
    potencial: 9,
    skills: skillsBaixas(),
    posicao: 'C',
    minutos: 48,
    ...extra,
  };
}

const SB_C = { treino: 'shot-blocking', grupo: ['C' as const] };

test('poste_20_sb_14_a_18: semanas em rapido, esperado e lento', () => {
  const r = semanasAte(poste(), SB_C, 'SB', 18, 6, '2026-11-06');
  assert.ok(r.ok, r.ok ? '' : r.motivo);
  const { rapido, esperado, lento } = r.valor;
  assert.ok(rapido && esperado && lento);
  assert.ok(esperado.semanas >= 5 && esperado.semanas <= 7, `esperado ${esperado.semanas}`);
  assert.ok(lento.semanas >= 6, `lento ${lento.semanas}`);
  assert.ok(rapido.semanas <= 6, `rapido ${rapido.semanas}`);
  assert.ok(lento.semanas >= esperado.semanas && esperado.semanas >= rapido.semanas);
  // A sexta e a da ultima semana de treino.
  const ultima = new Date(Date.UTC(2026, 10, 6 + 7 * (esperado.semanas - 1))).toISOString().slice(0, 10);
  assert.equal(esperado.sexta, ultima);
  assert.deepEqual(r.avisos, []);
});

test('semanasAte: alvo ja atingido da 0 semanas e a sexta de inicio', () => {
  const r = semanasAte(poste(), SB_C, 'SB', 14, 6, '2026-11-06');
  assert.ok(r.ok);
  for (const c of ['rapido', 'esperado', 'lento'] as const) {
    assert.deepEqual(r.valor[c], { semanas: 0, sexta: '2026-11-06' });
  }
});

test('sem_estimativa_tres_posicoes: grupo C/PF/SF nao responde', () => {
  const r = semanasAte(poste(), { treino: 'shot-blocking', grupo: ['C', 'PF', 'SF'] }, 'SB', 18, 6, '2026-11-06');
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.motivo, MOTIVOS.tresPosicoes);
});

test('sem_estimativa_treinador_2', () => {
  const r = semanasAte(poste(), SB_C, 'SB', 18, 2, '2026-11-06');
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.motivo, MOTIVOS.treinador);
});

test('sem_estimativa_fora_do_grupo: um PG com Shot Blocking em C nao treina', () => {
  const pg = poste({ posicao: 'PG' });
  const r = semanasAte(pg, SB_C, 'SB', 18, 6, '2026-11-06');
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.motivo, MOTIVOS.foraDoGrupo);
  const p = projetar(pg, [{ ...SB_C, semanas: 3 }], 6, '2026-11-06', 'esperado');
  assert.equal(p.ok, false);
  assert.equal(!p.ok && p.motivo, MOTIVOS.foraDoGrupo);
});

test('grupo que o treino nao tem nao responde', () => {
  const r = semanasAte(poste(), { treino: 'rebounding', grupo: ['C'] }, 'RB', 12, 6, '2026-11-06');
  assert.equal(r.ok, false);
});

test('idade_muda_na_propria_sexta: inicio na sexta da mudanca ja usa a idade nova', () => {
  const r = projetar(poste(), [{ ...SB_C, semanas: 1 }], 6, '2026-11-13', 'esperado');
  assert.ok(r.ok, r.ok ? '' : r.motivo);
  assert.equal(r.valor.semanas.length, 1);
  assert.equal(r.valor.semanas[0].sexta, '2026-11-13');
  assert.equal(r.valor.semanas[0].idade, 21);
  // O ganho dessa semana e o dos 21 anos (0.67 x 0.833).
  assert.ok(Math.abs(r.valor.semanas[0].skills.SB - (14.5 + 0.67 * 0.833)) < 1e-9);

  const r2 = projetar(poste(), [{ ...SB_C, semanas: 2 }], 6, '2026-11-06', 'esperado');
  assert.ok(r2.ok);
  assert.deepEqual(
    r2.valor.semanas.map((s) => [s.sexta, s.idade]),
    [
      ['2026-11-06', 20],
      ['2026-11-13', 21],
    ],
  );
});

test('projetar: secundarias ganham 0.15 do ganho, tsp soma as partes inteiras', () => {
  const r = projetar(poste(), [{ ...SB_C, semanas: 1 }], 6, '2026-11-06', 'esperado');
  assert.ok(r.ok);
  const s = r.valor.semanas[0];
  assert.ok(Math.abs(s.skills.SB - (14.5 + 0.67)) < 1e-9);
  assert.ok(Math.abs(s.skills.ID - (8.5 + 0.15 * 0.67)) < 1e-9);
  assert.ok(Math.abs(s.skills.RB - (9.5 + 0.15 * 0.67)) < 1e-9);
  assert.equal(s.skills.JS, 3.5);
  // SB 15.17 conta 15; o resto fica no nivel visivel.
  assert.equal(s.tsp, 57);
  assert.equal(r.valor.parouNoTecto, false);
});

test('projetar: cenarios rapido e lento usam mult e inicio proprios', () => {
  const rap = projetar(poste(), [{ ...SB_C, semanas: 1 }], 6, '2026-11-06', 'rapido');
  const len = projetar(poste(), [{ ...SB_C, semanas: 1 }], 6, '2026-11-06', 'lento');
  assert.ok(rap.ok && len.ok);
  assert.ok(Math.abs(rap.valor.semanas[0].skills.SB - (14.99 + 0.67 * 1.15)) < 1e-9);
  assert.ok(Math.abs(len.valor.semanas[0].skills.SB - (14 + 0.67 * 0.85)) < 1e-9);
});

test('para_no_tecto: potencial 5 com TSP 96 para quando o TSP chega a 97', () => {
  const skills: SkillsTsp = { JS: 10, JR: 10, OD: 10, HA: 10, DR: 10, PA: 10, IS: 9, ID: 9, RB: 9, SB: 9 };
  const j = poste({ potencial: 5, skills });
  const r = projetar(j, [{ ...SB_C, semanas: 10 }], 6, '2026-11-06', 'lento');
  assert.ok(r.ok, r.ok ? '' : r.motivo);
  assert.equal(r.valor.parouNoTecto, true);
  const ultima = r.valor.semanas.at(-1);
  assert.ok(ultima);
  assert.equal(ultima.tsp, 97);
  assert.ok(r.valor.semanas.slice(0, -1).every((s) => s.tsp < 97));
  assert.ok(r.valor.semanas.length < 10);
  assert.ok(r.avisos.includes(AVISOS.tecto));

  // semanasAte que so chegaria depois do tecto fica sem numero nesse cenario.
  const a = semanasAte(j, SB_C, 'SB', 12, 6, '2026-11-06');
  assert.ok(a.ok);
  assert.equal(a.valor.esperado, null);
  assert.equal(a.valor.lento, null);
  assert.ok(a.avisos.includes(AVISOS.tecto));
});

test('potencial abaixo de 5: sem tecto, com aviso', () => {
  const j = poste({ potencial: 4 });
  const r = projetar(j, [{ ...SB_C, semanas: 2 }], 6, '2026-11-06', 'esperado');
  assert.ok(r.ok);
  assert.equal(r.valor.semanas.length, 2);
  assert.deepEqual(r.avisos, [AVISOS.semTecto]);
});

test('sem_estimativa_400_semanas: sem minutos nunca chega, null com aviso', () => {
  const r = semanasAte(poste({ minutos: 0 }), SB_C, 'SB', 15, 6, '2026-11-06');
  assert.ok(r.ok);
  assert.deepEqual(r.valor, { rapido: null, esperado: null, lento: null });
  assert.ok(r.avisos.includes(AVISOS.minutos));
  assert.ok(r.avisos.some((a) => a.includes('400 semanas')));
});

test('avisos deduplicados: o aviso de minutos aparece uma vez', () => {
  const r = projetar(poste({ minutos: 30 }), [{ ...SB_C, semanas: 5 }], 6, '2026-11-06', 'esperado');
  assert.ok(r.ok);
  assert.deepEqual(r.avisos, [AVISOS.minutos]);
});

test('idade abaixo de 18: projecao rejeitada', () => {
  const r = projetar(poste({ idade: 17 }), [{ ...SB_C, semanas: 1 }], 6, '2026-11-06', 'esperado');
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.motivo, MOTIVOS.idade);
});

test('nivel: o epsilon nao deixa o erro de virgula flutuante perder um nivel', () => {
  let v = 0;
  for (let i = 0; i < 10; i++) v += 0.1;
  assert.ok(v < 1, 'o erro acumulado deixa a soma abaixo de 1');
  assert.equal(nivel(v), 1);
  assert.equal(nivel(17 + v), 18);
  assert.equal(nivel(17.99), 17);
  assert.equal(nivel(18), 18);
});
