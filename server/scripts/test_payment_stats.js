/**
 * Script para probar las estadísticas de pagos con cuotas de entrada
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090/api';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

async function testPaymentStats() {
  try {
    // 1. Login
    console.log('🔐 Haciendo login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
    });

    const { token } = await loginResponse.json();
    console.log('✅ Login exitoso');

    // 2. Obtener estadísticas de pagos
    console.log('📊 Obteniendo estadísticas de pagos...');
    const statsResponse = await fetch(`${BASE_URL}/payments/stats?year=2025`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const statsData = await statsResponse.json();
    console.log('✅ Estadísticas obtenidas');

    // 3. Analizar datos por tipo de pago
    console.log('\n📈 ANÁLISIS DE ESTADÍSTICAS MENSUALES:');
    console.log(`Total anual: €${statsData.yearlyTotal.total} (${statsData.yearlyTotal.count} pagos)`);

    // Agrupar por tipo de pago
    const byType = {
      normal: { total: 0, count: 0 },
      maintenance: { total: 0, count: 0 },
      entrance: { total: 0, count: 0 }
    };

    statsData.monthlyStats.forEach(stat => {
      if (byType[stat.payment_type]) {
        byType[stat.payment_type].total += Number(stat.total);
        byType[stat.payment_type].count += Number(stat.count);
      }
    });

    console.log('\n💰 RESUMEN POR TIPO:');
    console.log(`🔵 Cuotas normales: €${byType.normal.total.toFixed(2)} (${byType.normal.count} pagos)`);
    console.log(`🟣 Cuotas mantenimiento: €${byType.maintenance.total.toFixed(2)} (${byType.maintenance.count} pagos)`);
    console.log(`🟠 Cuotas de entrada: €${byType.entrance.total.toFixed(2)} (${byType.entrance.count} pagos)`);

    // 4. Mostrar datos mensuales detallados
    console.log('\n📅 DESGLOSE MENSUAL:');
    statsData.monthlyStats.forEach(stat => {
      const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2000, stat.month - 1, 1));
      const typeLabel = stat.payment_type === 'normal' ? 'Normal' :
                       stat.payment_type === 'maintenance' ? 'Mantenimiento' :
                       stat.payment_type === 'entrance' ? 'Entrada' :
                       stat.payment_type;
      
      console.log(`${monthName} - ${typeLabel}: €${stat.total} (${stat.count} pagos)`);
    });

    // 5. Verificar cuotas pendientes
    console.log(`\n⏰ CUOTAS PENDIENTES: ${statsData.pendingPayments.length} usuarios`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPaymentStats();
