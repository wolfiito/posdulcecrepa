import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css' // Solo mantenemos los estilos globales de Tailwind
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import ErrorBoundary from './components/ErrorBoundary'
import { logger } from './services/loggerService'

// Registro automático del Service Worker para actualizaciones inmediatas
registerSW({ immediate: true })

// Integración de Logs Globales
window.onerror = function (message, source, lineno, colno, error) {
  logger.error(`Error global: ${message}`, error || new Error(message as string), {
    context: 'window.onerror',
    metadata: { source, lineno, colno }
  });
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Promesa no controlada (unhandled rejection)', event.reason, {
    context: 'window.unhandledrejection',
  });
});

// Asegurarnos de que el elemento root existe antes de renderizar
const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render( 
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter> 
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
} else {
  console.error("No se encontró el elemento 'root' en el HTML");
}