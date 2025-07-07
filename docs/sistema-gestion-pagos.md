# Sistema de Gestión de Pagos de Consumos

Este documento describe el nuevo sistema de gestión de pagos de consumos implementado en la aplicación.

## Estructura del sistema

El sistema utiliza un enfoque basado en estados para controlar el flujo del pago de consumos:

### 1. Estados de Pago en la tabla `consumptions`

El campo `paid` en la tabla `consumptions` puede tener tres valores:

- **0: No pagado** - El consumo está pendiente de pago
- **1: Pendiente de aprobación** - El usuario ha realizado un pago que incluye este consumo, pero está pendiente de aprobación por un administrador
- **2: Pagado** - El pago ha sido aprobado y el consumo está completamente pagado

### 2. Flujo de trabajo

1. **Registro de consumo**:
   - Cuando un usuario consume un producto, se crea un registro en `consumptions` con `paid = 0`
   - El balance del usuario se actualiza restando el importe del consumo

2. **Registro de pago**:
   - El usuario o un administrador registra un pago
   - Se crea un registro en `consumption_payments` con el estado "pendiente"
   - Los consumos asociados al pago se marcan como `paid = 1` (pendientes de aprobación)
   - Se crean registros en `consumption_payments_details` para asociar cada consumo con el pago

3. **Aprobación de pago**:
   - Un administrador aprueba el pago
   - El estado del pago se actualiza a "aprobado"
   - Los consumos asociados se marcan como `paid = 2` (pagados)

### 3. Visualización para el usuario

El usuario podrá ver:
- Sus consumos pendientes de pago (`paid = 0`)
- Sus consumos en proceso de pago (`paid = 1`)
- Sus consumos pagados (`paid = 2`)
- El importe total pendiente

### 4. Visualización para el administrador

El administrador podrá ver:
- Todos los consumos y su estado de pago
- Pagos pendientes de aprobación
- Historial completo de pagos por usuario

## Detalles técnicos

### Tablas involucradas:

1. **`consumptions`**:
   - Nuevo campo `paid` (TINYINT) con valores 0, 1, 2

2. **`consumption_payments`**:
   - Sin cambios estructurales
   - El campo `status` se sigue utilizando para indicar si el pago está pendiente (0) o aprobado (1)

3. **`consumption_payments_details`** (nueva tabla):
   - Relaciona pagos con consumos específicos
   - Permite saber qué consumos están incluidos en cada pago

### Endpoints API:

1. **Consumos**:
   - `GET /api/consumptions/user/:userId/pending` - Obtener consumos pendientes de un usuario

2. **Pagos**:
   - `POST /api/consumption-payments` - Registrar un nuevo pago (ahora acepta lista de IDs de consumo)
   - `PUT /api/consumption-payments/:paymentId/approve` - Aprobar un pago (solo administradores)

## Cómo funciona la selección de consumos al pagar

Si el usuario especifica consumos al realizar un pago:
- Solo se marcarán como "en proceso de pago" los consumos especificados
- El monto debe ser suficiente para cubrir todos los consumos especificados

Si el usuario no especifica consumos:
- El sistema seleccionará automáticamente los consumos pendientes más antiguos hasta cubrir el monto del pago
- Si el monto no cubre todos los consumos pendientes, se seleccionarán en orden cronológico

## Beneficios del nuevo sistema

1. **Mayor control**: Se puede seguir el estado de cada consumo individual
2. **Transparencia**: Los usuarios pueden ver exactamente qué consumos han pagado o están pendientes
3. **Verificación más sencilla**: Los administradores pueden verificar fácilmente qué consumos están incluidos en cada pago
4. **Conciliación contable**: Facilita la conciliación entre pagos y consumos
