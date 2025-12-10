import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css' // Solo mantenemos los estilos globales de Tailwind
import App from './App.tsx'

// Asegurarnos de que el elemento root existe antes de renderizar
const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render( 
    <StrictMode>
      {/* Envolver App con BrowserRouter */}
      <BrowserRouter> 
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
} else {
  console.error("No se encontró el elemento 'root' en el HTML");
}