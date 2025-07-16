# Sistema de Logging para MEGAVERSE

Una librería de logging completa y configurable para manejar mensajes de la aplicación con capacidad de activar/desactivar logs según sea necesario.

## 📋 Características

- ✅ **5 Niveles de Log**: ERROR, WARN, INFO, DEBUG, VERBOSE
- ✅ **Filtrado por Módulos**: Habilitar/deshabilitar logs por módulo específico
- ✅ **Configuración por Entorno**: Presets para desarrollo, producción y testing
- ✅ **Historial de Logs**: Almacenamiento y análisis de logs en memoria
- ✅ **Exportación**: Exportar logs como JSON para análisis
- ✅ **Timestamps**: Marcas de tiempo configurables
- ✅ **Colores**: Colores en consola para mejor legibilidad
- ✅ **Panel de Control**: Interfaz visual para gestionar logs en tiempo real

## 🚀 Instalación y Configuración

### Importar el Logger

```typescript
import { logger, LoggerModules, LoggerPresets, LoggerUtils } from '../utils/loggerConfig';
```

### Configuración Básica

```typescript
// Configuración automática por entorno
// En desarrollo
LoggerPresets.development();

// En producción
LoggerPresets.production();

// Desactivar completamente
LoggerPresets.disabled();
```

## 📝 Uso Básico

### Logging Simple

```typescript
import { logger, LoggerModules } from '../utils/loggerConfig';

// Diferentes niveles de log
logger.error(LoggerModules.AUTH, 'Error de autenticación', { userId: 123 });
logger.warn(LoggerModules.API, 'API lenta', { responseTime: 5000 });
logger.info(LoggerModules.UI, 'Usuario navegó al dashboard');
logger.debug(LoggerModules.PAYMENTS, 'Procesando pago', { amount: 50 });
logger.verbose(LoggerModules.DATABASE, 'Query ejecutada', { query: 'SELECT * FROM users' });
```

### Logger Específico para Módulo

```typescript
import { LoggerUtils, LoggerModules } from '../utils/loggerConfig';

// Crear logger específico
const authLogger = LoggerUtils.createModuleLogger(LoggerModules.AUTH);

// Usar el logger del módulo
authLogger.info('Usuario logueado', { username: 'john@example.com' });
authLogger.error('Login fallido', { reason: 'invalid_password' });
```

## 🔧 Configuración Avanzada

### Configuración Personalizada

```typescript
import { LoggerPresets, LogLevel } from '../utils/loggerConfig';

LoggerPresets.custom({
  enabled: true,
  level: LogLevel.DEBUG,
  enabledModules: ['AUTH', 'API', 'PAYMENTS'], // Solo estos módulos
  disabledModules: ['UI', 'CALENDAR'], // Silenciar estos módulos
  showTimestamp: true,
  showModule: true,
  colors: true
});
```

### Debugging Específico

```typescript
import { LoggerUtils, LoggerModules } from '../utils/loggerConfig';

// Activar debugging solo para módulos específicos
LoggerUtils.enableDebuggingFor(LoggerModules.PAYMENTS, LoggerModules.API);

// Silenciar módulos ruidosos
LoggerUtils.silenceModules(LoggerModules.UI, LoggerModules.CALENDAR);

// Debug de un módulo específico
LoggerPresets.debugModule(LoggerModules.AUTH);
```

## 🎯 Módulos Disponibles

```typescript
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
};
```

## ⚛️ Integración con React

### Hook Personalizado

```typescript
import { useLogger } from '../utils/loggerExamples';

const MyComponent: React.FC = () => {
  const logger = useLogger(LoggerModules.UI);

  useEffect(() => {
    logger.logComponentMount('MyComponent');
    
    return () => {
      logger.logComponentUnmount('MyComponent');
    };
  }, []);

  const handleClick = () => {
    logger.logUserAction('button_click', { buttonId: 'submit' });
  };

  const handleError = (error: Error) => {
    logger.logError(error, 'Form submission');
  };

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
};
```

### Panel de Control

```typescript
import LoggerControlPanel from '../components/admin/LoggerControlPanel';

// Agregar al área de administración
<LoggerControlPanel />
```

## 📊 Análisis de Logs

### Estadísticas

```typescript
import { LoggerUtils } from '../utils/loggerConfig';

// Obtener estadísticas generales
const stats = LoggerUtils.getLogStats();
console.log('Total logs:', stats.total);
console.log('Errores:', stats.byLevel.error);
console.log('Por módulo:', stats.byModule);
```

### Filtrar Logs

```typescript
import { logger, LoggerModules } from '../utils/loggerConfig';

// Filtrar logs específicos
const authLogs = logger.filterLogs({
  module: LoggerModules.AUTH,
  level: LogLevel.ERROR,
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
});

// Obtener errores recientes
const recentErrors = LoggerUtils.getRecentErrors(2); // Últimas 2 horas
```

### Exportar Logs

```typescript
// Exportar todo el historial
const logsJson = logger.exportLogs();

// Limpiar historial
logger.clearHistory();
```

## 🌍 Configuración por Entorno

### Variables de Entorno

```typescript
// Configuración automática
if (import.meta.env.MODE === 'development') {
  LoggerPresets.development();
} else if (import.meta.env.MODE === 'production') {
  LoggerPresets.production();
} else if (import.meta.env.MODE === 'test') {
  LoggerPresets.testing();
}
```

### Query Parameters para Debugging

```typescript
// URL: https://app.com?debug=AUTH,API,PAYMENTS
// Esto activará debugging solo para esos módulos

// URL: https://app.com?enableLogs=true
// Esto forzará la activación de logs en producción
```

## 🎨 Niveles de Log

| Nivel | Descripción | Uso Recomendado |
|-------|-------------|-----------------|
| `ERROR` | Errores críticos | Errores que requieren atención inmediata |
| `WARN` | Advertencias | Situaciones problemáticas pero no críticas |
| `INFO` | Información general | Eventos importantes de la aplicación |
| `DEBUG` | Información de debugging | Depuración durante desarrollo |
| `VERBOSE` | Información muy detallada | Debugging muy específico |

## 🛠️ API Completa

### Logger Principal

```typescript
// Configuración
logger.configure(config: Partial<LogConfig>): void
logger.setEnabled(enabled: boolean): void
logger.setLevel(level: LogLevel): void

// Filtros de módulos
logger.enableModules(...modules: string[]): void
logger.disableModules(...modules: string[]): void
logger.clearModuleFilters(): void

// Logging
logger.error(module: string, message: string, data?: unknown): void
logger.warn(module: string, message: string, data?: unknown): void
logger.info(module: string, message: string, data?: unknown): void
logger.debug(module: string, message: string, data?: unknown): void
logger.verbose(module: string, message: string, data?: unknown): void

// Análisis
logger.getHistory(): LogEntry[]
logger.clearHistory(): void
logger.filterLogs(filters): LogEntry[]
logger.exportLogs(): string
logger.getConfig(): LogConfig
```

### Utilidades

```typescript
// Presets
LoggerPresets.development()
LoggerPresets.production()
LoggerPresets.testing()
LoggerPresets.disabled()
LoggerPresets.debugModule(module: string)
LoggerPresets.custom(config: object)

// Utilidades
LoggerUtils.enableDebuggingFor(...modules: string[])
LoggerUtils.silenceModules(...modules: string[])
LoggerUtils.getRecentErrors(hours: number)
LoggerUtils.getLogStats()
LoggerUtils.createModuleLogger(module: string)
```

## 📈 Mejores Prácticas

1. **Use módulos específicos** para facilitar el filtrado
2. **Configure por entorno** para optimizar rendimiento
3. **Incluya datos contextuales** en los logs
4. **Use niveles apropiados** según la importancia
5. **Evite logging excesivo** en producción
6. **Monitoree estadísticas** regularmente
7. **Exporte logs** para análisis offline

## 🚨 Consideraciones de Rendimiento

- Los logs se almacenan en memoria (máximo 1000 entradas por defecto)
- En producción, considere usar solo ERROR y WARN
- Use filtros de módulos para reducir ruido
- El logging sincronizado puede impactar el rendimiento en casos extremos

## 🔍 Debugging

Para activar debugging temporal, use query parameters:

```
?debug=AUTH,API
?enableLogs=true
?logLevel=DEBUG
```

O use localStorage:

```javascript
localStorage.setItem('loggerConfig', JSON.stringify({
  enabled: true,
  level: 3, // DEBUG
  enabledModules: ['AUTH', 'API']
}));
```

## 📋 Ejemplos Prácticos

Ver el archivo `loggerExamples.ts` para ejemplos completos de uso en diferentes escenarios.
