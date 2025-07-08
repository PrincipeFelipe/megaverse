# Implementación de Cuota de Entrada

## Descripción del Cambio

Se ha implementado un nuevo campo "cuota de entrada" en la configuración del sistema que permite establecer una tarifa única que pagan los nuevos miembros al registrarse en la asociación.

## Cambios Realizados

### 1. Base de Datos

**Tabla `reservation_config`**
- ✅ Agregado campo `entrance_fee DECIMAL(10, 2) DEFAULT 50.00`
- ✅ Campo incluye comentario explicativo: "Cuota de entrada única para nuevos miembros (€)"

**Scripts de migración:**
- `server/scripts/add_entrance_fee_column.sql` - Script SQL directo
- `server/scripts/add_entrance_fee_column.js` - Script de migración automática
- `server/scripts/check_entrance_fee.js` - Script de verificación (ejecutado exitosamente)

### 2. Backend

**Controlador `server/controllers/config.js`**
- ✅ Agregado manejo del campo `entrance_fee` en `getReservationConfig()`
- ✅ Incluido `entrance_fee` en la creación por defecto (valor: €50.00)
- ✅ Agregado procesamiento del campo en `updateReservationConfig()`

### 3. Frontend - Tipos TypeScript

**`src/types/configuration.ts`**
- ✅ Agregado `entrance_fee: number` al interface `ReservationConfig`

**`src/types/payments.ts`**
- ✅ Extendido `payment_type` para incluir `'entrance'` en `Payment`
- ✅ Extendido `payment_type` para incluir `'entrance'` en `PaymentFormData`

### 4. Frontend - Configuración del Sistema

**`src/pages/admin/ReservationConfigPage.tsx`**
- ✅ Agregado estado `entranceFee` para manejar el nuevo campo
- ✅ Inicialización del campo desde la configuración cargada
- ✅ Incluido en los valores por defecto (€50.00)
- ✅ Agregado al formulario de envío
- ✅ Incluido en la validación del formulario
- ✅ Nuevo campo HTML en la sección "Configuración de Cuotas":
  - Label: "Cuota de entrada (€)"
  - Tipo: number con decimales
  - Descripción: "Cuota única que pagan los nuevos miembros al registrarse"
  - Grid actualizado de 2 a 3 columnas para acomodar el nuevo campo

### 5. Frontend - Gestión de Pagos

**`src/pages/admin/payments/PaymentForm.tsx`**
- ✅ Actualizado cálculo automático de importe para incluir `entrance_fee`
- ✅ Agregada opción "Entrada" en el select de tipo de cuota
- ✅ Lógica de asignación automática de importe según tipo:
  - Normal → `config.normal_fee`
  - Mantenimiento → `config.maintenance_fee`
  - Entrada → `config.entrance_fee`

## Estructura Visual Actualizada

### Panel de Configuración
```
Configuración de Cuotas
┌─────────────────┬─────────────────┬─────────────────┐
│ Cuota mensual   │ Cuota mensual   │ Cuota de        │
│ normal (€)      │ mantenimiento   │ entrada (€)     │
│                 │ (€)             │                 │
│ [    30.00   ]  │ [    15.00   ]  │ [    50.00   ]  │
│                 │                 │                 │
│ Cantidad mensual│ Cantidad mensual│ Cuota única que │
│ a pagar por los │ a pagar por los │ pagan los nuevos│
│ usuarios con    │ usuarios con    │ miembros al     │
│ cuota normal.   │ cuota de        │ registrarse.    │
│                 │ mantenimiento.  │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

### Formulario de Pagos
```
Tipo de cuota
┌─────────────────┐
│ [✓] Normal      │
│ [ ] Mantenimiento
│ [ ] Entrada     │ ← NUEVO
└─────────────────┘
```

## Valores por Defecto

- **Cuota Normal:** €50.00 (actualizada desde €30.00)
- **Cuota Mantenimiento:** €10.00 (actualizada desde €15.00)  
- **Cuota Entrada:** €50.00 (nuevo campo)

## Estado Actual

✅ **Migración de base de datos:** Completada exitosamente
✅ **Backend:** Configurado para manejar el nuevo campo
✅ **Frontend - Configuración:** Implementado y funcional
✅ **Frontend - Pagos:** Actualizado para incluir opción de entrada
✅ **Tipos TypeScript:** Actualizados con nueva opción

## Uso de la Funcionalidad

### Para Administradores

1. **Configurar la cuota de entrada:**
   - Ir a "Panel Admin" → "Configuración"
   - En la sección "Configuración de Cuotas"
   - Ajustar el valor en "Cuota de entrada (€)"
   - Guardar configuración

2. **Registrar pago de cuota de entrada:**
   - Ir a "Gestión Económica" → "Registrar Nueva Cuota"
   - Seleccionar usuario
   - En "Tipo de cuota" elegir "Entrada"
   - El importe se establecerá automáticamente según la configuración
   - Completar datos y guardar

### Casos de Uso

- **Nuevo miembro:** Al registrarse, debe pagar la cuota de entrada una sola vez
- **Administración:** Puede registrar estos pagos y hacer seguimiento
- **Flexibilidad:** El importe es configurable desde el panel de administración

## Próximos Pasos Posibles

1. **Automatización:** Integrar con el proceso de registro de nuevos usuarios
2. **Reportes:** Incluir cuotas de entrada en estadísticas y reportes
3. **Validaciones:** Evitar duplicar pagos de entrada para el mismo usuario
4. **Notificaciones:** Alertar sobre cuotas de entrada pendientes

## Archivos Modificados

### Backend
- `server/controllers/config.js`
- `server/scripts/add_entrance_fee_column.sql`
- `server/scripts/add_entrance_fee_column.js`
- `server/scripts/check_entrance_fee.js`

### Frontend
- `src/types/configuration.ts`
- `src/types/payments.ts`
- `src/pages/admin/ReservationConfigPage.tsx`
- `src/pages/admin/payments/PaymentForm.tsx`

### Documentación
- `docs/implementacion-cuota-entrada.md` (este archivo)

## Verificación

La funcionalidad está lista para ser probada:

1. ✅ Base de datos actualizada con campo `entrance_fee`
2. ✅ Configuración del sistema incluye el nuevo campo
3. ✅ Formulario de pagos permite seleccionar "Entrada"
4. ✅ Los tipos TypeScript están actualizados
5. ✅ No hay errores de compilación

**¡La implementación está completa y lista para uso!** 🎉
