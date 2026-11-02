import { useId, useState } from 'react';
import {
  POSICOES,
  POTENCIAIS,
  SKILLS,
  SKILLS_TSP,
  nomeSkill,
  SKILL_MAXIMA,
  validarSkills,
  type Posicao,
  type Skill,
} from '../domain/escalas.ts';
import { validarJogador, type CampoJogador } from '../domain/validacao.ts';
import type { JogadorGuardado } from '../storage/jogador.ts';

interface JogadorFormProps {
  valor: JogadorGuardado;
  onChange: (valor: JogadorGuardado) => void;
  /** Que entradas aparecem além das skills (que aparecem sempre). */
  campos: readonly CampoJogador[];
  /** Salário e Avaliação: ST e FT são obrigatórias (no Treino podem ficar vazias). */
  exigir12?: boolean;
  /** O rótulo e a ajuda do campo da posição, quando a página usa a posição para outra coisa. */
  posicao?: { rotulo: string; ajuda: string };
}

/** O nome do nível de uma skill escrita, ou nada se o texto não for válido. */
function nomeDoTexto(skill: Skill, texto: string): string {
  const r = validarSkills({ [skill]: texto }, [skill]);
  return r.ok ? nomeSkill(r.skills[skill]) : '';
}

/**
 * O formulário do jogador: idade, altura, potencial, (posição e minutos) e as
 * 12 skills, cada uma com o nome do nível ao lado. Os campos com erro ficam a
 * vermelho. Um campo com texto inválido fica a vermelho logo; um campo vazio só
 * depois de lhe mexerem (para a página não abrir toda a vermelho). Enquanto
 * houver erros, nada se calcula.
 */
export function JogadorForm({ valor, onChange, campos, exigir12 = false, posicao }: JogadorFormProps) {
  const base = useId();
  // Os campos em que já se mexeu (ao escrever ou ao sair do campo).
  const [tocados, setTocados] = useState<ReadonlySet<string>>(new Set());
  const tocar = (chave: string) => setTocados((t) => (t.has(chave) ? t : new Set(t).add(chave)));
  const { erros } = validarJogador(valor, campos, { exigir12 });
  const tem = (c: CampoJogador) => campos.includes(c);

  const erroVisivel = (chave: CampoJogador | Skill, texto: string) =>
    erros[chave] !== undefined && (tocados.has(chave) || texto.trim() !== '') ? erros[chave] : undefined;

  const mudar = (chave: string, parte: Partial<JogadorGuardado>) => {
    tocar(chave);
    onChange({ ...valor, ...parte });
  };

  const campoTexto = (chave: 'idade' | 'cm' | 'minutos', rotulo: string, ajuda: string) => {
    const erro = erroVisivel(chave, valor[chave]);
    const id = `${base}-${chave}`;
    return (
      <div className="campo">
        <label htmlFor={id}>{rotulo}</label>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className={erro ? 'erro' : undefined}
          value={valor[chave]}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
          onChange={(e) => mudar(chave, { [chave]: e.target.value })}
          onBlur={() => tocar(chave)}
        />
        {erro ? (
          <span className="erro-msg" id={`${id}-erro`}>
            {erro}
          </span>
        ) : (
          <span className="ajuda">{ajuda}</span>
        )}
      </div>
    );
  };

  const erroPotencial = erroVisivel('potencial', valor.potencial);
  const idPotencial = `${base}-potencial`;
  const skillsErradas = SKILLS.filter((s) => erroVisivel(s, valor.skills[s]) !== undefined);

  return (
    <div className="jogador-form">
      <div className="linha">
        {tem('idade') && campoTexto('idade', 'Idade', 'a partir dos 18')}
        {tem('cm') && campoTexto('cm', 'Altura (cm)', '160 a 240')}
        {tem('potencial') && (
          <div className="campo">
            <label htmlFor={idPotencial}>Potencial</label>
            <select
              id={idPotencial}
              className={erroPotencial ? 'erro' : undefined}
              value={valor.potencial}
              aria-invalid={erroPotencial ? true : undefined}
              onChange={(e) => mudar('potencial', { potencial: e.target.value })}
              onBlur={() => tocar('potencial')}
            >
              <option value="">—</option>
              {POTENCIAIS.map((nome, i) => (
                <option key={nome} value={String(i)}>
                  {nome} ({i})
                </option>
              ))}
            </select>
            {erroPotencial ? <span className="erro-msg">{erroPotencial}</span> : <span className="ajuda">0 a 11</span>}
          </div>
        )}
        {tem('posicao') && (
          <div className="campo">
            <label htmlFor={`${base}-posicao`}>{posicao?.rotulo ?? 'Posição em que joga'}</label>
            <select
              id={`${base}-posicao`}
              value={valor.posicao}
              onChange={(e) => mudar('posicao', { posicao: e.target.value as Posicao })}
            >
              {POSICOES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="ajuda">{posicao?.ajuda ?? 'onde joga os minutos'}</span>
          </div>
        )}
        {tem('minutos') && campoTexto('minutos', 'Minutos por semana', '0 a 48, nessa posição')}
      </div>

      <fieldset className="skills">
        <legend>Skills</legend>
        <div className="skills-grelha">
          {SKILLS.map((s) => {
            const id = `${base}-skill-${s}`;
            const erro = erroVisivel(s, valor.skills[s]);
            return (
              <div className="skill-campo" key={s}>
                <label htmlFor={id}>{s}</label>
                <input
                  id={id}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className={erro ? 'erro' : undefined}
                  value={valor.skills[s]}
                  aria-invalid={erro ? true : undefined}
                  onChange={(e) => mudar(s, { skills: { ...valor.skills, [s]: e.target.value } })}
                  onBlur={() => tocar(s)}
                />
                <span className="skill-nome">{nomeDoTexto(s, valor.skills[s])}</span>
              </div>
            );
          })}
        </div>
        {skillsErradas.length > 0 ? (
          <p className="erro-msg" role="alert">
            A corrigir ({skillsErradas.join(', ')}): cada skill é um inteiro de 1 a {SKILL_MAXIMA}.
          </p>
        ) : (
          <p className="ajuda">
            {exigir12
              ? `Preenche as ${SKILLS.length} skills; as ${SKILLS_TSP.length} primeiras somam o TSP.`
              : `As ${SKILLS_TSP.length} primeiras somam o TSP; ST e FT só se mostram (podem ficar vazias).`}{' '}
            De 21 a 40 o jogo chama «legendary».
          </p>
        )}
      </fieldset>
    </div>
  );
}
