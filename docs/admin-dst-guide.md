# Guía de Administración para Cambios de Horario (DST)

Esta guía proporciona un procedimiento completo para los administradores del sistema de reservas para asegurar una transición sin problemas durante los cambios de horario.

## Tabla de contenidos
1. [Calendario de cambios de horario](#calendario-de-cambios-de-horario)
2. [Tareas previas al cambio (2 semanas antes)](#tareas-previas-al-cambio-2-semanas-antes)
3. [Tareas inmediatas (1 semana antes)](#tareas-inmediatas-1-semana-antes)
4. [Procedimiento durante el día del cambio](#procedimiento-durante-el-día-del-cambio)
5. [Tareas posteriores al cambio (1-2 días después)](#tareas-posteriores-al-cambio-1-2-días-después)
6. [Solución de problemas comunes](#solución-de-problemas-comunes)
7. [Herramientas de diagnóstico](#herramientas-de-diagnóstico)

## Calendario de cambios de horario

En España y la mayoría de Europa, los cambios de horario ocurren dos veces al año:

**Inicio del horario de verano (CET → CEST)**
- Último domingo de marzo
- A las 2:00 AM, los relojes se adelantan a las 3:00 AM
- El día solo tiene 23 horas

**Fin del horario de verano (CEST → CET)**
- Último domingo de octubre
- A las 3:00 AM, los relojes se retrasan a las 2:00 AM
- El día tiene 25 horas

### Próximos cambios de horario

| Año | Inicio del horario de verano | Fin del horario de verano |
|-----|-------------------------------|----------------------------|
| 2025 | 30 de marzo | 26 de octubre |
| 2026 | 29 de marzo | 25 de octubre |
| 2027 | 28 de marzo | 31 de octubre |
| 2028 | 26 de marzo | 29 de octubre |
| 2029 | 25 de marzo | 28 de octubre |

## Tareas previas al cambio (2 semanas antes)

1. **Actualizar documentación y comunicaciones**
   - Preparar notificaciones para los usuarios
   - Actualizar las páginas de FAQ si es necesario
   - Revisar esta guía de administración para asegurarse de que esté actualizada

2. **Verificar funcionamiento del sistema**
   - Ejecutar pruebas de validación de zona horaria:
     ```powershell
     cd server
     npm run validate-timezone
     ```
   - Verificar que los scripts de transición DST estén actualizados

3. **Programar mantenimiento**
   - Notificar al equipo técnico sobre la fecha del cambio
   - Asegurarse de que alguien esté disponible el día del cambio para solucionar problemas

## Tareas inmediatas (1 semana antes)

1. **Monitorear reservas potencialmente afectadas**
   - Ejecutar el script de monitoreo para identificar reservas en fechas críticas:
     ```powershell
     cd server
     node scripts/dstTransitionMonitor.js
     ```
   - Revisar las reservas marcadas como potencialmente problemáticas

2. **Contactar a usuarios afectados**
   - Para cambio a horario de verano: avisar sobre reservas entre 2:00-3:00 AM (hora inexistente)
   - Para cambio a horario de invierno: aclarar ambigüedades en reservas entre 2:00-3:00 AM (hora repetida)
   - Sugerir cambios de horario si es necesario

3. **Pruebas de simulación**
   - Ejecutar pruebas de transición DST en el entorno de desarrollo:
     ```powershell
     cd src/utils
     ts-node dstTransitionTest.ts
     ```
   - Verificar que todos los casos de prueba pasen correctamente

## Procedimiento durante el día del cambio

1. **Monitoreo inicial (12 horas antes)**
   - Verificar el estado del sistema
   - Ejecutar nuevamente el monitor de transición:
     ```powershell
     cd server
     node scripts/dstTransitionMonitor.js
     ```

2. **Durante el cambio (±2 horas)**
   - Monitorear activamente el sistema
   - Estar atento a errores o comportamientos inesperados
   - Verificar los logs del servidor para detectar posibles problemas

3. **Verificación inmediata (2-3 horas después)**
   - Comprobar que todas las reservas se muestren correctamente
   - Verificar que el sistema esté calculando correctamente los nuevos horarios

## Tareas posteriores al cambio (1-2 días después)

1. **Verificación completa**
   - Ejecutar pruebas de validación:
     ```powershell
     cd server
     npm run validate-timezone
     ```
   - Verificar manualmente algunas reservas en la interfaz de usuario

2. **Corrección de errores (si es necesario)**
   - Si se detectan problemas, utilizar los scripts de corrección:
     ```powershell
     cd server
     npm run fix-timezone-display
     ```

3. **Documentar resultados**
   - Registrar cualquier problema encontrado y su solución
   - Actualizar esta guía si se aprendieron nuevas lecciones
   - Preparar mejoras para el próximo cambio de horario

## Solución de problemas comunes

### 1. Reservas que muestran horas incorrectas

**Síntoma**: Las reservas aparecen con 1 o 2 horas de diferencia respecto a la hora real.

**Solución**:
- Verificar que la función `extractLocalTime()` esté usando el offset correcto
- Ejecutar `npm run fix-timezone-display` para corregir las fechas
- Si persiste, verificar los logs para identificar el problema específico

### 2. Reservas duplicadas o solapadas durante el cambio de horario

**Síntoma**: Aparecen reservas duplicadas o solapadas en el mismo horario.

**Solución**:
- Para el cambio a horario de invierno, revisar manualmente las reservas en la hora que se repite (2:00-3:00 AM)
- Usar la herramienta de administración para ajustar manualmente las reservas afectadas
- Contactar a los usuarios para resolver conflictos

### 3. Errores en los registros o cálculos de tiempo

**Síntoma**: Los logs muestran errores relacionados con fechas o los cálculos de duración son incorrectos.

**Solución**:
- Verificar que se estén usando las utilidades de fecha actualizadas
- Reiniciar el servidor después del cambio de horario
- Ejecutar `npm run validate-timezone` para detectar problemas específicos

## Herramientas de diagnóstico

El sistema incluye las siguientes herramientas para diagnosticar y corregir problemas de zona horaria:

### Scripts del servidor

| Script | Comando | Descripción |
|--------|---------|-------------|
| Validación de zona horaria | `npm run validate-timezone` | Verifica que el sistema maneje correctamente diferentes escenarios de zona horaria |
| Monitor de transición DST | `node scripts/dstTransitionMonitor.js` | Identifica reservas cercanas a fechas de cambio de horario |
| Corrección de visualización | `npm run fix-timezone-display` | Corrige problemas de visualización en reservas existentes |
| Corrección de reservas | `npm run fix-reservations` | Corrige datos erróneos en la base de datos |

### Utilidades cliente

| Utilidad | Ubicación | Descripción |
|----------|-----------|-------------|
| Test de visualización de horas | `src/utils/hourVisualizationTest.ts` | Prueba básica de visualización correcta de horas |
| Validador de zona horaria | `src/utils/timezoneValidator.ts` | Validación completa de múltiples escenarios |
| Test de transición DST | `src/utils/dstTransitionTest.ts` | Pruebas específicas para fechas críticas de cambio de horario |
| Utilidades DST | `src/utils/dstUtils.ts` | Funciones auxiliares para detectar y manejar cambios de horario |

Recuerde documentar cualquier problema encontrado y su solución para mejorar este procedimiento para futuros cambios de horario.
