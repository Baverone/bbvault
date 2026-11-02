import { AppShell } from './components/shell/AppShell.tsx';
import { useHashRoute } from './hooks/useHashRoute.ts';
import type { PageId } from './navigation/pages.ts';
import { AvaliacaoPage } from './pages/AvaliacaoPage.tsx';
import { InicioPage } from './pages/InicioPage.tsx';
import { SalarioPage } from './pages/SalarioPage.tsx';
import { TreinoPage } from './pages/TreinoPage.tsx';

function renderPage(page: PageId, onNavigate: (id: PageId) => void) {
  switch (page) {
    case 'treino':
      return <TreinoPage />;
    case 'salario':
      return <SalarioPage />;
    case 'avaliacao':
      return <AvaliacaoPage />;
    default:
      return <InicioPage onNavigate={onNavigate} />;
  }
}

export default function App() {
  const [page, navigate] = useHashRoute();
  return (
    <AppShell page={page} onNavigate={navigate}>
      {renderPage(page, navigate)}
    </AppShell>
  );
}
