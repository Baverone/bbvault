import test from 'node:test';
import assert from 'node:assert/strict';
import { pendencias, validarJogador, type CampoJogador } from './validacao.ts';
import { SKILLS_TSP } from './escalas.ts';
import { jogadorVazio, type JogadorGuardado } from '../storage/jogador.ts';

const TODOS: CampoJogador[] = ['idade', 'cm', 'potencial', 'posicao', 'minutos'];

function poste(extra: Partial<JogadorGuardado> = {}, skills: Record<string, string> = {}): JogadorGuardado {
  const j = jogadorVazio();
  for (const s of SKILLS_TSP) j.skills[s] = '5';
  return {
    ...j,
    idade: '20',
    cm: '213',
    potencial: '9',
    posicao: 'C',
    minutos: '48',
    ...extra,
    skills: { ...j.skills, SB: '14', ...skills },
  };
}

test('jogador valido: sem erros e com os numeros', () => {
  const r = validarJogador(poste(), TODOS);
  assert.deepEqual(r.erros, {});
  assert.ok(r.valores);
  assert.equal(r.valores.idade, 20);
  assert.equal(r.valores.cm, 213);
  assert.equal(r.valores.potencial, 9);
  assert.equal(r.valores.posicao, 'C');
  assert.equal(r.valores.minutos, 48);
  assert.equal(r.valores.skills.SB, 14);
});

test('skill a 0, vazia ou nao numerica: erro nessa skill e nada calculado', () => {
  for (const mau of ['0', '', 'x', '-3', '1.5', '1e1']) {
    const r = validarJogador(poste({}, { OD: mau }), TODOS);
    assert.ok(r.erros.OD, `OD=${JSON.stringify(mau)}`);
    assert.equal(r.valores, null);
  }
});

test('skills acima de 20 sao validas ate 40; 41 para cima e erro', () => {
  assert.deepEqual(validarJogador(poste({}, { SB: '27' }), TODOS).erros, {});
  assert.deepEqual(validarJogador(poste({}, { SB: '40' }), TODOS).erros, {});
  const r = validarJogador(poste({}, { SB: '41' }), TODOS);
  assert.equal(r.erros.SB, 'Inteiro de 1 a 40.');
  assert.equal(r.valores, null);
  // ST e FT escritas tambem respeitam o limite
  assert.equal(validarJogador(poste({}, { ST: '41' }), TODOS).erros.ST, 'Inteiro de 1 a 40.');
});

test('ST e FT sao opcionais, mas se escritas tem de estar certas', () => {
  assert.deepEqual(validarJogador(poste(), TODOS).erros, {});
  assert.ok(validarJogador(poste({}, { ST: '0' }), TODOS).erros.ST);
  assert.deepEqual(validarJogador(poste({}, { FT: '12' }), TODOS).erros, {});
});

test('idade: abaixo de 18, nao inteira ou vazia e erro; 18 e 28+ passam', () => {
  for (const mau of ['17', '0', '', '20.5', 'abc', '-20']) {
    assert.ok(validarJogador(poste({ idade: mau }), TODOS).erros.idade, mau);
  }
  for (const bom of ['18', '28', '33']) {
    assert.equal(validarJogador(poste({ idade: bom }), TODOS).erros.idade, undefined, bom);
  }
});

test('altura, potencial e minutos fora dos limites sao erro', () => {
  assert.ok(validarJogador(poste({ cm: '159' }), TODOS).erros.cm);
  assert.ok(validarJogador(poste({ cm: '241' }), TODOS).erros.cm);
  assert.equal(validarJogador(poste({ cm: '160' }), TODOS).erros.cm, undefined);
  assert.equal(validarJogador(poste({ cm: '240' }), TODOS).erros.cm, undefined);
  assert.ok(validarJogador(poste({ potencial: '' }), TODOS).erros.potencial);
  assert.ok(validarJogador(poste({ potencial: '12' }), TODOS).erros.potencial);
  assert.equal(validarJogador(poste({ potencial: '0' }), TODOS).erros.potencial, undefined);
  assert.equal(validarJogador(poste({ potencial: '11' }), TODOS).erros.potencial, undefined);
  assert.ok(validarJogador(poste({ minutos: '49' }), TODOS).erros.minutos);
  assert.ok(validarJogador(poste({ minutos: '' }), TODOS).erros.minutos);
  assert.equal(validarJogador(poste({ minutos: '0' }), TODOS).erros.minutos, undefined);
});

test('so se validam os campos pedidos', () => {
  const j = poste({ idade: 'x', cm: '' });
  const r = validarJogador(j, ['posicao']);
  assert.deepEqual(r.erros, {});
  assert.ok(r.valores);
  assert.equal(r.valores.idade, undefined);
  assert.equal(r.valores.posicao, 'C');
});

test('pendencias: vazios em «faltam», texto invalido em «errados»', () => {
  const virgem = pendencias(jogadorVazio(), TODOS);
  assert.deepEqual(virgem.errados, []);
  assert.ok(virgem.faltam.includes('idade') && virgem.faltam.includes('altura') && virgem.faltam.includes('SB'));
  assert.ok(!virgem.faltam.includes('ST'));

  const meio = pendencias(poste({ idade: '17' }, { OD: '0', RB: '' }), TODOS);
  assert.deepEqual(meio.errados, ['idade', 'OD']);
  assert.deepEqual(meio.faltam, ['RB']);

  assert.deepEqual(pendencias(poste(), TODOS), { faltam: [], errados: [] });
});

test('exigir12: ST e FT passam a ser obrigatorias e voltam nos valores', () => {
  const por = { exigir12: true };
  const virgem = validarJogador(poste(), ['posicao'], por);
  assert.ok(virgem.erros.ST && virgem.erros.FT);
  assert.equal(virgem.valores, null);

  const meio = validarJogador(poste({}, { ST: '8' }), ['posicao'], por);
  assert.equal(meio.erros.ST, undefined);
  assert.ok(meio.erros.FT);

  for (const mau of ['0', 'x', '1.5']) {
    assert.ok(validarJogador(poste({}, { ST: mau, FT: '9' }), ['posicao'], por).erros.ST, mau);
  }

  const ok = validarJogador(poste({}, { ST: '8', FT: '12' }), ['posicao'], por);
  assert.deepEqual(ok.erros, {});
  assert.ok(ok.valores?.skills12);
  assert.equal(ok.valores.skills12.ST, 8);
  assert.equal(ok.valores.skills12.FT, 12);
  assert.equal(ok.valores.skills12.SB, 14);
  assert.equal(ok.valores.skills12.JS, 5);
});

test('sem exigir12 nada muda: ST e FT vazias passam e nao ha skills12', () => {
  const r = validarJogador(poste(), TODOS);
  assert.deepEqual(r.erros, {});
  assert.equal(r.valores?.skills12, undefined);
});

test('pendencias com exigir12: ST e FT vazias contam como «faltam»', () => {
  const p = pendencias(poste({}, { FT: 'x' }), ['posicao'], { exigir12: true });
  assert.deepEqual(p.faltam, ['ST']);
  assert.deepEqual(p.errados, ['FT']);
  assert.deepEqual(pendencias(poste(), ['posicao']), { faltam: [], errados: [] });
});
