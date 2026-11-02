import type { ReactNode } from 'react';
import type { Pendencias } from '../../domain/validacao.ts';
import { textoPendencias } from './calculos.ts';

/** Os avisos de uma estimativa, um `.aviso` cada, no cartão a que dizem respeito. */
export function Avisos({ lista }: { lista: readonly string[] }) {
  return (
    <>
      {lista.map((a) => (
        <p className="aviso" key={a} role="note">
          {a}
        </p>
      ))}
    </>
  );
}

/** Um `ok: false` do domínio: «Sem estimativa: motivo». */
export function SemEstimativa({ motivo }: { motivo: string }) {
  return (
    <p className="sem-estimativa" role="status">
      <strong>Sem estimativa:</strong> {motivo}
    </p>
  );
}

/** Uma nota discreta (o que falta preencher, de onde vem a data). */
export function Dica({ children }: { children: ReactNode }) {
  return <p className="dica">{children}</p>;
}

/** A nota dos cartões quando o jogador ainda não permite calcular. */
export function JogadorPendente({ pendencias }: { pendencias: Pendencias }) {
  return <Dica>{textoPendencias(pendencias)}</Dica>;
}
