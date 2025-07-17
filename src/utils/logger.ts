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
    enabled: false, // Comenzar desactivado hasta cargar configuración de BD
    level: LogLevel.INFO,
    enabledModules: [],
    disabledModules: [],
    showTimestamp: true,
    showModule: true,
    colors: true
  };

  private logHistory: LogEntry[] = [];
  private maxHistorySize = 1000;
  private localStorageKey = 'logger-config';

  constructor() {
    // Cargar configuración desde la base de datos al inicializar
    this.loadConfigFromDB();
  }

  /**
   * Cargar configuración desde la base de datos
   */
  private async loadConfigFromDB(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/logger/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          this.config = {
            enabled: data.config.enabled,
            level: this.mapLogLevel(data.config.level),
            enabledModules: data.config.moduleFilters || [],
            disabledModules: [],
            showTimestamp: true,
            showModule: true,
            colors: true
          };
          // Log eliminado para evitar console.log sueltos - la configuración se puede verificar desde LoggerControlPanel
        }
      } else if (response.status === 401 || response.status === 403) {
        console.warn('⚠️ Sin permisos para acceder a la configuración del logger, usando localStorage');
        this.loadConfigFromLocalStorage();
      } else {
        console.warn('⚠️ Error al cargar configuración del logger desde DB, usando localStorage');
        this.loadConfigFromLocalStorage();
      }
    } catch (error) {
      console.warn('⚠️ Error al cargar configuración del logger desde DB, usando localStorage:', error);
      this.loadConfigFromLocalStorage();
    }
  }

  // Mapear string level a LogLevel enum
  private mapLogLevel(level: string): LogLevel {
    const levelMap: { [key: string]: LogLevel } = {
      'error': LogLevel.ERROR,
      'warn': LogLevel.WARN,
      'info': LogLevel.INFO,
      'debug': LogLevel.DEBUG,
      'verbose': LogLevel.VERBOSE
    };
    return levelMap[level] || LogLevel.INFO;
  }

  // Mapear LogLevel enum a string
  private mapLogLevelToString(level: LogLevel): string {
    const levelMap: { [key in LogLevel]: string } = {
      [LogLevel.ERROR]: 'error',
      [LogLevel.WARN]: 'warn',
      [LogLevel.INFO]: 'info',
      [LogLevel.DEBUG]: 'debug',
      [LogLevel.VERBOSE]: 'verbose'
    };
    return levelMap[level];
  }

  /**
   * Cargar configuración desde localStorage (fallback)
   */
  private loadConfigFromLocalStorage(): void {
    try {
      const savedConfig = localStorage.getItem(this.localStorageKey);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        this.config = { ...this.config, ...parsedConfig };
        // Log eliminado para evitar console.log sueltos - la configuración se puede verificar desde LoggerControlPanel
      }
    } catch (error) {
      console.warn('⚠️ Error al cargar configuración del logger desde localStorage:', error);
    }
  }

  /**
   * Guardar configuración en la base de datos
   */
  private async saveConfigToDB(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/logger/config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: this.config.enabled,
          level: this.mapLogLevelToString(this.config.level),
          moduleFilters: this.config.enabledModules
        })
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('⚠️ Sin permisos para guardar configuración del logger en DB, usando localStorage');
        } else {
          console.error('❌ Error al guardar configuración del logger en DB');
        }
        // Fallback a localStorage
        this.saveConfigToLocalStorage();
      }
    } catch (error) {
      console.error('❌ Error al comunicarse con la API para guardar configuración del logger:', error);
      // Fallback a localStorage
      this.saveConfigToLocalStorage();
    }
  }

  /**
   * Guardar configuración en localStorage (fallback)
   */
  private saveConfigToLocalStorage(): void {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.config));
    } catch (error) {
      console.warn('Error al guardar configuración del logger en localStorage:', error);
    }
  }

  /**
   * Configurar el logger
   */
  configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfigToDB(); // Guardar automáticamente cuando se configure
  }

  /**
   * Configurar el logger SIN guardar automáticamente (para cargar desde BD)
   */
  configureWithoutSaving(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
    // NO llamar a saveConfigToDB() para evitar sobrescribir la BD
  }

  /**
   * Activar o desactivar el logging globalmente
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfigToDB(); // Guardar cuando se cambie el estado
  }

  /**
   * Establecer el nivel mínimo de log
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.saveConfigToDB();
  }

  /**
   * Habilitar logging para módulos específicos
   */
  enableModules(...modules: string[]): void {
    this.config.enabledModules = [...this.config.enabledModules, ...modules];
    this.saveConfigToDB();
  }

  /**
   * Deshabilitar logging para módulos específicos
   */
  disableModules(...modules: string[]): void {
    this.config.disabledModules = [...this.config.disabledModules, ...modules];
    this.saveConfigToDB();
  }

  /**
   * Limpiar módulos habilitados/deshabilitados
   */
  clearModuleFilters(): void {
    this.config.enabledModules = [];
    this.config.disabledModules = [];
    this.saveConfigToDB();
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
   * Resetear configuración a valores por defecto
   */
  resetConfig(): void {
    this.config = {
      enabled: true,
      level: LogLevel.INFO,
      enabledModules: [],
      disabledModules: [],
      showTimestamp: true,
      showModule: true,
      colors: true
    };
    this.saveConfigToDB();
  }

  /**
   * Limpiar configuración guardada en localStorage
   */
  clearSavedConfig(): void {
    try {
      localStorage.removeItem(this.localStorageKey);
    } catch (error) {
      console.warn('Error al limpiar configuración guardada:', error);
    }
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

// NOTA: No configurar automáticamente aquí para evitar sobrescribir configuración de BD
// La configuración debe venir desde la base de datos o ser establecida explícitamente por el usuario
// Usar la configuración por defecto del constructor hasta que se cargue desde BD

export { logger };
export default logger;
