import test from 'node:test';
import assert from 'node:assert/strict';
import { formatarDinheiro, formatarPercentagem, lerDinheiro } from './dinheiro.ts';

test('lerDinheiro aceita 293833, 293 833 e 293.833', () => {
  for (const bom of ['293833', '293 833', '293.833', ' 293 833 ', '293 833', '293 833']) {
    assert.equal(lerDinheiro(bom), 293833, JSON.stringify(bom));
  }
});

test('lerDinheiro: varios grupos de milhares e valores pequenos', () => {
  assert.equal(lerDinheiro('1.234.567'), 1234567);
  assert.equal(lerDinheiro('1 234 567'), 1234567);
  assert.equal(lerDinheiro('157 130'), 157130);
  assert.equal(lerDinheiro('0'), 0);
  assert.equal(lerDinheiro('950'), 950);
  assert.equal(lerDinheiro('1.000'), 1000);
});

test('lerDinheiro recusa o que nao e um inteiro bem escrito', () => {
  for (const mau of ['', '   ', 'abc', '-5', '+5', '1,5', '293.83', '2938.33', '29 3833', '1..000', '1 .000', '12.34.567', '$293', '1e3', '0x10', '293.833,5', '99999999999999999999']) {
    assert.equal(lerDinheiro(mau), null, JSON.stringify(mau));
  }
});

test('formatarDinheiro: separador de milhares pt-PT, tambem com 4 digitos', () => {
  assert.equal(formatarDinheiro(293833), '293 833');
  assert.equal(formatarDinheiro(1234), '1 234');
  assert.equal(formatarDinheiro(950), '950');
  assert.equal(formatarDinheiro(3526000), '3 526 000');
  assert.equal(formatarDinheiro(0), '0');
});

test('o que se formata volta a ler-se', () => {
  for (const n of [0, 7, 999, 1000, 1234, 293833, 12345678]) assert.equal(lerDinheiro(formatarDinheiro(n)), n);
});

test('formatarPercentagem: uma casa, virgula decimal', () => {
  assert.equal(formatarPercentagem(0.0572), '5,7%');
  assert.equal(formatarPercentagem(0.05), '5%');
  assert.equal(formatarPercentagem(0.0498), '5%');
});
