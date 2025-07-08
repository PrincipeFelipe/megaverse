# Solución al problema de precios mostrándose como 0.00

Actualmente, existe un problema en la aplicación donde los precios se están mostrando como "0.00" en la interfaz de usuario. Este documento explica la causa raíz del problema y cómo solucionarlo.

## Causa del problema

Los valores de precios que llegan desde el backend pueden venir en diferentes formatos:
- A veces como strings ("12.50")
- A veces como números (12.50)
- A veces con formato europeo usando comas como separador decimal ("12,50")

Además, la función `formatCurrency` en `src/utils/formatters.ts` no está manejando correctamente todos estos casos, especialmente cuando los valores son `undefined`, `null` o strings vacíos.

## Solución recomendada

### 1. Mejorar la función `formatCurrency` en `formatters.ts`

Actualizar la función `formatCurrency` para manejar adecuadamente todos los posibles valores:

```typescript
/**
 * Formatea un precio/cantidad monetaria en euros
 * @param amount - La cantidad a formatear
 * @param includeCurrency - Si debe incluir el símbolo de la moneda (€)
 * @returns La cantidad formateada
 */
export const formatCurrency = (
  amount: number | string | undefined | null, 
  includeCurrency: boolean = true
): string => {
  try {
    // Si es undefined o null, lo tratamos como 0
    if (amount === undefined || amount === null) {
      console.log(`Valor nulo para formatCurrency. Usando 0.`);
      amount = 0;
    }
    
    // Convertir a número si es una cadena
    let numAmount: number;
    
    if (typeof amount === 'string') {
      // Reemplazar comas por puntos en caso de que sea una cadena con formato europeo
      const cleanedAmount = amount.replace(/\./g, '').replace(/,/g, '.');
      numAmount = parseFloat(cleanedAmount);
    } else {
      numAmount = Number(amount);
    }
    
    // Verificar si el valor es válido (no es NaN, undefined o null)
    if (isNaN(numAmount)) {
      console.log(`Valor inválido para formatCurrency: ${amount}, tipo: ${typeof amount}`);
      numAmount = 0;
    }
    
    const formatter = new Intl.NumberFormat('es-ES', {
      style: includeCurrency ? 'currency' : 'decimal',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(numAmount);
  } catch (error) {
    console.error('Error al formatear moneda:', error, 'Valor:', amount);
    return `${amount || 0}€`;
  }
};
```

### 2. Crear función para normalizar datos en los componentes

Implementar la siguiente función en `PendingConsumptions.tsx` y `AllUnpaidConsumptionsAdmin.tsx` para normalizar los valores antes de usarlos:

```typescript
const normalizeConsumptionData = (data) => {
  return data.map(item => {
    // Función auxiliar para convertir a número de manera segura
    const safeParseFloat = (value) => {
      if (value === null || value === undefined) return 0;
      
      if (typeof value === 'number') return value;
      
      if (typeof value === 'string') {
        // Reemplazamos comas por puntos para manejar formato europeo
        const cleanedValue = value.replace(/\./g, '').replace(/,/g, '.');
        const parsedValue = parseFloat(cleanedValue);
        return isNaN(parsedValue) ? 0 : parsedValue;
      }
      
      return Number(value) || 0; // Último recurso
    };
    
    // Extraer valores de manera segura
    const price_per_unit = item && 'price_per_unit' in item ? item.price_per_unit : 0;
    const total_price = item && 'total_price' in item ? item.total_price : 0;
    const quantity = item && 'quantity' in item ? item.quantity : 0;
    
    // Convertimos los valores de manera segura
    return {
      ...item,
      price_per_unit: safeParseFloat(price_per_unit),
      total_price: safeParseFloat(total_price),
      quantity: safeParseFloat(quantity)
    };
  });
};
```

### 3. Aplicar normalización al recibir datos

En ambos componentes, aplicar la normalización a los datos recibidos:

```typescript
// Al cargar datos iniciales
const response = await consumptionPaymentsService.getUnpaidConsumptions(user.id);

if (response && response.consumptions && Array.isArray(response.consumptions)) {
  // Normalizar los datos antes de establecerlos
  const normalizedData = normalizeConsumptionData(response.consumptions);
  setConsumptions(normalizedData);
}
```

### 4. Aplicar normalización al recalcular totales

Al calcular totales, asegúrate de usar los valores ya normalizados:

```typescript
// Ejemplo de cálculo de total
const totalUnpaid = consumptions.reduce((sum, item) => sum + item.total_price, 0);
```

## Verificación

Después de aplicar estos cambios, verifica que:

1. Los precios se muestran correctamente (no como 0.00 a menos que sean realmente cero)
2. No hay errores de NaN en la consola
3. Los totales se calculan correctamente

Si persisten problemas, añade logs adicionales para identificar la fuente exacta del problema:

```typescript
console.log("Datos recibidos del servidor:", response);
console.log("Valor antes de formatCurrency:", item.price_per_unit, typeof item.price_per_unit);
console.log("Valor después de formatCurrency:", formatCurrency(item.price_per_unit));
```
