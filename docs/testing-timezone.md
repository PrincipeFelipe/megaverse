# Configurando Jest para pruebas unitarias

Este documento explica cómo configurar y ejecutar las pruebas unitarias para el manejo de zonas horarias usando Jest.

## Instalación de dependencias

Para ejecutar las pruebas unitarias, primero necesitas instalar Jest y las dependencias relacionadas:

```bash
npm install --save-dev jest @types/jest ts-jest
```

## Configuración de Jest

Crea un archivo `jest.config.js` en la raíz del proyecto:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['js', 'ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
```

## Scripts de prueba

Añade los siguientes scripts en tu `package.json`:

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## Ejecutando las pruebas

Para ejecutar todas las pruebas:

```bash
npm test
```

Para ejecutar pruebas específicas:

```bash
npm test -- tests/dst-utils.test.ts
```

## Pruebas disponibles

Hemos creado dos conjuntos de pruebas unitarias:

1. **dst-utils.test.ts**: Prueba las funciones auxiliares para detección de DST
   - `isDaylightSavingTime`
   - `getHourOffsetForDate`
   - `getTimeZoneName`
   - `getNextDSTTransition`
   - `isNearDSTTransition`
   - `checkDSTIssue`

2. **date-utils.test.ts**: Prueba las funciones principales de manipulación de fechas
   - `createUTCDate`
   - `preserveLocalTime`
   - `extractLocalTime`
   - `formatLocalTime`

## Detalles de las pruebas

Las pruebas cubren los siguientes escenarios:

- Detección correcta de horario de verano e invierno
- Cálculo del offset horario adecuado según la fecha
- Preservación de horas visuales al convertir entre formatos
- Identificación de fechas cercanas a transiciones DST
- Detección de horas problemáticas durante cambios de horario
- Ida y vuelta de conversiones (local → ISO → local)

## Generando informes de cobertura

Para generar un informe detallado de cobertura:

```bash
npm run test:coverage
```

Esto creará un directorio `coverage` con un informe HTML detallado.
