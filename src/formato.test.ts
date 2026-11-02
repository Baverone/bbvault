import test from 'node:test';
import assert from 'node:assert/strict';
import { formatarData, hojeUtc } from './formato.ts';

test('hojeUtc usa a data UTC, nao a local', () => {
  assert.equal(hojeUtc(new Date(Date.UTC(2026, 10, 2, 23, 59))), '2026-11-02');
  assert.equal(hojeUtc(new Date(Date.UTC(2026, 0, 5, 0, 0))), '2026-01-05');
});

test('formatarData: DD/MM e DD/MM/AAAA', () => {
  assert.equal(formatarData('2026-11-06'), '06/11');
  assert.equal(formatarData('2026-11-06', true), '06/11/2026');
});
