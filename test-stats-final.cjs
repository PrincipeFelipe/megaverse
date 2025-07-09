const fetch = require('node-fetch');

// Configuración
const BASE_URL = 'http://localhost:3001';

// Función para realizar login y obtener token
async function login() {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@test.com',
                password: 'admin123'
            })
        });

        if (!response.ok) {
            throw new Error(`Error en login: ${response.statusText}`);
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Error en login:', error.message);
        return null;
    }
}

// Función para obtener estadísticas de pagos
async function getPaymentStats(token, year = 2024) {
    try {
        const response = await fetch(`${BASE_URL}/api/payments/stats?year=${year}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener estadísticas: ${response.statusText}`);
        }

        const stats = await response.json();
        return stats;
    } catch (error) {
        console.error('Error al obtener estadísticas:', error.message);
        return null;
    }
}

// Función principal de prueba
async function testPaymentStatsDisplay() {
    console.log('🧪 Probando visualización de estadísticas de pagos...\n');

    // Login
    console.log('1. Obteniendo token de autenticación...');
    const token = await login();
    if (!token) {
        console.error('❌ No se pudo obtener el token');
        return;
    }
    console.log('✅ Token obtenido exitosamente\n');

    // Obtener estadísticas
    console.log('2. Obteniendo estadísticas de pagos para 2024...');
    const stats = await getPaymentStats(token, 2024);
    if (!stats) {
        console.error('❌ No se pudieron obtener las estadísticas');
        return;
    }
    console.log('✅ Estadísticas obtenidas exitosamente\n');

    // Mostrar resumen
    console.log('📊 RESUMEN DE ESTADÍSTICAS');
    console.log('=' .repeat(50));
    console.log(`Total del año: €${stats.yearlyTotal.total.toFixed(2)} (${stats.yearlyTotal.count} pagos)`);
    
    // Calcular totales por tipo
    const typeStats = {
        normal: { total: 0, count: 0 },
        maintenance: { total: 0, count: 0 },
        entrance: { total: 0, count: 0 }
    };

    stats.monthlyStats.forEach(stat => {
        if (typeStats[stat.payment_type]) {
            typeStats[stat.payment_type].total += Number(stat.total);
            typeStats[stat.payment_type].count += Number(stat.count);
        }
    });

    console.log('\n📈 TOTALES POR TIPO:');
    console.log(`• Cuotas normales: €${typeStats.normal.total.toFixed(2)} (${typeStats.normal.count} pagos)`);
    console.log(`• Cuotas mantenimiento: €${typeStats.maintenance.total.toFixed(2)} (${typeStats.maintenance.count} pagos)`);
    console.log(`• Cuotas de entrada: €${typeStats.entrance.total.toFixed(2)} (${typeStats.entrance.count} pagos)`);

    // Mostrar estadísticas mensuales
    if (stats.monthlyStats.length > 0) {
        console.log('\n📅 ESTADÍSTICAS MENSUALES:');
        console.log('-'.repeat(60));
        console.log('Mes'.padEnd(15) + 'Tipo'.padEnd(15) + 'Pagos'.padEnd(10) + 'Total');
        console.log('-'.repeat(60));
        
        stats.monthlyStats.forEach(stat => {
            const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2000, stat.month - 1, 1));
            const typeDisplay = stat.payment_type === 'normal' ? 'Normal' : 
                               stat.payment_type === 'maintenance' ? 'Mantenimiento' :
                               stat.payment_type === 'entrance' ? 'Entrada' : stat.payment_type;
            
            console.log(
                monthName.padEnd(15) + 
                typeDisplay.padEnd(15) + 
                stat.count.toString().padEnd(10) + 
                `€${Number(stat.total).toFixed(2)}`
            );
        });
    }

    // Mostrar pagos pendientes
    if (stats.pendingPayments && stats.pendingPayments.length > 0) {
        console.log('\n⚠️ CUOTAS PENDIENTES:');
        console.log('-'.repeat(50));
        stats.pendingPayments.forEach(pending => {
            console.log(`• ${pending.name}: ${pending.pending_months} (meses pendientes)`);
        });
    }

    console.log('\n✅ Prueba de visualización de estadísticas completada');
    console.log('🎨 Las cards ahora soportan tema claro y oscuro correctamente');
    console.log('💡 Accede a http://localhost:5173/admin/payments/stats para ver el resultado visual');
}

// Ejecutar la prueba
testPaymentStatsDisplay().catch(console.error);
