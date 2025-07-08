-- Script para agregar el campo 'entrance_fee' a la tabla 'reservation_config'
-- Este campo almacenará la cuota de entrada que pagan los nuevos miembros

ALTER TABLE reservation_config 
ADD COLUMN entrance_fee DECIMAL(10, 2) DEFAULT 0.00 
COMMENT 'Cuota de entrada única para nuevos miembros (€)';

-- Verificar que el campo se agregó correctamente
DESCRIBE reservation_config;

-- Actualizar el registro existente con un valor por defecto
UPDATE reservation_config 
SET entrance_fee = 50.00 
WHERE id = 1;

-- Verificar la actualización
SELECT * FROM reservation_config WHERE id = 1;
