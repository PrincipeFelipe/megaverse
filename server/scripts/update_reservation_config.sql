-- Script para añadir los nuevos campos de configuración de reservas consecutivas
-- Ejecutar este script para actualizar la tabla reservation_config existente

-- Comprobar si la columna ya existe
SET @exist := (SELECT COUNT(*)
               FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'reservation_config'
               AND COLUMN_NAME = 'allow_consecutive_reservations');

-- Si no existe, añadir la columna
SET @query = IF(@exist = 0,
    'ALTER TABLE reservation_config ADD COLUMN allow_consecutive_reservations BOOLEAN DEFAULT TRUE AFTER requires_approval_for_all_day',
    'SELECT "La columna allow_consecutive_reservations ya existe" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Comprobar si la columna ya existe
SET @exist := (SELECT COUNT(*)
               FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'reservation_config'
               AND COLUMN_NAME = 'min_time_between_reservations');

-- Si no existe, añadir la columna
SET @query = IF(@exist = 0,
    'ALTER TABLE reservation_config ADD COLUMN min_time_between_reservations INT DEFAULT 30 AFTER allow_consecutive_reservations',
    'SELECT "La columna min_time_between_reservations ya existe" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar configuración existente con valores predeterminados
UPDATE reservation_config 
SET allow_consecutive_reservations = TRUE, 
    min_time_between_reservations = 30 
WHERE allow_consecutive_reservations IS NULL 
OR min_time_between_reservations IS NULL;

SELECT 'Actualización completada. Se han añadido nuevos campos para controlar reservas consecutivas.' AS result;
