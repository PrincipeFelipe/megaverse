-- Script para verificar el estado de los consumos en la base de datos
USE db_megaverse;

-- Verificar todos los consumos y sus estados
SELECT 
    c.id,
    c.user_id,
    p.name as product_name,
    c.quantity,
    c.total_price,
    c.paid,
    CASE 
        WHEN c.paid = 0 THEN 'sin_pagar'
        WHEN c.paid = 1 THEN 'en_proceso'
        WHEN c.paid = 2 THEN 'pagado'
        ELSE 'desconocido'
    END as estado_pago,
    c.created_at
FROM consumptions c
JOIN products p ON c.product_id = p.id
ORDER BY c.user_id, c.created_at DESC;

-- Contar consumos por estado
SELECT 
    paid,
    CASE 
        WHEN paid = 0 THEN 'sin_pagar'
        WHEN paid = 1 THEN 'en_proceso'
        WHEN paid = 2 THEN 'pagado'
        ELSE 'desconocido'
    END as estado,
    COUNT(*) as cantidad
FROM consumptions
GROUP BY paid
ORDER BY paid;
