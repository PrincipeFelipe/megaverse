-- Agregar campos de configuración del logger a la tabla reservation_config

ALTER TABLE reservation_config 
ADD COLUMN logger_enabled BOOLEAN DEFAULT TRUE COMMENT 'Estado del sistema de logging (activado/desactivado)',
ADD COLUMN logger_level VARCHAR(10) DEFAULT 'info' COMMENT 'Nivel mínimo de logging (debug, info, warn, error, critical)',
ADD COLUMN logger_modules TEXT DEFAULT NULL COMMENT 'Módulos específicos para filtrado (JSON array o NULL para todos)';
