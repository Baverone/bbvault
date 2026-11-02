import { useEffect, type ReactNode } from 'react';
import { PAGES, pageById, pageTitle, type PageId } from '../../navigation/pages.ts';

interface AppShellProps {
  page: PageId;
  onNavigate: (id: PageId) => void;
  children: ReactNode;
}

/**
 * A CASCA de todas as páginas: barra de topo com o nome e a navegação, e o
 * conteúdo por baixo. No telemóvel a navegação continua na barra do topo, em
 * linha própria e com deslocação lateral se não couber.
 */
export function AppShell({ page, onNavigate, children }: AppShellProps) {
  const meta = pageById(page);

  // Um título por página no separador do browser.
  useEffect(() => {
    document.title = pageTitle(page);
  }, [page]);

  return (
    <>
      {/* Sem mexer no hash: `#conteudo` não é uma página e o router mandava a
          app para o Início. Foca-se o <main> (tabIndex -1) à mão. */}
      <a
        className="salta"
        href="#conteudo"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('conteudo')?.focus();
        }}
      >
        Saltar para o conteúdo
      </a>
      <header className="topo">
        <div className="topo-in">
          <button className="marca" type="button" onClick={() => onNavigate('inicio')}>
            <span className="mk" aria-hidden="true">
              BB
            </span>
            <span className="marca-nome">BBVault</span>
          </button>
          <nav className="nav" aria-label="Navegação do site">
            {PAGES.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className={p.id === page ? 'nav-link ativo' : 'nav-link'}
                aria-current={p.id === page ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(p.id);
                }}
              >
                {p.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="pagina" id="conteudo" tabIndex={-1}>
        {meta && (
          <div className="cabecalho">
            <h1>{meta.label}</h1>
            <p className="sub">{meta.subtitulo}</p>
          </div>
        )}
        {children}
      </main>
      <footer className="rodape">
        BBVault · calculadoras de apoio, sem ligação oficial ao BuzzerBeater.
      </footer>
    </>
  );
}
