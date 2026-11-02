import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// A ordem importa: tokens primeiro, base por cima.
import './styles/tokens.css';
import './styles/base.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
