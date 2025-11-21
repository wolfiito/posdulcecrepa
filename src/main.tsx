import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Solo mantenemos los estilos globales de Tailwind
import App from './App.tsx'

// Asegurarnos de que el elemento root existe antes de renderizar
const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} else {
  console.error("No se encontró el elemento 'root' en el HTML");
}