/**
 * Logger utility para manejar mensajes de la aplicación
 * Permite activar/desactivar logs por nivel y módulo
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4
}

export interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  enabledModules: string[];
  disabledModules: string[];
  showTimestamp: boolean;
  showModule: boolean;
  colors: boolean;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
}

class Logger {
  private config: LogConfig = {
    enabled: true,
    level: LogLevel.INFO,
    enabledModules: [],
    disabledModules: [],
    showTimestamp: true,
    showModule: true,
    colors: true
  };

  private logHistory: LogEntry[] = [];
  private maxHistorySize = 1000;

  /**
   * Configurar el logger
   */
  configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Activar o desactivar el logging globalmente
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Establecer el nivel mínimo de log
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Habilitar logging para módulos específicos
   */
  enableModules(...modules: string[]): void {
    this.config.enabledModules = [...this.config.enabledModules, ...modules];
  }

  /**
   * Deshabilitar logging para módulos específicos
   */
  disableModules(...modules: string[]): void {
    this.config.disabledModules = [...this.config.disabledModules, ...modules];
  }

  /**
   * Limpiar módulos habilitados/deshabilitados
   */
  clearModuleFilters(): void {
    this.config.enabledModules = [];
    this.config.disabledModules = [];
  }

  /**
   * Verificar si un módulo y nivel deben ser logueados
   */
  private shouldLog(level: LogLevel, module: string): boolean {
    if (!this.config.enabled) return false;
    if (level > this.config.level) return false;
    
    // Si hay módulos específicamente deshabilitados
    if (this.config.disabledModules.includes(module)) return false;
    
    // Si hay módulos específicamente habilitados, solo loguear esos
    if (this.config.enabledModules.length > 0) {
      return this.config.enabledModules.includes(module);
    }
    
    return true;
  }

  /**
   * Formatear el mensaje de log
   */
  private formatMessage(level: LogLevel, module: string, message: string): string {
    let formatted = '';
    
    if (this.config.showTimestamp) {
      const timestamp = new Date().toLocaleString('es-ES');
      formatted += `[${timestamp}] `;
    }
    
    if (this.config.showModule) {
      formatted += `[${module}] `;
    }
    
    const levelName = LogLevel[level];
    formatted += `[${levelName}] `;
    
    formatted += message;
    
    return formatted;
  }

  /**
   * Obtener el estilo de consola para cada nivel
   */
  private getConsoleStyle(level: LogLevel): string {
    if (!this.config.colors) return '';
    
    switch (level) {
      case LogLevel.ERROR:
        return 'color: #ff4444; font-weight: bold;';
      case LogLevel.WARN:
        return 'color: #ffaa00; font-weight: bold;';
      case LogLevel.INFO:
        return 'color: #0088ff;';
      case LogLevel.DEBUG:
        return 'color: #888888;';
      case LogLevel.VERBOSE:
        return 'color: #cccccc;';
      default:
        return '';
    }
  }

  /**
   * Método interno para loguear
   */
  private log(level: LogLevel, module: string, message: string, data?: unknown): void {
    if (!this.shouldLog(level, module)) return;

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      module,
      message,
      data
    };

    // Añadir al historial
    this.logHistory.push(logEntry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    const formattedMessage = this.formatMessage(level, module, message);
    const style = this.getConsoleStyle(level);

    // Loguear en consola
    switch (level) {
      case LogLevel.ERROR:
        if (data) {
          console.error(`%c${formattedMessage}`, style, data);
        } else {
          console.error(`%c${formattedMessage}`, style);
        }
        break;
      case LogLevel.WARN:
        if (data) {
          console.warn(`%c${formattedMessage}`, style, data);
        } else {
          console.warn(`%c${formattedMessage}`, style);
        }
        break;
      default:
        if (data) {
          console.log(`%c${formattedMessage}`, style, data);
        } else {
          console.log(`%c${formattedMessage}`, style);
        }
    }
  }

  /**
   * Métodos públicos de logging por nivel
   */
  error(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, module, message, data);
  }

  warn(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, module, message, data);
  }

  info(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, module, message, data);
  }

  debug(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, module, message, data);
  }

  verbose(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.VERBOSE, module, message, data);
  }

  /**
   * Obtener historial de logs
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Limpiar historial de logs
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): LogConfig {
    return { ...this.config };
  }

  /**
   * Exportar logs como JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Filtrar logs del historial
   */
  filterLogs(filters: {
    level?: LogLevel;
    module?: string;
    startDate?: Date;
    endDate?: Date;
  }): LogEntry[] {
    return this.logHistory.filter(entry => {
      if (filters.level !== undefined && entry.level !== filters.level) return false;
      if (filters.module && entry.module !== filters.module) return false;
      if (filters.startDate && entry.timestamp < filters.startDate) return false;
      if (filters.endDate && entry.timestamp > filters.endDate) return false;
      return true;
    });
  }
}

// Instancia singleton del logger
const logger = new Logger();

// Configuración según el entorno
if (import.meta.env.MODE === 'development') {
  logger.configure({
    enabled: true,
    level: LogLevel.DEBUG,
    showTimestamp: true,
    showModule: true,
    colors: true
  });
} else if (import.meta.env.MODE === 'production') {
  logger.configure({
    enabled: true,
    level: LogLevel.WARN, // Solo warnings y errores en producción
    showTimestamp: false,
    showModule: false,
    colors: false
  });
}

export { logger };
export default logger;
