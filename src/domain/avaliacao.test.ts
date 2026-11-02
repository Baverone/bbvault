import test from 'node:test';
import assert from 'node:assert/strict';
import { POSICOES, SKILLS, SKILLS_TSP } from './escalas.ts';
import type { Skills, SkillsTsp } from './escalas.ts';
import { bandaAltura, compararPerfil, forcaPorPosicao, fracaoEpocaRestante, projecaoPotencial } from './avaliacao.ts';

function skills(base: number, extra: Partial<Skills>): Skills {
  const s = {} as Skills;
  for (const k of SKILLS) s[k] = base;
  return { ...s, ...extra };
}

test('poste: IS, ID, RB e SB a 18, o resto a 5 -> notas exatas, melhor C', () => {
  const r = forcaPorPosicao(skills(5, { IS: 18, ID: 18, RB: 18, SB: 18 }));
  assert.deepEqual(r.notas, { PG: 31, SG: 39, SF: 47, PF: 75, C: 85 });
  assert.equal(r.melhor, 'C');
});

test('base: PA, HA e OD a 18, o resto a 5 -> notas exatas, melhor PG', () => {
  const r = forcaPorPosicao(skills(5, { PA: 18, HA: 18, OD: 18 }));
  assert.deepEqual(r.notas, { PG: 65, SG: 48, SF: 32, PF: 22, C: 22 });
  assert.equal(r.melhor, 'PG');
});

test('todas as skills a 20 -> 100 em todas as posicoes; a 1 -> 0', () => {
  assert.deepEqual(forcaPorPosicao(skills(20, {})).notas, { PG: 100, SG: 100, SF: 100, PF: 100, C: 100 });
  assert.deepEqual(forcaPorPosicao(skills(1, {})).notas, { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 });
});

test('skills acima de 20 ficam limitadas a 100; notas sempre entre 0 e 100', () => {
  assert.deepEqual(forcaPorPosicao(skills(40, {})).notas, { PG: 100, SG: 100, SF: 100, PF: 100, C: 100 });
  for (const s of [skills(5, {}), skills(1, {}), skills(30, {}), skills(5, { JS: 18 }), skills(5, { DR: 40 })]) {
    const r = forcaPorPosicao(s);
    for (const p of POSICOES) assert.ok(r.notas[p] >= 0 && r.notas[p] <= 100, `${p} ${r.notas[p]}`);
    for (const p of POSICOES) assert.ok(r.notas[r.melhor] >= r.notas[p]);
  }
});

test('empate exato (todas iguais) resolve pela ordem de POSICOES', () => {
  assert.equal(forcaPorPosicao(skills(20, {})).melhor, 'PG');
  assert.equal(forcaPorPosicao(skills(7, {})).melhor, 'PG');
});

test('melhor usa o valor sem arredondar: SF e PF dao 5, mas PF e maior', () => {
  const r = forcaPorPosicao(skills(2, { PA: 1, HA: 1 }));
  assert.equal(r.notas.SF, r.notas.PF);
  assert.equal(r.melhor, 'PF');
});

test('bandaAltura: limites das bandas', () => {
  assert.equal(bandaAltura(187), '<=187');
  assert.equal(bandaAltura(188), '188-195');
  assert.equal(bandaAltura(195), '188-195');
  assert.equal(bandaAltura(196), '196-202');
  assert.equal(bandaAltura(202), '196-202');
  assert.equal(bandaAltura(203), '203-212');
  assert.equal(bandaAltura(212), '203-212');
  assert.equal(bandaAltura(213), '>=213');
  assert.equal(bandaAltura(230), '>=213');
});

test('compararPerfil: abaixo < p25, acima > p75, dentro nos limites', () => {
  const baixo = Object.fromEntries(SKILLS_TSP.map((k) => [k, 1])) as SkillsTsp;
  const alto = Object.fromEntries(SKILLS_TSP.map((k) => [k, 40])) as SkillsTsp;
  const a = compararPerfil(210, baixo);
  assert.equal(a.banda, '203-212');
  assert.equal(typeof a.amostraPequena, 'boolean');
  for (const k of SKILLS_TSP) assert.equal(a.skills[k], 'abaixo');
  for (const k of SKILLS_TSP) assert.equal(compararPerfil(210, alto).skills[k], 'acima');
});

test('compararPerfil: p25 e p75 exatos contam como dentro', () => {
  // banda <=187: JS tem p25 = p75 = 21
  const s = Object.fromEntries(SKILLS_TSP.map((k) => [k, 21])) as SkillsTsp;
  const r = compararPerfil(180, s);
  assert.equal(r.banda, '<=187');
  assert.equal(r.amostraPequena, true);
  assert.equal(r.skills.JS, 'dentro');
  assert.equal(compararPerfil(180, { ...s, JS: 20 }).skills.JS, 'abaixo');
  assert.equal(compararPerfil(180, { ...s, JS: 22 }).skills.JS, 'acima');
});

// Hoje = 2026-11-02: a proxima mudanca de idade e 2026-11-13, a 11 dias de 98 (fracao 11/98).
const HOJE = '2026-11-02';

test('fracaoEpocaRestante: dias ate a proxima sexta de mudanca de idade a dividir por 98', () => {
  assert.equal(fracaoEpocaRestante('2026-11-02'), 11 / 98);
  // na propria sexta de mudanca a idade acabou de subir: a epoca inteira esta por fazer
  assert.equal(fracaoEpocaRestante('2026-11-13'), 1);
  // um dia depois faltam 97 dias
  assert.equal(fracaoEpocaRestante('2026-11-14'), 97 / 98);
  // um dia antes falta 1 dia
  assert.equal(fracaoEpocaRestante('2026-11-12'), 1 / 98);
  // para tras da ancora conta na mesma (19/02/2027 - 98 = 13/11/2026)
  assert.equal(fracaoEpocaRestante('2027-02-18'), 1 / 98);
});

test('projecaoPotencial(23, 100, 9, hoje): a epoca atual conta so 11/98 do ganho', () => {
  const r = projecaoPotencial(23, 100, 9, HOJE);
  assert.equal(r.tecto, 144);
  // aos 24: so a epoca dos 23 (mediana 8, P90 11) a 11/98
  //   mediana 100 + 8*11/98 = 100.898 -> 101 ; P90 100 + 11*11/98 = 101.235 -> 101
  assert.deepEqual(r.aos[0], { idade: 24, mediana: 101, p90: 101 });
  // aos 26: 100 + 8*11/98 + 8 + 6 = 114.898 -> 115 ; P90 100 + 11*11/98 + 10 + 9 = 120.235 -> 120
  assert.deepEqual(r.aos[1], { idade: 26, mediana: 115, p90: 120 });
  // aos 28: 100 + 8*11/98 + 8 + 6 + 5 + 4 = 123.898 -> 124 ; P90 100 + 11*11/98 + 10 + 9 + 7 + 7 = 134.235 -> 134
  assert.deepEqual(r.aos[2], { idade: 28, mediana: 124, p90: 134 });
});

test('projecaoPotencial(20, 100, 9, hoje): aos 24 as tres epocas seguintes inteiras e a atual a 11/98', () => {
  const r = projecaoPotencial(20, 100, 9, HOJE);
  // mediana 100 + 12*11/98 + 10 + 9 + 8 = 128.347 -> 128 ; P90 100 + 15*11/98 + 13 + 11 + 11 = 136.684 -> 137
  assert.deepEqual(r.aos[0], { idade: 24, mediana: 128, p90: 137 });
  assert.deepEqual(
    r.aos.map((x) => x.idade),
    [24, 26, 28],
  );
  for (const x of r.aos) assert.ok(x.mediana <= 144 && x.p90 <= 144 && x.p90 >= x.mediana);
});

test('projecaoPotencial: na sexta da mudanca de idade a epoca atual conta inteira', () => {
  // 2026-11-13: fracao 1 -> 100 + 8 = 108 (mediana) e 100 + 11 = 111 (P90)
  assert.deepEqual(projecaoPotencial(23, 100, 9, '2026-11-13').aos[0], { idade: 24, mediana: 108, p90: 111 });
});

test('projecaoPotencial: com o TSP atual acima do tecto tudo fica no tecto', () => {
  // 18 anos, TSP 120, potencial 8 (tecto 111)
  const r = projecaoPotencial(18, 120, 8, HOJE);
  for (const x of r.aos) assert.equal(x.mediana, 111);
});

test('projecaoPotencial: os alvos 24, 26 e 28 nunca somam a epoca 28 (P90 null), por isso sem aviso', () => {
  // 18 -> 28 soma as epocas 18..27, nenhuma com P90 null
  assert.deepEqual(projecaoPotencial(18, 50, 11, HOJE).avisos, []);
});

test('projecaoPotencial(28, 120, 8): sem idades-alvo a frente', () => {
  const r = projecaoPotencial(28, 120, 8, HOJE);
  assert.deepEqual(r.aos, []);
  assert.equal(r.tecto, 111);
});

test('projecaoPotencial: idades-alvo <= idade nao entram', () => {
  const r = projecaoPotencial(25, 100, 9, HOJE);
  assert.deepEqual(
    r.aos.map((x) => x.idade),
    [26, 28],
  );
  // so a epoca dos 25 (mediana 6, P90 9) a 11/98 conta para o alvo 26: 100.673 -> 101 ; 101.010 -> 101
  assert.deepEqual(r.aos[0], { idade: 26, mediana: 101, p90: 101 });
  assert.equal(projecaoPotencial(24, 100, 9, HOJE).aos[0].idade, 26);
});

test('projecaoPotencial(20, 80, 3): sem tecto, com aviso', () => {
  const r = projecaoPotencial(20, 80, 3, HOJE);
  assert.equal(r.tecto, null);
  assert.ok(r.avisos.length >= 1);
  assert.ok(r.aos.length > 0);
});

test('projecaoPotencial: o tecto limita mediana e P90 quando o TSP atual ja o passa', () => {
  const r = projecaoPotencial(20, 150, 8, HOJE);
  assert.equal(r.tecto, 111);
  for (const x of r.aos) assert.equal(x.mediana, 111);
});

test('projecaoPotencial: nunca fica abaixo do TSP atual (piso)', () => {
  for (const hoje of ['2026-11-02', '2026-11-13', '2026-12-31']) {
    for (const x of projecaoPotencial(23, 100, 9, hoje).aos) assert.ok(x.mediana >= 100 && x.p90 >= x.mediana);
  }
});
