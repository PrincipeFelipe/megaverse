/**
 * Servicio para gestionar la configuración del logger desde la base de datos
 */

import { pool } from '../config/database.js';

class LoggerConfigService {
  static async getConfig() {
    try {
      console.log('[LoggerConfigService] 🔍 Obteniendo configuración del logger desde BD...');
      const connection = await pool.getConnection();
      const [config] = await connection.query(
        'SELECT logger_enabled, logger_level, logger_modules FROM reservation_config WHERE id = 1'
      );
      connection.release();
      
      if (config.length === 0) {
        console.log('[LoggerConfigService] ⚠️ No hay configuración en BD, usando valores por defecto');
        // Configuración por defecto si no existe - LOGGER DESACTIVADO POR DEFECTO
        return {
          enabled: false,
          level: 'info',
          moduleFilters: []
        };
      }
      
      const dbConfig = config[0];
      const result = {
        enabled: Boolean(dbConfig.logger_enabled),
        level: dbConfig.logger_level || 'info',
        moduleFilters: dbConfig.logger_modules ? JSON.parse(dbConfig.logger_modules) : []
      };
      
      console.log('[LoggerConfigService] ✅ Configuración obtenida de BD:', {
        enabled: result.enabled,
        level: result.level,
        moduleFilters: result.moduleFilters.length + ' filtros',
        raw_db_values: {
          logger_enabled: dbConfig.logger_enabled,
          logger_level: dbConfig.logger_level,
          logger_modules: dbConfig.logger_modules
        }
      });
      
      return result;
    } catch (error) {
      console.error('[LoggerConfigService] ❌ Error al obtener configuración del logger desde DB:', error);
      // Retornar configuración por defecto en caso de error - LOGGER DESACTIVADO POR SEGURIDAD
      return {
        enabled: false,
        level: 'info',
        moduleFilters: []
      };
    }
  }
  
  static async updateConfig({ enabled, level, moduleFilters }) {
    try {
      console.log('[LoggerConfigService] 💾 Guardando configuración del logger en BD...', {
        enabled,
        level,
        moduleFilters
      });
      
      const connection = await pool.getConnection();
      
      const updateFields = [];
      const updateValues = [];
      
      if (enabled !== undefined) {
        updateFields.push('logger_enabled = ?');
        updateValues.push(enabled ? 1 : 0);
      }
      
      if (level !== undefined) {
        updateFields.push('logger_level = ?');
        updateValues.push(level);
      }
      
      if (moduleFilters !== undefined) {
        updateFields.push('logger_modules = ?');
        updateValues.push(moduleFilters.length > 0 ? JSON.stringify(moduleFilters) : null);
      }
      
      if (updateFields.length === 0) {
        console.log('[LoggerConfigService] ⚠️ No hay campos para actualizar');
        connection.release();
        return false;
      }
      
      updateFields.push('updated_at = NOW()');
      
      const query = `UPDATE reservation_config SET ${updateFields.join(', ')} WHERE id = 1`;
      console.log('[LoggerConfigService] 📝 Ejecutando query:', query, 'con valores:', updateValues);
      
      const result = await connection.query(query, updateValues);
      
      console.log('[LoggerConfigService] ✅ Configuración guardada exitosamente:', {
        affectedRows: result[0].affectedRows,
        enabled,
        level,
        moduleFilters
      });
      
      connection.release();
      return true;
    } catch (error) {
      console.error('[LoggerConfigService] ❌ Error al actualizar configuración del logger en DB:', error);
      return false;
    }
  }
}

export { LoggerConfigService };
