import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { logger, LogLevel, type LogEntry } from '../../utils/logger';
import { LoggerPresets, LoggerModules, LoggerUtils } from '../../utils/loggerConfig';

export const LoggerControlPanel: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState(logger.getConfig());
  const [selectedLevel, setSelectedLevel] = useState<LogLevel>(LogLevel.INFO);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [lastAction, setLastAction] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Cargar configuración desde la base de datos
  const loadConfigFromDB = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/logger/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          // Usar configureWithoutSaving para evitar sobrescribir la BD
          const loggerConfig = {
            enabled: data.config.enabled,
            level: data.config.level === 'error' ? LogLevel.ERROR :
                   data.config.level === 'warn' ? LogLevel.WARN :
                   data.config.level === 'info' ? LogLevel.INFO :
                   data.config.level === 'debug' ? LogLevel.DEBUG :
                   data.config.level === 'verbose' ? LogLevel.VERBOSE : LogLevel.INFO,
            enabledModules: data.config.moduleFilters || [],
            disabledModules: [],
            showTimestamp: true,
            showModule: true,
            colors: true
          };
          
          logger.configureWithoutSaving(loggerConfig);
          setConfig(logger.getConfig());
          setLastAction('🔄 Configuración cargada desde DB (sin guardar)');
        }
      } else if (response.status === 401 || response.status === 403) {
        logger.warn('LOGGER_PANEL', 'Sin permisos para acceder a la configuración del logger, usando configuración local');
        setLastAction('⚠️ Sin permisos para DB, usando configuración local');
        setConfig(logger.getConfig());
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      logger.error('LOGGER_PANEL', 'Error al cargar configuración del logger desde DB', error);
      setLastAction('❌ Error al cargar desde DB, usando configuración local');
      // Cargar configuración local como fallback
      setConfig(logger.getConfig());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar configuración desde DB al inicializar
    loadConfigFromDB();
    setLogs(logger.getHistory().slice(-50));
  }, []);

  useEffect(() => {
    // Actualizar logs cada segundo PERO NO la configuración
    const interval = setInterval(() => {
      setLogs(logger.getHistory().slice(-50)); // Últimos 50 logs
      // Comentado para evitar actualizaciones constantes que disparan saveConfigToDB
      // setConfig(logger.getConfig());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const applyPreset = (preset: string) => {
    if (preset === 'debugModule' && selectedModule) {
      LoggerPresets.debugModule(selectedModule);
    } else if (preset === 'custom') {
      LoggerPresets.custom({
        enabled: true,
        level: selectedLevel,
        showTimestamp: true,
        showModule: true,
        colors: true
      });
    } else {
      switch (preset) {
        case 'development':
          LoggerPresets.development();
          break;
        case 'production':
          LoggerPresets.production();
          break;
        case 'testing':
          LoggerPresets.testing();
          break;
        case 'disabled':
          LoggerPresets.disabled();
          break;
      }
    }
    
    // Actualizar inmediatamente la configuración local
    const newConfig = logger.getConfig();
    setConfig(newConfig);
    
    // Actualizar el estado de la última acción
    let actionDescription = '';
    switch (preset) {
      case 'development':
        actionDescription = 'Preset "Desarrollo" aplicado - Logging completo activado';
        break;
      case 'production':
        actionDescription = 'Preset "Producción" aplicado - Solo errores y warnings';
        break;
      case 'testing':
        actionDescription = 'Preset "Testing" aplicado - Logging de debug activado';
        break;
      case 'disabled':
        actionDescription = 'Preset "Desactivado" aplicado - Logging completamente desactivado';
        break;
      case 'custom':
        actionDescription = 'Configuración personalizada aplicada';
        break;
      case 'debugModule':
        actionDescription = `Debug activado para módulo: ${selectedModule}`;
        break;
      default:
        actionDescription = `Preset "${preset}" aplicado`;
    }
    
    setLastAction(actionDescription);
    
    // Limpiar la notificación después de 4 segundos
    setTimeout(() => setLastAction(''), 4000);
  };

  const testLogger = () => {
    // Generar logs de prueba
    logger.error(LoggerModules.AUTH, 'Test error message', { testData: 'error' });
    logger.warn(LoggerModules.API, 'Test warning message', { testData: 'warning' });
    logger.info(LoggerModules.UI, 'Test info message', { testData: 'info' });
    logger.debug(LoggerModules.PAYMENTS, 'Test debug message', { testData: 'debug' });
    logger.verbose(LoggerModules.ADMIN, 'Test verbose message', { testData: 'verbose' });
    
    setLastAction('Logs de prueba generados');
    setTimeout(() => setLastAction(''), 3000);
  };

  const clearLogs = () => {
    logger.clearHistory();
    setLogs([]);
    setLastAction('Historial de logs limpiado');
    setTimeout(() => setLastAction(''), 3000);
  };

  const resetConfig = () => {
    logger.resetConfig();
    setConfig(logger.getConfig());
    setLastAction('🔄 Configuración restablecida a valores por defecto');
    setTimeout(() => setLastAction(''), 4000);
  };

  const reloadFromDB = async () => {
    setLastAction('🔄 Recargando configuración desde DB...');
    await loadConfigFromDB();
  };

  const exportLogs = () => {
    const logsJson = logger.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.ERROR:
        return 'text-red-500';
      case LogLevel.WARN:
        return 'text-yellow-500';
      case LogLevel.INFO:
        return 'text-blue-500';
      case LogLevel.DEBUG:
        return 'text-gray-500';
      case LogLevel.VERBOSE:
        return 'text-gray-400';
      default:
        return 'text-gray-600';
    }
  };

  const getLevelName = (level: LogLevel): string => {
    return LogLevel[level];
  };

  const stats = LoggerUtils.getLogStats();

  return (
    <div className="space-y-6 p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Logger Control Panel</h2>
        
        {/* Notificación de última acción */}
        {lastAction && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-md">
            ✅ {lastAction}
          </div>
        )}
        
        {/* Estado actual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Estado</h3>
            <p className={`text-sm font-bold ${config.enabled ? 'text-green-600' : 'text-red-600'}`}>
              {config.enabled ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Nivel</h3>
            <p className="text-sm">{getLevelName(config.level)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Total Logs</h3>
            <p className="text-sm">{stats.total}</p>
          </div>
        </div>

        {/* Controles de configuración */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold">Configuración Rápida</h3>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => applyPreset('development')} size="sm">
              Desarrollo
            </Button>
            <Button onClick={() => applyPreset('production')} size="sm">
              Producción
            </Button>
            <Button onClick={() => applyPreset('testing')} size="sm">
              Testing
            </Button>
            <Button onClick={() => applyPreset('disabled')} size="sm" variant="outline">
              Desactivar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nivel de Log</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(Number(e.target.value) as LogLevel)}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
              >
                <option value={LogLevel.ERROR}>ERROR</option>
                <option value={LogLevel.WARN}>WARN</option>
                <option value={LogLevel.INFO}>INFO</option>
                <option value={LogLevel.DEBUG}>DEBUG</option>
                <option value={LogLevel.VERBOSE}>VERBOSE</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Módulo para Debug</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="">Seleccionar módulo</option>
                {Object.values(LoggerModules).map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => applyPreset('custom')} size="sm">
              Aplicar Configuración
            </Button>
            {selectedModule && (
              <Button onClick={() => applyPreset('debugModule')} size="sm">
                Debug Módulo
              </Button>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Acciones</h3>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={testLogger} size="sm" variant="outline">
              Generar Logs de Prueba
            </Button>
            <Button onClick={clearLogs} size="sm" variant="outline">
              Limpiar Logs
            </Button>
            <Button onClick={exportLogs} size="sm" variant="outline">
              Exportar Logs
            </Button>
            <Button onClick={resetConfig} size="sm" variant="outline">
              Resetear Configuración
            </Button>
            <Button onClick={reloadFromDB} size="sm" variant="outline" disabled={loading}>
              {loading ? '🔄 Cargando...' : '📡 Recargar desde DB'}
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
              <div className="text-red-600 font-semibold">Errores</div>
              <div className="text-2xl font-bold">{stats.byLevel.error}</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
              <div className="text-yellow-600 font-semibold">Warnings</div>
              <div className="text-2xl font-bold">{stats.byLevel.warn}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <div className="text-blue-600 font-semibold">Info</div>
              <div className="text-2xl font-bold">{stats.byLevel.info}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded">
              <div className="text-gray-600 font-semibold">Debug</div>
              <div className="text-2xl font-bold">{stats.byLevel.debug}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded">
              <div className="text-gray-600 font-semibold">Verbose</div>
              <div className="text-2xl font-bold">{stats.byLevel.verbose}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Logs en tiempo real */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Logs Recientes</h3>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No hay logs disponibles</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-400">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                {' '}
                <span className="text-blue-400">[{log.module}]</span>
                {' '}
                <span className={getLevelColor(log.level)}>
                  [{getLevelName(log.level)}]
                </span>
                {' '}
                <span className="text-white">{log.message}</span>
                {log.data !== undefined && log.data !== null && (
                  <span className="text-gray-400 ml-2">
                    [con datos adicionales]
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default LoggerControlPanel;
