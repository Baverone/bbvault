import { useCallback, useEffect, useState } from 'react';
// `.ts` explícito: o Node exige a extensão nos imports locais dos ficheiros que
// o `node --test` carrega; o Vite resolve-a na mesma.
import { pageById, type PageId } from '../navigation/pages.ts';

/**
 * Em que página a app está, com o URL como fonte de verdade: cada página é um
 * `#id`, o botão «voltar» volta à página anterior e dá para mandar o link.
 * Um hash desconhecido (ou nenhum) abre o Início.
 */
function readPage(): PageId {
  const id = window.location.hash.replace(/^#/, '');
  return pageById(id)?.id ?? 'inicio';
}

export function useHashRoute(): [PageId, (id: PageId) => void] {
  const [page, setPage] = useState<PageId>(readPage);

  useEffect(() => {
    function onHashChange() {
      setPage(readPage());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((id: PageId) => {
    // `location.hash` e não `setPage`: assim o passo fica no histórico.
    if (window.location.hash === `#${id}`) setPage(id);
    else window.location.hash = `#${id}`;
  }, []);

  return [page, navigate];
}
