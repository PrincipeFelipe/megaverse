-- SQL para añadir columnas faltantes a la tabla users
-- Ejecutar en phpMyAdmin o cualquier cliente MySQL

-- Añadir columna phone si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL AFTER username;

-- Añadir columna avatar_url si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) NULL AFTER email;

-- Añadir columna membership_date si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_date DATE NULL AFTER created_at;
