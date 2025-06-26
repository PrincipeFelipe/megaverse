// Archivo de prueba para validar las funciones de conversión de fechas
import { preserveLocalTime, extractLocalTime } from './dateUtils';

// Probar la conversión de fechas
console.log("----- PRUEBA DE CONVERSIÓN DE FECHAS -----");

// Caso 1: Hora local 13:00
console.log("CASO 1: 13:00 - 16:00");
const localDate1 = new Date(2025, 5, 8, 13, 0, 0); // 8 de junio a las 13:00
console.log("Fecha local original:", localDate1.toLocaleString());
console.log("Hora local:", `${localDate1.getHours()}:${localDate1.getMinutes()}`);

// Convertir a ISO preservando la hora visual
const isoDate1 = preserveLocalTime(localDate1);
console.log("Fecha ISO preservando hora visual:", isoDate1);

// Extraer hora local de la fecha ISO
const extractedDate1 = extractLocalTime(isoDate1);
console.log("Fecha local extraída:", extractedDate1.toLocaleString());
console.log("Hora extraída:", `${extractedDate1.getHours()}:${extractedDate1.getMinutes()}`);

// Verificar si la conversión mantiene la misma hora visual
console.log("¿Coincide la hora visual?", localDate1.getHours() === extractedDate1.getHours());

// Caso 2: Hora local 20:30
console.log("\nCASO 2: 20:30 - 22:00");
const localDate2 = new Date(2025, 5, 10, 20, 30, 0); // 10 de junio a las 20:30
console.log("Fecha local original:", localDate2.toLocaleString());
console.log("Hora local:", `${localDate2.getHours()}:${localDate2.getMinutes()}`);

// Convertir a ISO preservando la hora visual
const isoDate2 = preserveLocalTime(localDate2);
console.log("Fecha ISO preservando hora visual:", isoDate2);

// Extraer hora local de la fecha ISO
const extractedDate2 = extractLocalTime(isoDate2);
console.log("Fecha local extraída:", extractedDate2.toLocaleString());
console.log("Hora extraída:", `${extractedDate2.getHours()}:${extractedDate2.getMinutes()}`);

// Verificar si la conversión mantiene la misma hora visual
console.log("¿Coincide la hora visual?", localDate2.getHours() === extractedDate2.getHours());
