/**
 * A avaliação de um jogador (spec 3.3 / 4.3): força por posição, perfil por
 * altura e projeção do potencial. Domínio puro, números do `curvas.json`.
 */
import curvas from '../data/curvas.json' with { type: 'json' };
import { POSICOES, SKILLS, SKILLS_TSP } from './escalas.ts';
import type { Posicao, SkillTsp, Skills, SkillsTsp } from './escalas.ts';
import { diasAteMudancaDeIdade, PERIODO_EPOCA_DIAS, type Data } from './calendario.ts';
import { modeloSalario } from './salario.ts';

/** Abaixo disto, duas notas não arredondadas contam como iguais (ruído de vírgula flutuante). */
const EPSILON = 1e-9;

/**
 * A nota de cada posição (0 a 100): a média das skills pesada pelo que o jogo
 * paga nessa posição, na escala de 1 a 20. Com os coeficientes `b` do modelo de
 * salário (secção 4.2), `nota = round(100 × clamp(Σ b·(skill − 1) / Σ b·19, 0, 1))`.
 * Não depende de `a` nem da exponencial; skills acima de 20 dão no máximo 100.
 * `melhor` é a posição com a maior nota *sem arredondar*; só um empate exato
 * (dentro do ruído) resolve pela ordem de `POSICOES`.
 */
export function forcaPorPosicao(s: Skills): { notas: Record<Posicao, number>; melhor: Posicao } {
  const notas = {} as Record<Posicao, number>;
  let melhor: Posicao = POSICOES[0];
  let melhorBruta = -Infinity;
  for (const pos of POSICOES) {
    const { b } = modeloSalario(pos);
    let soma = 0;
    let maximo = 0;
    for (const k of SKILLS) {
      soma += b[k] * (s[k] - 1);
      maximo += b[k] * 19;
    }
    const bruta = 100 * Math.min(1, Math.max(0, soma / maximo));
    notas[pos] = Math.round(bruta);
    if (bruta > melhorBruta + EPSILON) {
      melhor = pos;
      melhorBruta = bruta;
    }
  }
  return { notas, melhor };
}

export type BandaAltura = '<=187' | '188-195' | '196-202' | '203-212' | '>=213';

/** A banda de altura (em cm) do perfil. */
export function bandaAltura(cm: number): BandaAltura {
  if (cm < 188) return '<=187';
  if (cm < 196) return '188-195';
  if (cm < 203) return '196-202';
  if (cm < 213) return '203-212';
  return '>=213';
}

export type Posicionamento = 'abaixo' | 'dentro' | 'acima';

/** Cada skill contra o intervalo p25..p75 do perfil da banda de altura. */
export function compararPerfil(
  cm: number,
  s: SkillsTsp,
): { banda: string; amostraPequena: boolean; skills: Record<SkillTsp, Posicionamento> } {
  const banda = bandaAltura(cm);
  const perfil = curvas.perfisAltura[banda];
  const skills = {} as Record<SkillTsp, Posicionamento>;
  for (const k of SKILLS_TSP) {
    const { p25, p75 } = perfil.skills[k];
    skills[k] = s[k] < p25 ? 'abaixo' : s[k] > p75 ? 'acima' : 'dentro';
  }
  return { banda, amostraPequena: perfil.amostraPequena, skills };
}

const IDADES_ALVO = [24, 26, 28] as const;
const EPOCA_MIN = 18;
const EPOCA_MAX = 28;
const POTENCIAL_MIN = 5;
const POTENCIAL_MAX = 11;

const AVISO_SEM_TECTO =
  'sem tecto para este potencial (abaixo de 5): a projeção não tem limite';
const AVISO_P90_NULO = 'sem P90 para a época dos 28 anos: usada a mediana';

function epoca(idade: number) {
  const a = Math.min(EPOCA_MAX, Math.max(EPOCA_MIN, Math.trunc(idade)));
  return curvas.tspPorEpoca[String(a) as keyof typeof curvas.tspPorEpoca];
}

/**
 * A parte da época atual que ainda falta: os dias de `hoje` até à próxima
 * sexta de mudança de idade a dividir por 98. Na própria sexta da mudança é 1.
 */
export function fracaoEpocaRestante(hoje: Data): number {
  return diasAteMudancaDeIdade(hoje) / PERIODO_EPOCA_DIAS;
}

/**
 * O TSP esperado aos 24, 26 e 28 anos: o TSP atual mais o ganho por época
 * (uma época = um ano) de `idade` até `alvo − 1`, em mediana e em P90 (somados
 * em separado), limitado ao tecto do potencial. A época da idade atual já vai a
 * meio, por isso só conta a fração que falta até à próxima mudança de idade
 * (`fracaoEpocaRestante(hoje)`); as seguintes contam inteiras. As somas
 * arredondam-se às unidades no fim, depois de limitar. Idades-alvo ≤ idade não entram.
 */
export function projecaoPotencial(
  idade: number,
  tspAtual: number,
  potencial: number,
  hoje: Data,
): {
  tecto: number | null;
  aos: { idade: 24 | 26 | 28; mediana: number; p90: number }[];
  avisos: string[];
} {
  const avisos: string[] = [];
  const nivel = Math.min(POTENCIAL_MAX, Math.trunc(potencial));
  const tecto =
    nivel >= POTENCIAL_MIN
      ? curvas.tectoPorPotencial[String(nivel) as keyof typeof curvas.tectoPorPotencial]
      : null;
  if (tecto === null) avisos.push(AVISO_SEM_TECTO);

  const fracaoAtual = fracaoEpocaRestante(hoje);
  const finalizar = (v: number) => Math.round(tecto === null ? v : Math.min(v, tecto));
  const aos: { idade: 24 | 26 | 28; mediana: number; p90: number }[] = [];
  let avisouP90 = false;
  for (const alvo of IDADES_ALVO) {
    if (alvo <= idade) continue;
    let mediana = tspAtual;
    let p90 = tspAtual;
    for (let a = idade; a < alvo; a++) {
      const peso = a === idade ? fracaoAtual : 1;
      const e = epoca(a);
      mediana += e.mediana * peso;
      if (e.p90 === null) {
        p90 += e.mediana * peso;
        if (!avisouP90) {
          avisos.push(AVISO_P90_NULO);
          avisouP90 = true;
        }
      } else {
        p90 += e.p90 * peso;
      }
    }
    aos.push({ idade: alvo, mediana: finalizar(mediana), p90: finalizar(p90) });
  }
  return { tecto, aos, avisos };
}
