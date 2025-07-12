#!/usr/bin/env node

/**
 * Script para limpiar y formatear archivos SQL para phpMyAdmin
 * Uso: node fix-sql-format.js input.sql output.sql
 */

import fs from 'fs';
import path from 'path';

function fixSqlFormat(inputFile, outputFile) {
    try {
        // Leer el archivo original
        let content = fs.readFileSync(inputFile, 'utf8');
        
        console.log('🔧 Limpiando formato SQL...');
        
        // Correcciones más agresivas
        content = content
            // Separar declaraciones SQL que están juntas
            .replace(/;(\s*)(SET|START|CREATE|INSERT|ALTER|DROP|USE)/gi, ';\n\n$2')
            // Limpiar comentarios mal formateados
            .replace(/----+/g, '--')
            .replace(/-- --/g, '--')
            // Limpiar espacios múltiples y saltos de línea
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            // Formatear CREATE TABLE correctamente
            .replace(/CREATE TABLE\s+`([^`]+)`\s*\(/gi, '\nCREATE TABLE `$1` (')
            // Añadir saltos de línea después de comas en CREATE TABLE
            .replace(/,\s*`([^`]+)`/g, ',\n  `$1`')
            // Formatear el cierre de CREATE TABLE
            .replace(/\)\s*ENGINE=/gi, '\n) ENGINE=')
            // Añadir punto y coma al final de CREATE TABLE si no lo tiene
            .replace(/(ENGINE=\w+[^;]*?)(\s*CREATE|\s*INSERT|\s*ALTER|\s*$)/gi, '$1;\n\n$2')
            // Limpiar líneas vacías múltiples
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Formatear comentarios de estructura
            .replace(/-- Estructura de tabla para la tabla/g, '\n-- Estructura de tabla para la tabla')
            // Asegurar que cada CREATE TABLE esté en su propia línea
            .replace(/([;])\s*(CREATE TABLE)/gi, '$1\n\n$2')
            // Limpiar espacios al inicio y final
            .trim();
        
        // Dividir por sentencias y limpiar cada una
        const statements = content.split(/;\s*\n/);
        const cleanStatements = statements.map(stmt => {
            stmt = stmt.trim();
            if (!stmt) return '';
            
            // Si es CREATE TABLE, formatear específicamente
            if (stmt.toUpperCase().includes('CREATE TABLE')) {
                return formatCreateTable(stmt);
            }
            
            return stmt;
        }).filter(stmt => stmt.length > 0);
        
        // Unir todas las sentencias
        content = cleanStatements.join(';\n\n') + (cleanStatements.length > 0 ? ';' : '');
        
        // Escribir el archivo limpio
        fs.writeFileSync(outputFile, content);
        
        console.log(`✅ SQL formateado correctamente:`);
        console.log(`   📄 Archivo original: ${inputFile}`);
        console.log(`   📄 Archivo limpio: ${outputFile}`);
        console.log(`   📊 Tamaño: ${(content.length / 1024).toFixed(2)} KB`);
        console.log(`   📋 Sentencias procesadas: ${cleanStatements.length}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error al procesar el archivo:', error.message);
        return false;
    }
}

function formatCreateTable(stmt) {
    // Extraer nombre de tabla
    const tableMatch = stmt.match(/CREATE TABLE\s+`([^`]+)`/i);
    if (!tableMatch) return stmt;
    
    const tableName = tableMatch[1];
    
    // Extraer la parte entre paréntesis
    const contentMatch = stmt.match(/CREATE TABLE\s+`[^`]+`\s*\((.*)\)\s*ENGINE=/is);
    if (!contentMatch) return stmt;
    
    let tableContent = contentMatch[1];
    
    // Dividir por comas pero respetando paréntesis y comillas
    const columns = [];
    let current = '';
    let inParens = 0;
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < tableContent.length; i++) {
        const char = tableContent[i];
        
        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
        } else if (char === '(' && !inQuotes) {
            inParens++;
        } else if (char === ')' && !inQuotes) {
            inParens--;
        } else if (char === ',' && !inQuotes && inParens === 0) {
            columns.push(current.trim());
            current = '';
            continue;
        }
        
        current += char;
    }
    
    if (current.trim()) {
        columns.push(current.trim());
    }
    
    // Formatear columnas
    const formattedColumns = columns.map(col => '  ' + col.trim()).join(',\n');
    
    // Extraer ENGINE y otras opciones
    const engineMatch = stmt.match(/ENGINE=.*$/i);
    const enginePart = engineMatch ? engineMatch[0] : 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci';
    
    return `CREATE TABLE \`${tableName}\` (\n${formattedColumns}\n) ${enginePart}`;
}

// Ejecutar el script
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('📋 Uso: node fix-sql-format.js <archivo_entrada.sql> <archivo_salida.sql>');
    console.log('📋 Ejemplo: node fix-sql-format.js db_megaverse.sql db_megaverse_fixed.sql');
    process.exit(1);
}

const [inputFile, outputFile] = args;

if (!fs.existsSync(inputFile)) {
    console.error(`❌ El archivo ${inputFile} no existe`);
    process.exit(1);
}

const success = fixSqlFormat(inputFile, outputFile);
process.exit(success ? 0 : 1);
