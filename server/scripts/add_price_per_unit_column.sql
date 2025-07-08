-- Script para añadir el campo price_per_unit a la tabla consumptions
-- Si el campo ya existe, este script no realizará ninguna acción

-- 1. Verificar si la columna ya existe
SET @exists = 0;
SELECT COUNT(*) INTO @exists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'consumptions' AND column_name = 'price_per_unit';

-- 2. Añadir la columna si no existe
SET @sql = IF(@exists = 0, 'ALTER TABLE consumptions ADD COLUMN price_per_unit DECIMAL(10,2) DEFAULT NULL COMMENT "Precio por unidad del producto al momento de la compra"', 'SELECT "La columna price_per_unit ya existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Actualizar los registros existentes para rellenar price_per_unit
-- Usamos un CASE para evitar divisiones por cero
UPDATE consumptions c
JOIN products p ON c.product_id = p.id
SET c.price_per_unit = CASE 
    WHEN c.quantity > 0 THEN c.total_price / c.quantity
    ELSE p.price
END
WHERE c.price_per_unit IS NULL;
