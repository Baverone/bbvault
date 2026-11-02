/**
 * As escalas do BuzzerBeater: os nomes das skills, dos potenciais e dos
 * treinadores, a soma do TSP e a validação das skills de um formulário.
 *
 * Domínio puro: sem React e sem datas. Os valores são os da spec.
 */

/** As dez skills que entram no TSP. */
export const SKILLS_TSP = ['JS', 'JR', 'OD', 'HA', 'DR', 'PA', 'IS', 'ID', 'RB', 'SB'] as const;
export type SkillTsp = (typeof SKILLS_TSP)[number];

/** As dez do TSP mais ST e FT. */
export const SKILLS = [...SKILLS_TSP, 'ST', 'FT'] as const;
export type Skill = (typeof SKILLS)[number];

export type Skills = Record<Skill, number>;
export type SkillsTsp = Record<SkillTsp, number>;

export const POSICOES = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
export type Posicao = (typeof POSICOES)[number];

/** Os 20 níveis de skill, do 1 ao 20. */
const NOMES_SKILL = [
  'atrocious',
  'pitiful',
  'awful',
  'inept',
  'mediocre',
  'average',
  'respectable',
  'strong',
  'proficient',
  'prominent',
  'prolific',
  'sensational',
  'tremendous',
  'wondrous',
  'marvelous',
  'prodigious',
  'stupendous',
  'phenomenal',
  'colossal',
  'legendary',
] as const;

/**
 * O nome de um nível de skill. Acima de 20 é «legendary» (o jogo aceita
 * valores além da escala); abaixo de 1, ou não numérico, é «—».
 */
export function nomeSkill(nivel: number): string {
  if (!(nivel >= 1)) return '—';
  if (nivel > 20) return 'legendary';
  return NOMES_SKILL[Math.floor(nivel) - 1];
}

/** Os potenciais, por índice (0 = announcer … 11 = all-time great). */
export const POTENCIAIS: readonly string[] = [
  'announcer',
  'bench warmer',
  'role player',
  '6th man',
  'starter',
  'star',
  'allstar',
  'perennial allstar',
  'superstar',
  'MVP',
  'hall of famer',
  'all-time great',
];

/** Os treinadores: o índice 0 é o nível 1, o índice 6 é o nível 7. */
export const TREINADORES: readonly string[] = [
  'minimal',
  'basic',
  'competent',
  'advanced',
  'superior',
  'exceptional',
  'world-renowned',
];

/** A soma das dez skills do TSP (cada uma pela sua parte inteira). */
export function tsp(s: SkillsTsp): number {
  return SKILLS_TSP.reduce((soma, skill) => soma + Math.trunc(s[skill]), 0);
}

export type ResultadoSkills =
  | { ok: true; skills: Skills }
  | { ok: false; erradas: Skill[] };

/**
 * Um valor de formulário como número. Texto só conta se for só dígitos (com
 * espaços à volta), para que '0x10' ou '1e1' não passem; o resto é NaN.
 */
function paraNumero(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && /^\s*\d+\s*$/.test(v)) return Number(v);
  return NaN;
}

/** O nível máximo que se aceita numa skill (o jogo chama «legendary» a partir do 20). */
export const SKILL_MAXIMA = 40;

/**
 * Valida as skills pedidas em `quais`. Uma skill é válida quando é um inteiro
 * de 1 a `SKILL_MAXIMA` (40). Só se olha para `quais`: as outras chaves de `s` são ignoradas,
 * e o `skills` devolvido tem só as chaves de `quais` (cast para `Skills`).
 */
export function validarSkills(
  s: Record<string, unknown>,
  quais: readonly Skill[],
): ResultadoSkills {
  const erradas: Skill[] = [];
  const skills = {} as Skills;
  for (const skill of quais) {
    const n = paraNumero(s[skill]);
    if (Number.isInteger(n) && n >= 1 && n <= SKILL_MAXIMA) {
      skills[skill] = n;
    } else {
      erradas.push(skill);
    }
  }
  return erradas.length > 0 ? { ok: false, erradas } : { ok: true, skills };
}
