import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SKILLS } from '../domain/escalas.ts';
import { CHAVE_JOGADOR, guardarJogador, jogadorVazio, lerJogador, type JogadorGuardado } from './jogador.ts';

const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

/** Instala (ou tira) um `localStorage` falso no `globalThis`. */
function instalar(falso: unknown): void {
  Object.defineProperty(globalThis, 'localStorage', { value: falso, configurable: true, writable: true });
}

afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else delete (globalThis as { localStorage?: unknown }).localStorage;
});

/** Um armazenamento em memória que se comporta como o do browser. */
function memoria(): { getItem(k: string): string | null; setItem(k: string, v: string): void; dados: Map<string, string> } {
  const dados = new Map<string, string>();
  return {
    dados,
    getItem: (k) => dados.get(k) ?? null,
    setItem: (k, v) => void dados.set(k, v),
  };
}

function exemplo(): JogadorGuardado {
  const j = jogadorVazio();
  return {
    ...j,
    idade: '20',
    cm: '213',
    potencial: '9',
    posicao: 'C',
    minutos: '48',
    skills: { ...j.skills, SB: '14', ID: ' 8 ', JS: '0' },
  };
}

test('localstorage_bloqueado: lerJogador da null e guardarJogador nao atira', () => {
  // Como numa janela privada: ate aceder ao armazenamento atira.
  instalar({
    getItem: () => {
      throw new Error('bloqueado');
    },
    setItem: () => {
      throw new Error('bloqueado');
    },
  });
  assert.equal(lerJogador(), null);
  assert.doesNotThrow(() => guardarJogador(exemplo()));
});

test('localstorage_bloqueado: o proprio acesso ao localStorage atira', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    get() {
      throw new Error('SecurityError');
    },
    configurable: true,
  });
  assert.equal(lerJogador(), null);
  assert.doesNotThrow(() => guardarJogador(exemplo()));
});

test('sem localStorage (undefined): null e nao atira', () => {
  instalar(undefined);
  assert.equal(lerJogador(), null);
  assert.doesNotThrow(() => guardarJogador(exemplo()));
});

test('o que se guarda volta igual, strings tal como foram escritas', () => {
  const m = memoria();
  instalar(m);
  assert.equal(lerJogador(), null);
  const j = exemplo();
  guardarJogador(j);
  assert.ok(m.dados.has(CHAVE_JOGADOR));
  assert.equal(CHAVE_JOGADOR, 'bbvault:jogador');
  assert.deepEqual(lerJogador(), j);
});

test('lixo no armazenamento da null (JSON partido, tipos errados, posicao desconhecida)', () => {
  const m = memoria();
  instalar(m);
  for (const lixo of ['{', 'null', '42', '"x"', '[]', '{"idade":20}', JSON.stringify({ ...exemplo(), posicao: 'XX' })]) {
    m.dados.set(CHAVE_JOGADOR, lixo);
    assert.equal(lerJogador(), null, lixo);
  }
});

test('skills em falta no guardado ficam vazias; todas as 12 chaves existem', () => {
  const m = memoria();
  instalar(m);
  const { skills: _, ...resto } = exemplo();
  m.dados.set(CHAVE_JOGADOR, JSON.stringify({ ...resto, skills: { SB: '14' } }));
  const lido = lerJogador();
  assert.ok(lido);
  assert.deepEqual(Object.keys(lido.skills).sort(), [...SKILLS].sort());
  assert.equal(lido.skills.SB, '14');
  assert.equal(lido.skills.JS, '');
});
