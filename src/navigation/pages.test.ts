import test from 'node:test';
import assert from 'node:assert/strict';
import { PAGES, pageById } from './pages.ts';

test('quatro paginas, ids unicos, por esta ordem', () => {
  assert.deepEqual(
    PAGES.map((p) => p.id),
    ['inicio', 'treino', 'salario', 'avaliacao'],
  );
});

test('pageById de id desconhecido e undefined', () => {
  assert.equal(pageById('xpto'), undefined);
});
