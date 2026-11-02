import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { homedir, userInfo } from 'node:os';
import curvas from './curvas.json' with { type: 'json' };
import salario from './salario.json' with { type: 'json' };
import treino from './treino.json' with { type: 'json' };
import { POSICOES, SKILLS, SKILLS_TSP } from '../domain/escalas.ts';

type Grupo = { posicoes: string[]; secundarias: string[] };
type Treino = { id: string; nome: string; primaria: string; grupos: Grupo[] };

const treinos: Treino[] = treino.treinos;

function treinoPorId(id: string): Treino {
  const t = treinos.find((x) => x.id === id);
  assert.ok(t, `treino ${id} em falta`);
  return t;
}

test('treino: fator de idade (curva da selecao a dividir por 12)', () => {
  assert.deepEqual(
    Object.keys(treino.fatorIdade),
    ['18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28'],
  );
  assert.equal(treino.fatorIdade[21], 0.833);
  assert.equal(treino.fatorIdade[28], 0.167);
  assert.equal(treino.fatorIdade[20], 1);
});

test('treino: fator de treinador, de 3 a 7, normalizado ao nivel 6', () => {
  assert.deepEqual(Object.keys(treino.fatorTreinador), ['3', '4', '5', '6', '7']);
  assert.equal(treino.fatorTreinador[3], 0.869);
  assert.equal(treino.fatorTreinador[6], 1);
  assert.equal(treino.fatorTreinador[7], 1.01);
});

test('treino: constantes do modelo', () => {
  assert.equal(treino.base, 0.67);
  assert.deepEqual(treino.fatorPosicoes, { '1': 1, '2': 0.62 });
  assert.deepEqual(treino.limiarMinutos, [
    { ate: 19, minutos: 45 },
    { ate: 26, minutos: 48 },
    { ate: 999, minutos: 40 },
  ]);
  assert.equal(treino.folgaMinutos, 1);
  assert.equal(treino.secundaria, 0.15);
  assert.deepEqual(treino.cenarios, {
    rapido: { mult: 1.15, inicio: 0.99 },
    esperado: { mult: 1, inicio: 0.5 },
    lento: { mult: 0.85, inicio: 0 },
  });
});

test('treino: 10 treinos com os ids e as primarias da tabela', () => {
  assert.deepEqual(
    treinos.map((t) => [t.id, t.primaria]),
    [
      ['pressure', 'OD'],
      ['ball-handling', 'HA'],
      ['passing', 'PA'],
      ['one-on-one', 'DR'],
      ['jump-shot', 'JS'],
      ['outside-shooting', 'JR'],
      ['inside-shot', 'IS'],
      ['inside-defense', 'ID'],
      ['rebounding', 'RB'],
      ['shot-blocking', 'SB'],
    ],
  );
});

test('treino: shot-blocking tem tres grupos de postes com secundarias ID e RB', () => {
  const t = treinoPorId('shot-blocking');
  assert.deepEqual(
    t.grupos.map((g) => g.posicoes),
    [['C'], ['C', 'PF'], ['C', 'PF', 'SF']],
  );
  for (const g of t.grupos) assert.deepEqual(g.secundarias, ['ID', 'RB']);
});

test('treino: one-on-one em SF/PF tem HA, JS e IS; em PG/SG so HA e JS', () => {
  const t = treinoPorId('one-on-one');
  const sfPf = t.grupos.find((g) => g.posicoes.join() === 'SF,PF');
  assert.deepEqual(sfPf?.secundarias, ['HA', 'JS', 'IS']);
  const pgSg = t.grupos.find((g) => g.posicoes.join() === 'PG,SG');
  assert.deepEqual(pgSg?.secundarias, ['HA', 'JS']);
});

test('treino: jump-shot leva as secundarias de cada grupo', () => {
  const t = treinoPorId('jump-shot');
  const sec = (p: string) => t.grupos.find((g) => g.posicoes.join() === p)?.secundarias;
  assert.deepEqual(sec('PG,SG'), ['JR', 'HA', 'DR']);
  assert.deepEqual(sec('SG,SF'), ['JR', 'HA', 'DR', 'IS']);
  assert.deepEqual(sec('SF,PF'), ['JR', 'IS']);
});

test('treino: toda a skill e posicao usada existe nas escalas e a primaria nao e secundaria', () => {
  for (const t of treinos) {
    assert.ok((SKILLS_TSP as readonly string[]).includes(t.primaria), t.id);
    assert.ok(t.nome.length > 0, t.id);
    assert.ok(t.grupos.length > 0, t.id);
    for (const g of t.grupos) {
      for (const p of g.posicoes) assert.ok((POSICOES as readonly string[]).includes(p), `${t.id} ${p}`);
      for (const s of g.secundarias) {
        assert.ok((SKILLS_TSP as readonly string[]).includes(s), `${t.id} ${s}`);
        assert.notEqual(s, t.primaria, t.id);
      }
    }
  }
});

test('curvas: TSP por epoca (mediana e P90) da secao 4.3', () => {
  assert.deepEqual(curvas.tspPorEpoca[20], { mediana: 12, p90: 15 });
  assert.deepEqual(curvas.tspPorEpoca[18], { mediana: 17, p90: 20 });
  assert.deepEqual(curvas.tspPorEpoca[27], { mediana: 4, p90: 7 });
  assert.deepEqual(curvas.tspPorEpoca[28], { mediana: 2, p90: null });
  assert.equal(Object.keys(curvas.tspPorEpoca).length, 11);
});

test('curvas: tecto por potencial', () => {
  assert.deepEqual(curvas.tectoPorPotencial, {
    '5': 97,
    '6': 103,
    '7': 107,
    '8': 111,
    '9': 144,
    '10': 163,
    '11': 163,
  });
  assert.equal(curvas.tectoPorPotencial[9], 144);
  assert.equal(curvas.tectoPorPotencial[11], 163);
});

test('curvas: perfis por altura, cinco bandas, siglas do jogo e so percentis', () => {
  assert.deepEqual(Object.keys(curvas.perfisAltura), ['<=187', '188-195', '196-202', '203-212', '>=213']);
  for (const [banda, perfil] of Object.entries(curvas.perfisAltura)) {
    assert.ok(perfil.n > 0, banda);
    assert.equal(typeof perfil.amostraPequena, 'boolean', banda);
    assert.deepEqual(Object.keys(perfil.skills).sort(), [...SKILLS_TSP].sort(), banda);
    for (const v of Object.values(perfil.skills)) {
      assert.deepEqual(Object.keys(v), ['p25', 'med', 'p75']);
      assert.ok(v.p25 <= v.med && v.med <= v.p75);
    }
  }
  assert.equal(curvas.perfisAltura['<=187'].amostraPequena, true);
  assert.equal(curvas.perfisAltura['188-195'].amostraPequena, false);
});

test('salario: PG, SF, PF e C, cada uma com 12 coeficientes e erro mediano < 0.1', () => {
  assert.deepEqual(Object.keys(salario.posicoes).sort(), ['C', 'PF', 'PG', 'SF']);
  for (const [pos, m] of Object.entries(salario.posicoes)) {
    assert.deepEqual(Object.keys(m.b).sort(), [...SKILLS].sort(), pos);
    assert.ok(Object.values(m.b).every(Number.isFinite), pos);
    assert.ok(Number.isFinite(m.a), pos);
    assert.ok(m.erroMediano > 0 && m.erroMediano < 0.1, `${pos} ${m.erroMediano}`);
    assert.ok(m.amostra >= 40, pos);
  }
  assert.match(salario.geradoEm, /^\d{4}-\d{2}-\d{2}$/);
});

/**
 * As strings que nao podem aparecer em dados nem scripts publicos, tiradas da
 * maquina onde o teste corre: o nome de utilizador e a pasta pessoal. Assim o
 * ficheiro nao tem nenhum nome, nem aos bocados. Nomes com menos de 3 letras
 * ficam de fora (davam falsos positivos em qualquer texto).
 */
function proibidasNestaMaquina(): string[] {
  const candidatas = [userInfo().username, homedir()];
  const nomes = candidatas.map((c) => c.trim().toLowerCase()).filter((c) => c.length >= 3);
  return [...nomes, 'c:' + String.fromCharCode(92) + 'users', '.' + 'local'];
}

test('privacidade: nada em src/data nem em scripts tem caminhos do PC nem o nome de utilizador', () => {
  const proibidas = proibidasNestaMaquina();
  assert.ok(proibidas.length >= 3, 'a lista de strings proibidas ficou vazia');
  const alvos: { pasta: URL; extensao: string }[] = [
    { pasta: new URL('.', import.meta.url), extensao: '.json' },
    { pasta: new URL('../../scripts/', import.meta.url), extensao: '.py' },
  ];
  for (const { pasta, extensao } of alvos) {
    const ficheiros = readdirSync(pasta).filter((f) => f.endsWith(extensao));
    assert.ok(ficheiros.length >= 3, `poucos ${extensao} em ${pasta.pathname}`);
    for (const f of ficheiros) {
      const texto = readFileSync(new URL(f, pasta), 'utf8').toLowerCase();
      for (const p of proibidas) assert.ok(!texto.includes(p), `${f} contem uma string proibida (${p.length} car.)`);
    }
  }
});
