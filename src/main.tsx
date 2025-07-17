import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Inicializar sistema de logging
import { setupEnvironmentLogging } from './utils/loggerExampleUsage';
import { logger } from './utils/logger';

// Configurar logging según el entorno
setupEnvironmentLogging();

// Verificar que la configuración persistente funciona
logger.debug('SYSTEM', 'Logger config on startup', logger.getConfig());

// Log de inicio de la aplicación
logger.info('APP', 'Aplicación iniciando', {
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString()
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
