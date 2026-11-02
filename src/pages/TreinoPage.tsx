import { useEffect, useMemo, useState } from 'react';
import { JogadorForm } from '../components/JogadorForm.tsx';
import { proximaSexta } from '../domain/calendario.ts';
import { TREINADORES, type Posicao, type SkillTsp } from '../domain/escalas.ts';
import { pendencias as calcularPendencias, validarJogador, type CampoJogador, type ValoresJogador } from '../domain/validacao.ts';
import { TREINOS, type JogadorTreino } from '../domain/treino/modelo.ts';
import { planear } from '../domain/treino/plano.ts';
import { formatarData, hojeUtc } from '../formato.ts';
import { guardarJogador, jogadorVazio, lerJogador, type JogadorGuardado } from '../storage/jogador.ts';
import {
  blocosDoPlano,
  planoCompleto,
  validarLinhas,
  type BlocoBase,
  type LinhaObjetivo,
} from '../components/treino/calculos.ts';
import { CartaoPlano } from '../components/treino/CartaoPlano.tsx';
import { CartaoProjecao } from '../components/treino/CartaoProjecao.tsx';
import { CartaoTempo } from '../components/treino/CartaoTempo.tsx';
import { Dica, JogadorPendente } from '../components/treino/comum.tsx';
import type { ContextoTreino } from '../components/treino/contexto.ts';
import { NotaTreino } from '../components/treino/NotaTreino.tsx';

const CAMPOS: readonly CampoJogador[] = ['idade', 'cm', 'potencial', 'posicao', 'minutos'];
const TREINADOR_INICIAL = 6;

/** Os valores validados como `JogadorTreino`, ou `null` se faltar algum. */
function comoJogadorTreino(v: ValoresJogador | null): JogadorTreino | null {
  if (!v) return null;
  const { idade, cm, potencial, posicao, minutos, skills } = v;
  if (idade === undefined || cm === undefined || potencial === undefined) return null;
  if (posicao === undefined || minutos === undefined) return null;
  return { idade, cm, potencial, posicao, minutos, skills };
}

const chaveGrupo = (g: readonly Posicao[]) => g.join('/');

export function TreinoPage() {
  const [jogador, setJogador] = useState<JogadorGuardado>(() => lerJogador() ?? jogadorVazio());
  const [treinador, setTreinador] = useState(String(TREINADOR_INICIAL));
  const [treinoId, setTreinoId] = useState(TREINOS[0].id);
  const [grupoEscolhido, setGrupoEscolhido] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaObjetivo[]>([{ skill: 'SB', alvo: '' }]);

  // Guarda o jogador para as outras páginas; se o browser não deixar, segue sem guardar.
  useEffect(() => {
    guardarJogador(jogador);
  }, [jogador]);

  // A próxima sexta, a contar de hoje (UTC): as projeções partem sempre de uma sexta.
  const [inicio] = useState(() => proximaSexta(hojeUtc()));

  const validacao = useMemo(() => validarJogador(jogador, CAMPOS), [jogador]);
  const jogadorTreino = useMemo(() => comoJogadorTreino(validacao.valores), [validacao]);
  const pendencias = useMemo(() => calcularPendencias(jogador, CAMPOS), [jogador]);
  const haErrosJogador = pendencias.faltam.length + pendencias.errados.length > 0;
  const nivelTreinador = Number(treinador);

  const treino = TREINOS.find((t) => t.id === treinoId) ?? TREINOS[0];
  // O grupo por defeito é o mais estreito que inclui a posição; se nenhum a inclui, o primeiro.
  const grupoPadrao = treino.grupos.find((g) => g.posicoes.includes(jogador.posicao)) ?? treino.grupos[0];
  const grupo = treino.grupos.find((g) => chaveGrupo(g.posicoes) === grupoEscolhido) ?? grupoPadrao;
  const foraDoGrupo = !grupo.posicoes.includes(jogador.posicao);
  const escolhido: BlocoBase = { treino: treino.id, grupo: [...grupo.posicoes] };
  const opcoesSkill: SkillTsp[] = [treino.primaria, ...grupo.secundarias].filter((s, i, todas) => todas.indexOf(s) === i);

  const ctx: ContextoTreino = { jogador: jogadorTreino, pendencias, treinador: nivelTreinador, inicio, escolhido };

  const linhasValidadas = useMemo(() => validarLinhas(linhas), [linhas]);
  const plano = useMemo(
    () =>
      jogadorTreino && linhasValidadas.objetivos
        ? planear(jogadorTreino, linhasValidadas.objetivos, nivelTreinador, inicio)
        : null,
    [jogadorTreino, linhasValidadas, nivelTreinador, inicio],
  );
  const blocosPlano = blocosDoPlano(plano);
  const completo = plano !== null && planoCompleto(plano);
  const planoNaoServe = linhasValidadas.objetivos !== null && plano !== null && !completo;

  return (
    <>
      <section className="cartao" aria-labelledby="treino-jogador">
        <h2 id="treino-jogador">O jogador e o treino</h2>
        <JogadorForm valor={jogador} onChange={setJogador} campos={CAMPOS} />

        <div className="linha">
          <div className="campo">
            <label htmlFor="treino-treinador">Treinador</label>
            <select id="treino-treinador" value={treinador} onChange={(e) => setTreinador(e.target.value)}>
              {TREINADORES.map((nome, i) => (
                <option key={nome} value={String(i + 1)}>
                  {i + 1} · {nome}
                  {i + 1 < 3 ? ' (sem dados)' : ''}
                </option>
              ))}
            </select>
            <span className="ajuda">níveis 1 e 2: sem dados, a página não responde</span>
          </div>
          <div className="campo">
            <label htmlFor="treino-treino">Treino</label>
            <select
              id="treino-treino"
              value={treino.id}
              onChange={(e) => {
                setTreinoId(e.target.value);
                setGrupoEscolhido(null);
              }}
            >
              {TREINOS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.primaria})
                </option>
              ))}
            </select>
            <span className="ajuda">em parênteses, a skill primária</span>
          </div>
          <div className="campo">
            <label htmlFor="treino-grupo">Grupo de posições</label>
            <select
              id="treino-grupo"
              value={chaveGrupo(grupo.posicoes)}
              onChange={(e) => setGrupoEscolhido(e.target.value)}
            >
              {treino.grupos.map((g) => (
                <option key={chaveGrupo(g.posicoes)} value={chaveGrupo(g.posicoes)}>
                  {chaveGrupo(g.posicoes)}
                </option>
              ))}
            </select>
            <span className="ajuda">os grupos que este treino tem</span>
          </div>
        </div>

        {foraDoGrupo && (
          <p className="aviso" role="note">
            A posição do jogador ({jogador.posicao}) não está no grupo {chaveGrupo(grupo.posicoes)}: nesse caso o
            jogador não treina.
          </p>
        )}
        <Dica>Datas a contar da sexta {formatarData(inicio)} (a próxima sexta, com a data de hoje em UTC).</Dica>
        {haErrosJogador && <JogadorPendente pendencias={pendencias} />}
      </section>

      <CartaoTempo ctx={ctx} opcoes={opcoesSkill} />
      <CartaoPlano
        ctx={ctx}
        linhas={linhas}
        onLinhas={setLinhas}
        validacao={linhasValidadas}
        plano={plano}
        completo={completo}
      />
      <CartaoProjecao ctx={ctx} plano={blocosPlano} planoNaoServe={planoNaoServe} />
      <NotaTreino />
    </>
  );
}
