# Diagnóstico: Consumos con paid=1 Apareciendo en Lista

## Problema
Los consumos con `paid = 1` (en proceso de pago) siguen apareciendo en la lista de "consumos pendientes de pago" del usuario, cuando deberían aparecer solo los que tienen `paid = 0`.

## Pasos para Diagnosticar

### 1. **Verificar que el servidor esté ejecutándose con el código actualizado**

```bash
# En el directorio del servidor
cd "d:\00 - DISEÑO\06 - Varios\Asociación\web\01 - Proyecto1\server"

# Detener procesos existentes
taskkill /f /im node.exe

# Iniciar servidor
node index.js
```

### 2. **Verificar que la ruta esté funcionando**

```bash
# Ejecutar script de prueba
node test_unpaid_route.js
```

**Resultado esperado:** Status 401 (requires authentication) - NO 404

### 3. **Verificar estado en base de datos**

```bash
# Ejecutar script de verificación
node scripts/check_consumptions_debug.js
```

Este script te mostrará:
- Cuántos consumos hay por cada estado (paid = 0, 1, 2)
- Los últimos consumos creados
- Qué consumos devolvería la función para cada usuario

### 4. **Verificar logs del servidor**

Cuando accedas a la página de consumos pendientes, deberías ver en la consola del servidor:

```
🔍 [DEBUG] getUnpaidConsumptions called for userId: X
🔍 [DEBUG] Found N unpaid consumptions (paid = 0) for user X
🔍 [DEBUG] Consumptions: [array de consumos con paid = 0]
```

## Posibles Causas

### A. **Servidor no reiniciado**
- El código actualizado no se está ejecutando
- **Solución:** Reiniciar servidor completamente

### B. **Caché del navegador**
- El frontend está usando una respuesta cacheada
- **Solución:** Hard refresh (Ctrl+F5) o limpiar caché del navegador

### C. **Datos inconsistentes en BD**
- Algunos consumos tienen `paid = 1` pero deberían tener `paid = 0`
- **Solución:** Verificar con el script de debug y corregir manualmente si es necesario

### D. **Frontend usando endpoint incorrecto**
- Poco probable, pero podría estar llamando a otra función
- **Solución:** Verificar en DevTools del navegador qué URL se está llamando

## Verificación Paso a Paso

1. **Ejecuta el script de debug**: `node scripts/check_consumptions_debug.js`
2. **Anota los resultados**: ¿Cuántos consumos hay con `paid = 1`?
3. **Reinicia el servidor**: Asegúrate de que se cargue el código actualizado
4. **Verifica logs**: ¿Aparecen los mensajes de debug cuando cargas la página?
5. **Comprueba en DevTools**: ¿Qué URL se está llamando y qué respuesta devuelve?

## Resultado Esperado

- **Lista de usuario**: Solo consumos con `paid = 0`
- **Logs del servidor**: Confirman que se filtran solo `paid = 0`
- **DevTools**: La respuesta de `/consumptions/unpaid/X` no incluye consumos con `paid = 1`
