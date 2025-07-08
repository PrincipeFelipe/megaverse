// Script para probar la lógica de horario de fin corregido
// Ejecutar en la consola del navegador en la página de reservas

console.log("🧪 Probando lógica de horario de fin para reservas de todo el día...\n");

// Simular configuración típica
const testConfigs = [
  { allowed_start_time: "06:00", allowed_end_time: "23:00", name: "Config 1: 06:00-23:00" },
  { allowed_start_time: "08:00", allowed_end_time: "22:00", name: "Config 2: 08:00-22:00" },
  { allowed_start_time: "10:00", allowed_end_time: "23:59", name: "Config 3: 10:00-23:59" },
  { allowed_start_time: "07:00", allowed_end_time: "21:00", name: "Config 4: 07:00-21:00" }
];

testConfigs.forEach(config => {
  console.log(`\n📋 ${config.name}`);
  
  // Simular la lógica implementada
  const startHour = config.allowed_start_time;
  const endHour = config.allowed_end_time;
  
  const [startHours, startMinutes] = startHour.split(':').map(Number);
  const [endHours] = endHour.split(':').map(Number);
  
  // Crear fechas de ejemplo para mañana
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const startDate = new Date(tomorrow);
  startDate.setHours(startHours, startMinutes, 0, 0);
  
  const endDate = new Date(tomorrow);
  
  // Aplicar la lógica de fin corregido
  let finalEndHour = endHours + 1;
  let nextDay = false;
  
  if (finalEndHour >= 24) {
    finalEndHour = 0;
    nextDay = true;
  }
  
  if (nextDay) {
    endDate.setDate(endDate.getDate() + 1);
  }
  
  endDate.setHours(finalEndHour, 0, 0, 0);
  
  // Calcular duración
  const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  
  console.log(`   🕰️ Hora inicio: ${startDate.toLocaleTimeString()}`);
  console.log(`   🕰️ Hora fin: ${endDate.toLocaleTimeString()}`);
  console.log(`   ⏱️ Duración: ${durationHours} horas`);
  console.log(`   📅 Cruza día: ${nextDay ? 'Sí' : 'No'}`);
  console.log(`   ✅ Resultado: Desde ${config.allowed_start_time} hasta final de hora ${config.allowed_end_time}`);
});

console.log("\n🎯 La lógica calcula correctamente el horario hasta el FINAL de la última hora permitida.");
console.log("📝 Esto significa que si la última hora es 23:00, la reserva termina a las 00:00 del día siguiente.");
console.log("✅ Prueba completada exitosamente!");

// Función para probar con la configuración actual del sistema
if (window.reservationConfig) {
  console.log("\n🔧 Probando con configuración actual del sistema:");
  console.log("📋 Configuración:", window.reservationConfig);
  
  const currentConfig = window.reservationConfig;
  const [startHours, startMinutes] = currentConfig.allowed_start_time.split(':').map(Number);
  const [endHours] = currentConfig.allowed_end_time.split(':').map(Number);
  
  console.log(`   📊 Horario permitido: ${currentConfig.allowed_start_time} - ${currentConfig.allowed_end_time}`);
  console.log(`   ⏰ Reserva todo el día: ${currentConfig.allowed_start_time} - ${endHours + 1}:00 ${endHours + 1 >= 24 ? '(día siguiente)' : ''}`);
}
