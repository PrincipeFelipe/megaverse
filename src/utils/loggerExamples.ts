/**
 * Ejemplos de uso del Logger en diferentes partes de la aplicación
 */

import { logger, LoggerModules, LoggerUtils, LoggerPresets } from '../utils/loggerConfig';

// =============================================================================
// EJEMPLOS BÁSICOS DE USO
// =============================================================================

// Uso básico del logger
export const basicUsageExamples = () => {
  // Logging básico por nivel
  logger.error(LoggerModules.AUTH, 'Error de autenticación', { userId: 123 });
  logger.warn(LoggerModules.API, 'API response time is slow', { responseTime: 5000 });
  logger.info(LoggerModules.UI, 'User navigated to dashboard');
  logger.debug(LoggerModules.PAYMENTS, 'Processing payment', { amount: 50 });
  logger.verbose(LoggerModules.DATABASE, 'Database query executed', { query: 'SELECT * FROM users' });
};

// =============================================================================
// CONFIGURACIÓN POR ENTORNO
// =============================================================================

export const environmentSetup = () => {
  // En desarrollo - logging muy detallado
  if (import.meta.env.MODE === 'development') {
    LoggerPresets.development();
    
    // O configuración personalizada para desarrollo
    LoggerPresets.custom({
      enabled: true,
      level: logger.getConfig().level,
      enabledModules: [LoggerModules.AUTH, LoggerModules.API, LoggerModules.PAYMENTS],
      showTimestamp: true,
      showModule: true,
      colors: true
    });
  }

  // En producción - solo warnings y errores
  if (import.meta.env.MODE === 'production') {
    LoggerPresets.production();
  }

  // Para testing
  if (import.meta.env.MODE === 'test') {
    LoggerPresets.testing();
  }
};

// =============================================================================
// LOGGER ESPECÍFICO PARA MÓDULOS
// =============================================================================

// Crear loggers específicos para cada módulo
export const authLogger = LoggerUtils.createModuleLogger(LoggerModules.AUTH);
export const apiLogger = LoggerUtils.createModuleLogger(LoggerModules.API);
export const paymentsLogger = LoggerUtils.createModuleLogger(LoggerModules.PAYMENTS);
export const uiLogger = LoggerUtils.createModuleLogger(LoggerModules.UI);

// Ejemplos de uso de loggers de módulo
export const moduleLoggerExamples = () => {
  // Logger de autenticación
  authLogger.info('User login attempt', { username: 'john@example.com' });
  authLogger.error('Login failed', { reason: 'invalid_password' });

  // Logger de API
  apiLogger.debug('Making API request', { endpoint: '/api/users', method: 'GET' });
  apiLogger.warn('API rate limit approaching', { requests: 95, limit: 100 });

  // Logger de pagos
  paymentsLogger.info('Payment processed successfully', { paymentId: 'pay_123', amount: 50 });
  paymentsLogger.error('Payment failed', { error: 'insufficient_funds' });
};

// =============================================================================
// DEBUGGING ESPECÍFICO
// =============================================================================

export const debuggingExamples = () => {
  // Activar debugging solo para módulos específicos
  LoggerUtils.enableDebuggingFor(LoggerModules.PAYMENTS, LoggerModules.API);

  // Silenciar módulos ruidosos
  LoggerUtils.silenceModules(LoggerModules.UI, LoggerModules.CALENDAR);

  // Debug de un módulo específico
  LoggerPresets.debugModule(LoggerModules.AUTH);
};

// =============================================================================
// ANÁLISIS DE LOGS
// =============================================================================

export const logAnalysisExamples = () => {
  // Obtener estadísticas
  const stats = LoggerUtils.getLogStats();
  console.log('Log Statistics:', stats);

  // Obtener errores recientes
  const recentErrors = LoggerUtils.getRecentErrors(2); // Últimas 2 horas
  console.log('Recent Errors:', recentErrors);

  // Filtrar logs específicos
  const authLogs = logger.filterLogs({
    module: LoggerModules.AUTH,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
  });

  // Exportar logs para análisis
  const logsJson = logger.exportLogs();
  console.log('Exported logs:', logsJson);
};

// =============================================================================
// INTEGRACIÓN CON COMPONENTES REACT
// =============================================================================

// Hook personalizado para logging en componentes
export const useLogger = (moduleName: string) => {
  const moduleLogger = LoggerUtils.createModuleLogger(moduleName);
  
  return {
    ...moduleLogger,
    logComponentMount: (componentName: string) => {
      moduleLogger.debug(`${componentName} mounted`);
    },
    logComponentUnmount: (componentName: string) => {
      moduleLogger.debug(`${componentName} unmounted`);
    },
    logUserAction: (action: string, data?: unknown) => {
      moduleLogger.info(`User action: ${action}`, data);
    },
    logError: (error: Error, context?: string) => {
      moduleLogger.error(`${context || 'Component error'}: ${error.message}`, {
        stack: error.stack,
        name: error.name
      });
    }
  };
};

// =============================================================================
// LOGGING PARA APIS Y SERVICIOS
// =============================================================================

export const apiLoggingExample = () => {
  const apiLogger = LoggerUtils.createModuleLogger(LoggerModules.API);

  // Wrapper para requests de API
  const loggedFetch = async (url: string, options?: RequestInit) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    
    apiLogger.debug('API Request started', {
      requestId,
      url,
      method: options?.method || 'GET'
    });

    try {
      const response = await fetch(url, options);
      
      apiLogger.info('API Request completed', {
        requestId,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        apiLogger.warn('API Request failed', {
          requestId,
          status: response.status,
          url
        });
      }

      return response;
    } catch (error) {
      apiLogger.error('API Request error', {
        requestId,
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  return loggedFetch;
};

// =============================================================================
// CONFIGURACIÓN AVANZADA
// =============================================================================

export const advancedConfiguration = () => {
  // Configuración dinámica basada en localStorage
  const logConfig = localStorage.getItem('loggerConfig');
  if (logConfig) {
    try {
      const config = JSON.parse(logConfig);
      LoggerPresets.custom(config);
    } catch (error) {
      console.error('Failed to parse logger config from localStorage');
    }
  }

  // Configuración basada en query parameters (para debugging)
  const urlParams = new URLSearchParams(window.location.search);
  const debugModules = urlParams.get('debug');
  if (debugModules) {
    const modules = debugModules.split(',');
    LoggerUtils.enableDebuggingFor(...modules);
  }

  // Desactivar logging en producción si no es necesario
  if (import.meta.env.MODE === 'production' && !urlParams.has('enableLogs')) {
    LoggerPresets.disabled();
  }
};

export default {
  basicUsageExamples,
  environmentSetup,
  moduleLoggerExamples,
  debuggingExamples,
  logAnalysisExamples,
  useLogger,
  apiLoggingExample,
  advancedConfiguration
};
