# Corrección del Error de Rechazo de Pagos

## Problema Identificado

Al intentar rechazar un pago desde el panel de administración, se producía un error 400 con el mensaje:
```
Error: Debe proporcionar una razón para rechazar el pago
```

## Causas del Error

1. **Falta de interfaz para ingresar motivo**: El componente frontend no solicitaba al usuario que ingresara una razón específica para rechazar el pago.

2. **Inconsistencia en nombres de campos**: 
   - Frontend enviaba: `rejection_reason`
   - Backend validación esperaba: `rejectionReason`
   - Backend controlador esperaba: `rejectionReason`

## Soluciones Implementadas

### 1. Frontend - Modal de Rechazo (`PendingPaymentsAdmin.tsx`)

**Agregado:**
- Estados para manejar el modal de rechazo: `showRejectModal`, `rejectionReason`
- Función `confirmRejectPayment()` que valida y envía la razón
- Modal emergente que solicita al usuario escribir la razón del rechazo
- Validación que requiere texto antes de permitir el envío

**Flujo actualizado:**
1. Usuario hace clic en "Rechazar" → Se abre modal
2. Usuario escribe la razón del rechazo → Se habilita botón
3. Usuario confirma → Se envía al backend con la razón

### 2. Backend - Consistencia de Campos

**Archivo:** `server/controllers/consumptionPayments.js`
- Cambiado `rejectionReason` → `rejection_reason` en línea 490
- Actualizada variable en consulta SQL en línea 536

**Archivo:** `server/routes/consumptionPayments.js`
- Cambiado validación de `rejectionReason` → `rejection_reason` en línea 46

## Resultado

✅ **Antes**: Error 400 al rechazar pagos
✅ **Después**: 
- Modal solicita razón específica del rechazo
- Validación tanto en frontend como backend
- Rechazo exitoso con motivo almacenado en BD
- Experiencia de usuario mejorada

## Campos de Base de Datos Afectados

La tabla `consumption_payments` almacena la razón en:
- Campo: `rejection_reason` (TEXT)
- Se rellena cuando `status = 'rechazado'`
- Visible en detalles del pago para futuras referencias

## Pruebas Recomendadas

1. Intentar rechazar un pago sin escribir motivo → Debe mostrar error
2. Rechazar pago con motivo válido → Debe funcionar correctamente
3. Verificar que el motivo se guarde en la base de datos
4. Confirmar que el pago cambie a estado "rechazado"
5. Verificar que el balance del usuario se ajuste correctamente
