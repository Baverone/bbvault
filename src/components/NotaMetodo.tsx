export type Certeza = 'confirmado' | 'provável' | 'estimativa';

export interface ItemMetodo {
  texto: string;
  certeza: Certeza;
}

interface NotaMetodoProps {
  itens: readonly ItemMetodo[];
  /** O que o modelo NÃO tem em conta, e porquê. */
  naoEntra?: readonly string[];
  /** Uma frase por baixo do título de "o que não entra" (porquê). */
  naoEntraNota?: string;
  titulo?: string;
  /** Aberta ao carregar a página (por defeito fechada). */
  aberta?: boolean;
}

const ETIQUETA: Record<Certeza, string> = {
  confirmado: 'confirmado pelo manual',
  provável: 'provável',
  estimativa: 'estimativa',
};

const CLASSE: Record<Certeza, string> = {
  confirmado: 'certeza-confirmado',
  provável: 'certeza-provavel',
  estimativa: 'certeza-estimativa',
};

/**
 * A nota de método de uma calculadora: cada fator com a sua certeza, e o que
 * ficou de fora do modelo. Serve todas as páginas.
 */
export function NotaMetodo({ itens, naoEntra, naoEntraNota, titulo = 'Nota de método', aberta = false }: NotaMetodoProps) {
  return (
    <details className="cartao nota-metodo" open={aberta}>
      <summary>{titulo}</summary>
      <ul className="metodo-lista">
        {itens.map((item) => (
          <li key={item.texto}>
            <span className={`certeza ${CLASSE[item.certeza]}`}>{ETIQUETA[item.certeza]}</span> {item.texto}
          </li>
        ))}
      </ul>
      {naoEntra && naoEntra.length > 0 && (
        <>
          <h3>O que não entra no modelo</h3>
          {naoEntraNota && <p className="ajuda">{naoEntraNota}</p>}
          <ul className="metodo-lista">
            {naoEntra.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      )}
    </details>
  );
}
