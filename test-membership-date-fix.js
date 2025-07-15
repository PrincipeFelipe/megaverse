#!/usr/bin/env node

/**
 * Script para probar la corrección del formato de fecha membership_date
 * Ejecutar: node test-membership-date-fix.js
 */

console.log('🧪 Test: Corrección de formato membership_date');
console.log('================================================');

// Simular datos de entrada problemáticos
const testCases = [
  {
    name: 'Fecha ISO completa con timezone',
    input: '2025-07-03T22:00:00.000Z',
    expected: '2025-07-03'
  },
  {
    name: 'Fecha ISO sin timezone',
    input: '2025-07-03T10:30:00',
    expected: '2025-07-03'
  },
  {
    name: 'Fecha ya en formato correcto',
    input: '2025-07-03',
    expected: '2025-07-03'
  },
  {
    name: 'Fecha vacía',
    input: '',
    expected: null
  },
  {
    name: 'Fecha inválida',
    input: 'fecha-invalida',
    expected: null
  },
  {
    name: 'Undefined',
    input: undefined,
    expected: null
  }
];

// Función de formateo (idéntica a la implementada en el código)
function formatMembershipDate(membership_date) {
  if (membership_date !== undefined) {
    if (membership_date && membership_date.trim() !== '') {
      try {
        // Si es una fecha ISO completa, extraer solo la parte de fecha YYYY-MM-DD
        let formattedDate = membership_date;
        if (formattedDate.includes('T')) {
          formattedDate = formattedDate.split('T')[0];
        }
        // Verificar que sea una fecha válida
        const date = new Date(formattedDate);
        if (!isNaN(date.getTime())) {
          return formattedDate;
        } else {
          return null;
        }
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
  }
  return null;
}

// Ejecutar tests
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = formatMembershipDate(testCase.input);
  const success = result === testCase.expected;
  
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log(`  Input:    ${JSON.stringify(testCase.input)}`);
  console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
  console.log(`  Result:   ${JSON.stringify(result)}`);
  console.log(`  Status:   ${success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (success) {
    passed++;
  } else {
    failed++;
  }
});

console.log('\n================================================');
console.log(`📊 Resumen: ${passed} tests pasados, ${failed} tests fallidos`);
console.log(failed === 0 ? '🎉 ¡Todos los tests pasaron!' : '💥 Algunos tests fallaron');

// Test adicional: formato MySQL
console.log('\n🔍 Test adicional: Formato MySQL');
const mysqlFormatTest = '2025-07-03T22:00:00.000Z';
const mysqlResult = formatMembershipDate(mysqlFormatTest);
console.log(`Fecha ISO: ${mysqlFormatTest}`);
console.log(`Formato MySQL: ${mysqlResult}`);
console.log(`¿Válido para MySQL DATE?: ${/^\d{4}-\d{2}-\d{2}$/.test(mysqlResult) ? '✅ SÍ' : '❌ NO'}`);
