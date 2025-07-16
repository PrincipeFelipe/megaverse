/**
 * Script para migrar console.log a sistema de logging
 * Analiza el proyecto y sugiere migraciones
 */

import { promises as fs } from 'fs';
import path from 'path';

interface LogMigration {
  file: string;
  line: number;
  original: string;
  suggested: string;
  module: string;
  level: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  priority: 'high' | 'medium' | 'low';
}

// Mapeo de patrones a módulos
const modulePatterns = {
  'api.ts': 'API',
  'auth': 'AUTH',
  'user': 'USERS',
  'product': 'PRODUCTS',
  'reservation': 'RESERVATIONS',
  'table': 'TABLES',
  'payment': 'PAYMENTS',
  'expense': 'EXPENSES',
  'notification': 'NOTIFICATIONS',
  'admin': 'ADMIN',
  'blog': 'BLOG',
  'upload': 'UI',
  'document': 'DOCUMENTS',
  'config': 'CONFIG'
};

// Mapeo de patrones a niveles de log
const levelPatterns = {
  'error': 'error',
  'Error': 'error',
  'ERROR': 'error',
  'warn': 'warn',
  'warning': 'warn',
  'Warning': 'warn',
  'debug': 'debug',
  'Debug': 'debug',
  'INFO': 'info',
  'info': 'info',
  'verbose': 'verbose',
  'trace': 'verbose'
};

function detectModule(filePath: string, logContent: string): string {
  // Buscar por nombre de archivo
  for (const [pattern, module] of Object.entries(modulePatterns)) {
    if (filePath.includes(pattern)) {
      return module;
    }
  }
  
  // Buscar por contenido del log
  for (const [pattern, module] of Object.entries(modulePatterns)) {
    if (logContent.toLowerCase().includes(pattern.toLowerCase())) {
      return module;
    }
  }
  
  return 'APP'; // Default module
}

function detectLevel(logContent: string): 'error' | 'warn' | 'info' | 'debug' | 'verbose' {
  // Buscar por tipo de console
  if (logContent.includes('console.error')) return 'error';
  if (logContent.includes('console.warn')) return 'warn';
  if (logContent.includes('console.debug')) return 'debug';
  
  // Buscar por contenido
  for (const [pattern, level] of Object.entries(levelPatterns)) {
    if (logContent.toLowerCase().includes(pattern.toLowerCase())) {
      return level as any;
    }
  }
  
  return 'info'; // Default level
}

function detectPriority(filePath: string): 'high' | 'medium' | 'low' {
  if (filePath.includes('services/api.ts')) return 'high';
  if (filePath.includes('src/services/')) return 'high';
  if (filePath.includes('src/pages/admin/')) return 'medium';
  if (filePath.includes('src/pages/')) return 'medium';
  if (filePath.includes('src/components/')) return 'medium';
  return 'low';
}

function suggestMigration(
  file: string, 
  line: number, 
  original: string
): LogMigration {
  const module = detectModule(file, original);
  const level = detectLevel(original);
  const priority = detectPriority(file);
  
  // Extraer el mensaje del console.log
  const match = original.match(/console\.\w+\(['"`]([^'"`]+)['"`](?:,\s*(.+))?\)/);
  const message = match ? match[1] : 'Log message';
  const data = match && match[2] ? match[2] : null;
  
  let suggested = '';
  if (data) {
    suggested = `apiLogger.${level}('${message}', ${data});`;
  } else {
    suggested = `apiLogger.${level}('${message}');`;
  }
  
  return {
    file,
    line,
    original: original.trim(),
    suggested,
    module,
    level,
    priority
  };
}

// Exportar las migraciones sugeridas para el proyecto actual
const suggestedMigrations: LogMigration[] = [
  // API Services (Alta prioridad)
  {
    file: 'src/services/api.ts',
    line: 154,
    original: "console.log('Respuesta del registro normal:', response.status, response.statusText);",
    suggested: "apiLogger.info('Respuesta de registro recibida', { status: response.status, statusText: response.statusText });",
    module: 'API',
    level: 'info',
    priority: 'high'
  },
  {
    file: 'src/services/api.ts',
    line: 164,
    original: "console.log('🔍 API: Obteniendo perfil del usuario...');",
    suggested: "apiLogger.debug('Obteniendo perfil del usuario');",
    module: 'API',
    level: 'debug',
    priority: 'high'
  },
  {
    file: 'src/services/api.ts',
    line: 168,
    original: "console.error('🔍 API: Error al obtener perfil:', response.status, response.statusText);",
    suggested: "apiLogger.error('Error al obtener perfil', { status: response.status, statusText: response.statusText });",
    module: 'API',
    level: 'error',
    priority: 'high'
  },
  {
    file: 'src/services/api.ts',
    line: 173,
    original: "console.log('🔍 API: Perfil obtenido del servidor:', profileData);",
    suggested: "apiLogger.debug('Perfil obtenido del servidor', { profileData });",
    module: 'API',
    level: 'debug',
    priority: 'high'
  },
  
  // Admin Page (Media prioridad)
  {
    file: 'src/pages/admin/AdminPage.tsx',
    line: 69,
    original: 'console.log("Total de ingresos (cuotas + consumos):", totalIncome);',
    suggested: 'adminLogger.debug("Estadísticas financieras calculadas", { totalIncome, totalExpenses });',
    module: 'ADMIN',
    level: 'debug',
    priority: 'medium'
  },
  {
    file: 'src/pages/admin/AdminPage.tsx',
    line: 98,
    original: "console.error('Error al cargar estadísticas:', error);",
    suggested: "adminLogger.error('Error al cargar estadísticas', { error: error.message, stack: error.stack });",
    module: 'ADMIN',
    level: 'error',
    priority: 'medium'
  }
];

console.log('=== MIGRACIONES SUGERIDAS DE CONSOLE.LOG A SISTEMA DE LOGGING ===\n');

// Agrupar por prioridad
const byPriority = {
  high: suggestedMigrations.filter(m => m.priority === 'high'),
  medium: suggestedMigrations.filter(m => m.priority === 'medium'),
  low: suggestedMigrations.filter(m => m.priority === 'low')
};

Object.entries(byPriority).forEach(([priority, migrations]) => {
  if (migrations.length === 0) return;
  
  console.log(`🔥 PRIORIDAD ${priority.toUpperCase()} (${migrations.length} migraciones):`);
  console.log(''.padEnd(50, '='));
  
  migrations.forEach((migration, index) => {
    console.log(`\n${index + 1}. ${migration.file}:${migration.line}`);
    console.log(`   Módulo: ${migration.module} | Nivel: ${migration.level}`);
    console.log(`   ❌ Actual:   ${migration.original}`);
    console.log(`   ✅ Sugerido: ${migration.suggested}`);
  });
  
  console.log('\n');
});

export default suggestedMigrations;
