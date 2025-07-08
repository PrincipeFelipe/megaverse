# Corrección de visualización de precios en la aplicación

## Problemas identificados

1. **Precios mostrados como 0.00**: Los precios de los productos no se mostraban correctamente en la interfaz de usuario.
2. **Multiplicación incorrecta**: Los precios totales aparecían multiplicados por 100 (por ejemplo, "4.00" se convertía en 400).
3. **Campo `price_per_unit` faltante**: El backend no proporcionaba el precio unitario de los productos, solo el total.

## Soluciones implementadas

### 1. Corrección de la función `safeParseFloat`

El problema principal estaba en la función de conversión `safeParseFloat`, que eliminaba todos los puntos decimales antes de parsear, convirtiendo por ejemplo "4.00" en "400":

```typescript
// Código anterior (incorrecto)
const cleanedValue = value.replace(/\./g, '').replace(/,/g, '.');
```

Hemos modificado la función para que solo reemplace las comas por puntos (formato europeo a formato americano) sin eliminar los puntos decimales existentes:

```typescript
// Código corregido
const cleanedValue = value.replace(/,/g, '.');
```

### 2. Cálculo del `price_per_unit` cuando no está disponible

Hemos implementado una solución que calcula el precio unitario a partir del precio total y la cantidad cuando el campo `price_per_unit` no está disponible:

```typescript
// Si price_per_unit está ausente, lo calculamos dividiendo el total entre la cantidad
let price_per_unit;
if ('price_per_unit' in item && item.price_per_unit !== undefined) {
  price_per_unit = safeParseFloat(item.price_per_unit);
} else {
  // Evitar división por cero
  price_per_unit = safeQuantity > 0 ? safeTotal / safeQuantity : 0;
}
```

### 3. Modificación del backend para incluir `price_per_unit`

Hemos modificado las consultas SQL en el backend para incluir explícitamente el campo `price_per_unit` utilizando `COALESCE` para calcularlo si no existe:

```sql
COALESCE(c.price_per_unit, c.total_price / c.quantity, p.price) as price_per_unit
```

### 4. Implementación de la ruta `/consumptions/all-unpaid`

Se ha añadido una nueva ruta y controlador para permitir a los administradores obtener todos los consumos no pagados:

```javascript
router.get('/all-unpaid', isAdmin, consumptionController.getAllUnpaidConsumptions);
```

### 5. Script SQL para añadir el campo `price_per_unit` a la tabla `consumptions`

Hemos creado un script SQL que añade el campo `price_per_unit` a la tabla de consumos y actualiza los registros existentes:

```sql
ALTER TABLE consumptions ADD COLUMN price_per_unit DECIMAL(10,2) DEFAULT NULL;
UPDATE consumptions c
JOIN products p ON c.product_id = p.id
SET c.price_per_unit = CASE 
    WHEN c.quantity > 0 THEN c.total_price / c.quantity
    ELSE p.price
END;
```

## Verificación de la solución

Para verificar que la solución funciona correctamente, hemos agregado logs en ambos componentes que muestran:

1. Los datos originales recibidos del servidor
2. Los datos normalizados después de aplicar nuestras conversiones
3. Los valores formateados que se mostrarán en la interfaz

## Próximos pasos

1. Ejecutar el script SQL `add_price_per_unit_column.sql` para añadir el campo a la base de datos
2. Actualizar el resto de los controladores para que siempre incluyan `price_per_unit` en las respuestas
3. Una vez verificado que todo funciona correctamente, eliminar los logs de depuración adicionales
