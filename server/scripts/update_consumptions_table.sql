-- Añadir campo paid a la tabla consumptions
-- 0: No pagado, 1: Pendiente de aprobación, 2: Pagado
ALTER TABLE consumptions ADD COLUMN paid TINYINT NOT NULL DEFAULT 0;

-- Actualizar los consumos que ya tienen un pago asociado en consumption_payments
-- Marcamos como pagados (2) todos los consumos que ya estén en algún pago aprobado (estado=1)
UPDATE consumptions c
JOIN consumption_payments_details cpd ON c.id = cpd.consumption_id
JOIN consumption_payments cp ON cpd.payment_id = cp.id
SET c.paid = 2
WHERE cp.status = 1;

-- Marcamos como pendientes de aprobación (1) todos los consumos que estén en un pago pendiente (estado=0)
UPDATE consumptions c
JOIN consumption_payments_details cpd ON c.id = cpd.consumption_id
JOIN consumption_payments cp ON cpd.payment_id = cp.id
SET c.paid = 1
WHERE cp.status = 0;

-- Los demás quedarán con el valor predeterminado (0 - No pagados)
