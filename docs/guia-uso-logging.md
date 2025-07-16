# Sistema de Logging Completo - Guía de Uso

## 🚀 Características Principales

### ✅ Sistema de Logging Implementado
- **5 niveles de logging**: ERROR, WARN, INFO, DEBUG, VERBOSE
- **Filtrado por módulos**: Habilitar/deshabilitar logging por módulo específico
- **Configuración por entorno**: Presets automáticos para development, production, testing
- **Historial de logs**: Almacenamiento y exportación de logs
- **Colores y formato**: Console styling para mejor legibilidad
- **Panel de control React**: Interfaz visual para gestión de logs

## 📁 Archivos Implementados

### 1. Core del Sistema
- `src/utils/logger.ts` - Clase principal del logger con toda la funcionalidad
- `src/utils/loggerConfig.ts` - Presets y configuraciones predefinidas
- `src/utils/loggerExampleUsage.ts` - Ejemplos prácticos y utilidades

### 2. Interfaz de Usuario
- `src/components/admin/LoggerControlPanel.tsx` - Panel de control React para gestión visual
- `docs/logging-system.md` - Documentación completa del sistema

### 3. Integración
- `src/services/api.ts` - Ejemplo de integración en servicios de API

## 🎯 Uso Básico

### Importar el Logger
```typescript
import { logger, LogLevel } from '../utils/logger';
import { createModuleLogger } from '../utils/loggerExampleUsage';
```

### Logging Simple
```typescript
// Usando el logger global
logger.info('API', 'Usuario autenticado', { userId: 123 });
logger.error('AUTH', 'Error de login', { username: 'user123' });

// Usando logger específico de módulo
const apiLogger = createModuleLogger('API');
apiLogger.info('Iniciando operación', { endpoint: '/users' });
```

### Configuración por Entorno
```typescript
import { LoggerPresets } from '../utils/loggerConfig';

// Automático según NODE_ENV
if (import.meta.env.MODE === 'production') {
  LoggerPresets.production(); // Solo WARN y ERROR
} else {
  LoggerPresets.development(); // Todos los niveles
}
```

## 🔧 Características Avanzadas

### Filtrado por Módulos
```typescript
// Habilitar solo ciertos módulos
logger.enableModules('API', 'AUTH', 'DATABASE');

// Deshabilitar módulos específicos
logger.disableModules('DEBUG_COMPONENT');
```

### Gestión del Historial
```typescript
// Obtener historial completo
const allLogs = logger.getHistory();

// Filtrar logs
const errorLogs = logger.filterLogs({ level: LogLevel.ERROR });
const apiLogs = logger.filterLogs({ module: 'API' });

// Exportar para análisis
const logsJson = logger.exportLogs();

// Limpiar historial
logger.clearHistory();
```

### Hook de React
```typescript
import { useComponentLogger } from '../utils/loggerExampleUsage';

function MyComponent() {
  const { logComponentMount, logUserAction, logError } = useComponentLogger('MyComponent');
  
  useEffect(() => {
    logComponentMount();
  }, []);
  
  const handleClick = () => {
    logUserAction('Button clicked', { buttonId: 'submit' });
  };
}
```

## 🎨 Panel de Control Visual

El `LoggerControlPanel` proporciona:
- **Vista en tiempo real** de todos los logs
- **Controles de filtrado** por nivel y módulo
- **Estadísticas** de logs por nivel
- **Configuración dinámica** del sistema
- **Exportación** de logs

```typescript
import { LoggerControlPanel } from '../components/admin/LoggerControlPanel';

function AdminPage() {
  return (
    <div>
      <h1>Administración</h1>
      <LoggerControlPanel />
    </div>
  );
}
```

## 🌍 Presets de Configuración

### Development
- Todos los niveles habilitados
- Timestamps visibles
- Colores activados
- Nombres de módulo visibles

### Production
- Solo WARN y ERROR
- Sin timestamps (performance)
- Sin colores
- Formato minimalista

### Testing
- Solo INFO, WARN y ERROR
- Sin colores para CI/CD
- Formato limpio

### Debug Module
- Solo un módulo específico
- Nivel VERBOSE
- Máximo detalle

## 🔍 Ejemplos de Integración

### En Servicios de API
```typescript
const apiLogger = createModuleLogger('API');

export const authService = {
  login: async (username: string, password: string) => {
    apiLogger.info('Iniciando login', { username });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        apiLogger.error('Error en login', { 
          status: response.status,
          username 
        });
        throw new Error('Login failed');
      }
      
      apiLogger.info('Login exitoso', { username });
      return await response.json();
    } catch (error) {
      apiLogger.error('Excepción en login', { 
        username,
        error: error.message 
      });
      throw error;
    }
  }
};
```

### En Componentes React
```typescript
import { createModuleLogger } from '../utils/loggerExampleUsage';

const componentLogger = createModuleLogger('COMPONENT');

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    componentLogger.info('Cargando perfil de usuario', { userId });
    
    fetchUser(userId)
      .then(userData => {
        componentLogger.debug('Usuario cargado', { userId, user: userData });
        setUser(userData);
      })
      .catch(error => {
        componentLogger.error('Error cargando usuario', { 
          userId, 
          error: error.message 
        });
      });
  }, [userId]);
  
  return <div>{/* Component JSX */}</div>;
}
```

## 📊 Monitoreo y Análisis

### Estadísticas de Logs
```typescript
const stats = {
  total: logger.getHistory().length,
  errors: logger.filterLogs({ level: LogLevel.ERROR }).length,
  warnings: logger.filterLogs({ level: LogLevel.WARN }).length,
  byModule: {}
};

// Agrupar por módulo
logger.getHistory().forEach(log => {
  stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
});
```

### Alertas Automáticas
```typescript
// Configurar alertas para errores críticos
logger.configure({
  onError: (logEntry) => {
    if (logEntry.level === LogLevel.ERROR) {
      // Enviar notificación, email, etc.
      console.warn('🚨 Error crítico detectado:', logEntry);
    }
  }
});
```

## 🛠️ Configuración Personalizada

### Logger Personalizado
```typescript
import { LoggerPresets } from '../utils/loggerConfig';

// Configuración custom
LoggerPresets.custom({
  enabled: true,
  level: LogLevel.INFO,
  enabledModules: ['API', 'AUTH', 'PAYMENT'],
  showTimestamp: true,
  showModule: true,
  colors: true
});
```

### Variables de Entorno
```env
# .env.development
VITE_LOG_LEVEL=DEBUG
VITE_LOG_MODULES=API,AUTH,COMPONENT

# .env.production
VITE_LOG_LEVEL=WARN
VITE_LOG_MODULES=API,AUTH
```

## 🎉 Beneficios del Sistema

### Para Desarrollo
- **Debug más fácil** con logs estructurados
- **Seguimiento de flujos** de datos y operaciones
- **Identificación rápida** de problemas

### Para Producción
- **Monitoreo en tiempo real** del estado de la aplicación
- **Logs optimizados** para performance
- **Análisis post-mortem** con historial exportable

### Para Testing
- **Logs controlados** para CI/CD
- **Verificación de comportamiento** esperado
- **Debug de tests** fallidos

## 🚀 Próximos Pasos

1. **Integrar en más servicios**: Añadir logging a todos los servicios críticos
2. **Persistencia**: Guardar logs en localStorage o enviar a servidor
3. **Métricas**: Integrar con sistemas de métricas como Analytics
4. **Alertas**: Configurar notificaciones automáticas para errores
5. **Dashboard**: Crear dashboard web para monitoreo en tiempo real

¡El sistema de logging está completamente implementado y listo para usar! 🎯
