/**
 * Este script agrega el campo price_per_unit a los registros de consumptiones
 * calculándolo a partir del total_price y quantity
 */
import { pool } from '../config/database.js';

const addPricePerUnit = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // 1. Primero obtenemos todos los consumos que no tienen price_per_unit
    const [consumptions] = await connection.query(
      `SELECT c.*, p.price as product_price
       FROM consumptions c
       JOIN products p ON c.product_id = p.id`
    );
    
    console.log(`Encontrados ${consumptions.length} registros de consumos`);
    
    // 2. Para cada consumo, calculamos price_per_unit
    let updatedCount = 0;
    
    for (const consumption of consumptions) {
      // Calculamos el precio unitario: total_price / quantity
      const pricePerUnit = consumption.total_price / consumption.quantity;
      
      // Actualizamos el registro
      const [updateResult] = await connection.query(
        `UPDATE consumptions SET price_per_unit = ? WHERE id = ?`,
        [pricePerUnit, consumption.id]
      );
      
      if (updateResult.affectedRows > 0) {
        updatedCount++;
      }
      
      console.log(`Consumo ID ${consumption.id}: Total ${consumption.total_price} / Cantidad ${consumption.quantity} = Precio unitario ${pricePerUnit}`);
    }
    
    console.log(`Actualizados ${updatedCount} registros con price_per_unit`);
    
    console.log('Proceso completado con éxito');
  } catch (error) {
    console.error('Error al procesar los consumos:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
  
  // Cerramos el pool de conexiones para que el script termine
  pool.end();
};

// Ejecutar el script
addPricePerUnit();
