USE db_megaverse;
ALTER TABLE consumptions ADD COLUMN price_per_unit DECIMAL(10,2) DEFAULT NULL COMMENT 'Precio por unidad del producto al momento de la compra';
