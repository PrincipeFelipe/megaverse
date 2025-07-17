import { logger, LogLevel } from './logger';

/**
 * Configuraciones predefinidas para diferentes entornos y módulos
 */

export const LoggerPresets = {
  /**
   * Configuración para desarrollo - Muy verbosa (GUARDA EN BD)
   */
  development: () => {
    logger.configure({
      enabled: true,
      level: LogLevel.VERBOSE,
      enabledModules: [],
      disabledModules: [],
      showTimestamp: true,
      showModule: true,
      colors: true
    });
  },

  /**
   * Configuración para producción - Solo errores y warnings (GUARDA EN BD)
   */
  production: () => {
    logger.configure({
      enabled: true,
      level: LogLevel.WARN,
      enabledModules: [],
      disabledModules: [],
      showTimestamp: false,
      showModule: false,
      colors: false
    });
  },

  /**
   * Configuración para testing - Solo errores (GUARDA EN BD)
   */
  testing: () => {
    logger.configure({
      enabled: true,
      level: LogLevel.ERROR,
      enabledModules: [],
      disabledModules: [],
      showTimestamp: false,
      showModule: true,
      colors: false
    });
  },

  /**
   * Desactivar completamente el logging (GUARDA EN BD)
   */
  disabled: () => {
    logger.configure({
      enabled: false,
      level: LogLevel.ERROR,
      enabledModules: [],
      disabledModules: [],
      showTimestamp: false,
      showModule: false,
      colors: false
    });
  },

  /**
   * Configuración para debugging de un módulo específico (GUARDA EN BD)
   */
  debugModule: (moduleName: string) => {
    logger.configure({
      enabled: true,
      level: LogLevel.VERBOSE,
      enabledModules: [moduleName],
      disabledModules: [],
      showTimestamp: true,
      showModule: true,
      colors: true
    });
  },

  /**
   * Configuración personalizada para la aplicación (GUARDA EN BD)
   */
  custom: (config: {
    enabled?: boolean;
    level?: LogLevel;
    enabledModules?: string[];
    disabledModules?: string[];
    showTimestamp?: boolean;
    showModule?: boolean;
    colors?: boolean;
  }) => {
    logger.configure(config);
  }
};

/**
 * Presets que NO guardan automáticamente en BD (solo para cargar configuración)
 */
export const LoggerPresetsReadOnly = {
  /**
   * Configuración para desarrollo - Muy verbosa (NO GUARDA EN BD)
   */
  development: () => {
    logger.configureWithoutSaving({
      enabled: true,
      level: LogLevel.VERBOSE,
      enabledModules: [],
      disabledModules: [],
      showTimestamp: true,
      showModule: true,
      colors: true
    });
  },

  /**
   * Configuración para producción - Solo errores y warnings (NO GUARDA EN BD)
   */
  production: () => {
    logger.configureWithoutSaving({
      enabled: true,
      level: LogLevel.WARN,
      enabledModules: [],
      disabledModules: [],
      showTimestamp: false,
      showModule: false,
      colors: false
    });
  },

  /**
   * Configuración para testing - Solo errores (NO GUARDA EN BD)
   */
  testing: () => {
    logger.configureWithoutSaving({
      enabled: true,
      level: LogLevel.ERROR,
      enabledModules: [],
      disabledModules: [],
      showTimestamp: false,
      showModule: true,
      colors: false
    });
  },

  /**
   * Desactivar completamente el logging (NO GUARDA EN BD)
   */
  disabled: () => {
    logger.configureWithoutSaving({
      enabled: false,
      level: LogLevel.ERROR,
      enabledModules: [],
      disabledModules: [],
      showTimestamp: false,
      showModule: false,
      colors: false
    });
  },

  /**
   * Configuración para debugging de un módulo específico (NO GUARDA EN BD)
   */
  debugModule: (moduleName: string) => {
    logger.configureWithoutSaving({
      enabled: true,
      level: LogLevel.VERBOSE,
      enabledModules: [moduleName],
      disabledModules: [],
      showTimestamp: true,
      showModule: true,
      colors: true
    });
  },

  /**
   * Configuración personalizada para la aplicación (NO GUARDA EN BD)
   */
  custom: (config: {
    enabled?: boolean;
    level?: LogLevel;
    enabledModules?: string[];
    disabledModules?: string[];
    showTimestamp?: boolean;
    showModule?: boolean;
    colors?: boolean;
  }) => {
    logger.configureWithoutSaving(config);
  }
};

/**
 * Módulos comunes de la aplicación para facilitar el uso
 */
export const LoggerModules = {
  AUTH: 'AUTH',
  API: 'API',
  UI: 'UI',
  PAYMENTS: 'PAYMENTS',
  RESERVATIONS: 'RESERVATIONS',
  ADMIN: 'ADMIN',
  CONSUMPTIONS: 'CONSUMPTIONS',
  USERS: 'USERS',
  PRODUCTS: 'PRODUCTS',
  TABLES: 'TABLES',
  CALENDAR: 'CALENDAR',
  NOTIFICATIONS: 'NOTIFICATIONS',
  DOCUMENTS: 'DOCUMENTS',
  BLOG: 'BLOG',
  EXPENSES: 'EXPENSES',
  CONFIG: 'CONFIG',
  DATABASE: 'DATABASE',
  WEBSOCKET: 'WEBSOCKET',
  ROUTER: 'ROUTER',
  FORMS: 'FORMS',
  VALIDATION: 'VALIDATION'
} as const;

/**
 * Funciones de utilidad para casos comunes
 */
export const LoggerUtils = {
  /**
   * Activar debugging solo para módulos específicos
   */
  enableDebuggingFor: (...modules: string[]) => {
    logger.clearModuleFilters();
    logger.enableModules(...modules);
    logger.setLevel(LogLevel.DEBUG);
  },

  /**
   * Desactivar logging para módulos específicos
   */
  silenceModules: (...modules: string[]) => {
    logger.disableModules(...modules);
  },

  /**
   * Obtener logs de error de las últimas horas
   */
  getRecentErrors: (hours: number = 1) => {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return logger.filterLogs({
      level: LogLevel.ERROR,
      startDate: since
    });
  },

  /**
   * Obtener estadísticas de logs
   */
  getLogStats: () => {
    const history = logger.getHistory();
    const stats = {
      total: history.length,
      byLevel: {
        error: 0,
        warn: 0,
        info: 0,
        debug: 0,
        verbose: 0
      },
      byModule: {} as Record<string, number>
    };

    history.forEach(entry => {
      // Contar por nivel
      switch (entry.level) {
        case LogLevel.ERROR:
          stats.byLevel.error++;
          break;
        case LogLevel.WARN:
          stats.byLevel.warn++;
          break;
        case LogLevel.INFO:
          stats.byLevel.info++;
          break;
        case LogLevel.DEBUG:
          stats.byLevel.debug++;
          break;
        case LogLevel.VERBOSE:
          stats.byLevel.verbose++;
          break;
      }

      // Contar por módulo
      stats.byModule[entry.module] = (stats.byModule[entry.module] || 0) + 1;
    });

    return stats;
  },

  /**
   * Crear un logger específico para un módulo
   */
  createModuleLogger: (module: string) => {
    return {
      error: (message: string, data?: unknown) => logger.error(module, message, data),
      warn: (message: string, data?: unknown) => logger.warn(module, message, data),
      info: (message: string, data?: unknown) => logger.info(module, message, data),
      debug: (message: string, data?: unknown) => logger.debug(module, message, data),
      verbose: (message: string, data?: unknown) => logger.verbose(module, message, data)
    };
  }
};

export { logger, LogLevel };
