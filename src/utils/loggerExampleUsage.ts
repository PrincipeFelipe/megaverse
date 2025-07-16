import { logger, LogLevel } from './logger';
import { LoggerPresets } from './loggerConfig';

// Ejemplo de uso práctico del sistema de logging

// 1. Configurar logger para diferentes entornos
export function setupEnvironmentLogging() {
  const env = import.meta.env.MODE;
  
  if (env === 'production') {
    LoggerPresets.production();
  } else if (env === 'development') {
    LoggerPresets.development();
  } else {
    LoggerPresets.testing();
  }
}

// 2. Ejemplo de logger específico para un componente
export function exampleComponentLogging() {
  logger.info('COMPONENT', 'Componente inicializado');
  logger.debug('COMPONENT', 'Props recibidas', { 
    props: { id: 123, name: 'Ejemplo' } 
  });
  
  try {
    // Simular operación
    throw new Error('Error simulado');
  } catch (error) {
    logger.error('COMPONENT', 'Error en componente', { 
      error: error instanceof Error ? error.message : String(error),
      component: 'ExampleComponent'
    });
  }
}

// 3. Ejemplo de logging para operaciones de API
export async function exampleApiLogging() {
  logger.info('API', 'Iniciando operación de API', { endpoint: '/users' });
  
  try {
    // Simular llamada a API
    const startTime = Date.now();
    
    // ... operación simulada
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const duration = Date.now() - startTime;
    logger.info('API', 'Operación de API completada', { 
      endpoint: '/users',
      duration: `${duration}ms`,
      status: 200
    });
    
  } catch (error) {
    logger.error('API', 'Error en operación de API', {
      endpoint: '/users',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// 4. Ejemplo de logging para autenticación
export function exampleAuthLogging(username: string, success: boolean) {
  if (success) {
    logger.info('AUTH', 'Login exitoso', { username });
  } else {
    logger.warn('AUTH', 'Intento de login fallido', { username });
  }
}

// 5. Ejemplo de logging para bases de datos
export function exampleDatabaseLogging() {
  logger.info('DATABASE', 'Conectando a base de datos');
  logger.debug('DATABASE', 'Configuración de conexión', {
    host: 'localhost',
    database: 'app_db',
    // No loggear información sensible como passwords
  });
  
  logger.verbose('DATABASE', 'Query ejecutada', {
    query: 'SELECT * FROM users WHERE active = ?',
    params: [true],
    executionTime: '45ms'
  });
}

// 6. Ejemplo de logging con diferentes niveles
export function exampleLogLevels() {
  logger.error('EXAMPLE', 'Esto es un error crítico', { 
    critical: true,
    action: 'Requiere atención inmediata'
  });
  
  logger.warn('EXAMPLE', 'Esto es una advertencia', {
    suggestion: 'Considerar revisar configuración'
  });
  
  logger.info('EXAMPLE', 'Información general', {
    event: 'Usuario registrado',
    userId: 123
  });
  
  logger.debug('EXAMPLE', 'Información de depuración', {
    state: { loading: false, data: [] },
    performance: { renderTime: '2ms' }
  });
  
  logger.verbose('EXAMPLE', 'Información muy detallada', {
    internalState: { 
      cache: 'hit',
      memoryUsage: '45MB',
      timestamp: new Date().toISOString()
    }
  });
}

// 7. Ejemplo de uso en un hook de React
export function useComponentLogger(componentName: string) {
  const logComponentMount = () => {
    logger.info('COMPONENT', `${componentName} montado`);
  };
  
  const logComponentUnmount = () => {
    logger.info('COMPONENT', `${componentName} desmontado`);
  };
  
  const logUserAction = (action: string, data?: Record<string, unknown>) => {
    logger.info('COMPONENT', `${componentName}: ${action}`, data);
  };
  
  const logError = (error: Error, context?: Record<string, unknown>) => {
    logger.error('COMPONENT', `${componentName}: Error`, {
      error: error.message,
      stack: error.stack,
      ...context
    });
  };
  
  return {
    logComponentMount,
    logComponentUnmount,
    logUserAction,
    logError
  };
}

// 8. Ejemplo de configuración dinámica
export function exampleDynamicConfiguration() {
  // Cambiar nivel de logging en tiempo real
  logger.setLevel(LogLevel.WARN);
  
  // Filtrar solo ciertos módulos
  logger.enableModules('API', 'AUTH');
  
  // Exportar logs para análisis
  const logs = logger.exportLogs();
  console.log('Logs exportados:', logs.length);
  
  // Limpiar historial
  logger.clearHistory();
}

// 9. Crear funciones de utilidad para módulos específicos
export const createModuleLogger = (moduleName: string) => {
  return {
    error: (message: string, data?: unknown) => logger.error(moduleName, message, data),
    warn: (message: string, data?: unknown) => logger.warn(moduleName, message, data),
    info: (message: string, data?: unknown) => logger.info(moduleName, message, data),
    debug: (message: string, data?: unknown) => logger.debug(moduleName, message, data),
    verbose: (message: string, data?: unknown) => logger.verbose(moduleName, message, data),
  };
};

// Función de demostración completa
export function demonstrateLoggingSystem() {
  console.log('=== Demostración del Sistema de Logging ===');
  
  setupEnvironmentLogging();
  exampleComponentLogging();
  exampleApiLogging();
  exampleAuthLogging('usuario_test', true);
  exampleDatabaseLogging();
  exampleLogLevels();
  exampleDynamicConfiguration();
  
  console.log('=== Fin de la demostración ===');
}
