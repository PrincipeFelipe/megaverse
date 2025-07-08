-- Script para agregar campo de motivo de denegación a la tabla reservations

-- Agregar campo rejection_reason a la tabla reservations
ALTER TABLE reservations ADD COLUMN rejection_reason TEXT NULL;

-- Verificar que el campo se haya agregado correctamente
DESCRIBE reservations;

-- Comentario: 
-- Este campo almacenará el motivo cuando una reserva de todo el día sea denegada
-- Solo se usa para reservas all_day = 1 que han sido rechazadas
