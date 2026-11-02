import { PAGES, type PageId } from '../navigation/pages.ts';

interface InicioPageProps {
  onNavigate: (id: PageId) => void;
}

export function InicioPage({ onNavigate }: InicioPageProps) {
  const calculadoras = PAGES.filter((p) => p.id !== 'inicio');
  return (
    <>
      <p className="lead">
        O BBVault junta três calculadoras para o BuzzerBeater: projetar o treino de um jogador, estimar o salário e
        avaliar a sua força e o seu potencial. Os cálculos correm no teu browser e não há pedidos à conta do jogo.
      </p>
      <div className="grelha">
        {calculadoras.map((p) => (
          <a
            key={p.id}
            className="cartao cartao-link"
            href={`#${p.id}`}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(p.id);
            }}
          >
            <h2>{p.label}</h2>
            <p>{p.nota}</p>
          </a>
        ))}
      </div>
      <p className="texto-inicio">
        O jogador que escreves numa página fica guardado só neste browser e aparece nas outras. Cada número diz de
        onde vem (confirmado, provável ou estimativa) na nota de método da página, e quando não há dados a
        calculadora diz «sem estimativa» e porquê.
      </p>
      <p className="texto-inicio">Plantel, Pavilhão, Alinhamento e Mercado vêm a seguir.</p>
      <p className="aviso">As calculadoras recomendam; quem decide no jogo és tu.</p>
    </>
  );
}
