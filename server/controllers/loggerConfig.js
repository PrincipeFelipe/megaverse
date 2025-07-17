/**
 * Controlador específico para la configuración del logger
 */

import { LoggerConfigService } from '../services/loggerConfigService.js';

// Obtener configuración del logger
export const getLoggerConfig = async (req, res) => {
  try {
    console.log('[LoggerController] 📋 GET /api/logger/config - Solicitando configuración');
    const config = await LoggerConfigService.getConfig();
    console.log('[LoggerController] 📤 Enviando configuración al frontend:', config);
    res.status(200).json({
      success: true,
      config
    });
  } catch (error) {
    console.error('[LoggerController] ❌ Error al obtener configuración del logger:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener configuración del logger' 
    });
  }
};

// Actualizar configuración del logger
export const updateLoggerConfig = async (req, res) => {
  try {
    console.log('[LoggerController] 💾 PUT /api/logger/config - Datos recibidos:', req.body);
    const { enabled, level, moduleFilters } = req.body;
    
    // Validaciones básicas
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      console.log('[LoggerController] ❌ Validación fallida: enabled no es booleano');
      return res.status(400).json({ 
        success: false,
        error: 'El campo "enabled" debe ser booleano' 
      });
    }
    
    if (level !== undefined && !['error', 'warn', 'info', 'debug', 'verbose'].includes(level)) {
      console.log('[LoggerController] ❌ Validación fallida: nivel inválido');
      return res.status(400).json({ 
        success: false,
        error: 'Nivel de log inválido' 
      });
    }
    
    if (moduleFilters !== undefined && !Array.isArray(moduleFilters)) {
      console.log('[LoggerController] ❌ Validación fallida: moduleFilters no es array');
      return res.status(400).json({ 
        success: false,
        error: 'Los filtros de módulos deben ser un array' 
      });
    }

    console.log('[LoggerController] ✅ Validaciones pasadas, actualizando configuración...');
    const success = await LoggerConfigService.updateConfig({
      enabled,
      level,
      moduleFilters
    });
    
    if (success) {
      console.log('[LoggerController] ✅ Configuración actualizada, obteniendo nueva configuración...');
      const updatedConfig = await LoggerConfigService.getConfig();
      console.log('[LoggerController] 📤 Enviando configuración actualizada:', updatedConfig);
      res.status(200).json({
        success: true,
        message: 'Configuración del logger actualizada correctamente',
        config: updatedConfig
      });
    } else {
      console.log('[LoggerController] ❌ Error al actualizar configuración');
      res.status(500).json({
        success: false,
        error: 'Error al actualizar configuración del logger'
      });
    }
  } catch (error) {
    console.error('[LoggerController] ❌ Error al actualizar configuración del logger:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error del servidor al actualizar configuración del logger' 
    });
  }
};
