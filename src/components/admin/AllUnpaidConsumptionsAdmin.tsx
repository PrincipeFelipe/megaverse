import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { consumptionPaymentsService } from '../../services/consumptionPaymentsService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { showError } from '../../utils/alerts';

interface UnpaidConsumption {
  id: number;
  user_id: number;
  user_name: string;
  product_id: number;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  created_at: string;
  paid: number;
}

const AllUnpaidConsumptionsAdmin: React.FC = () => {
  const { user } = useAuth();
  const [allUnpaidConsumptions, setAllUnpaidConsumptions] = useState<UnpaidConsumption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  
  // Cargar todos los consumos no pagados
  useEffect(() => {
    const loadAllUnpaidConsumptions = async () => {
      if (!user || user.role !== 'admin') return;
      
      try {
        setLoading(true);
        const response = await consumptionPaymentsService.getAllUnpaidConsumptions();
        
        // Agregamos logs de depuración
        console.log("Respuesta de consumos (admin):", response);
        
        if (Array.isArray(response)) {
          // Verificar los primeros elementos para depurar
          if (response.length > 0) {
            console.log("Ejemplo de consumo (admin):", response[0]);
            console.log("Tipo de price_per_unit (admin):", typeof response[0].price_per_unit);
            console.log("Valor de price_per_unit (admin):", response[0].price_per_unit);
          }
          
          // Normalizar los datos antes de establecerlos
          const normalizedData = normalizeConsumptionData(response);
          setAllUnpaidConsumptions(normalizedData);
        } else if (response && Array.isArray(response.consumptions)) {
          // Verificar los primeros elementos para depurar
          if (response.consumptions.length > 0) {
            console.log("Ejemplo de consumo (admin - object response):", response.consumptions[0]);
            console.log("Tipo de price_per_unit (admin - object response):", typeof response.consumptions[0].price_per_unit);
            console.log("Valor de price_per_unit (admin - object response):", response.consumptions[0].price_per_unit);
          }
          
          // Normalizar los datos antes de establecerlos
          const normalizedData = normalizeConsumptionData(response.consumptions);
          setAllUnpaidConsumptions(normalizedData);
        } else {
          setAllUnpaidConsumptions([]);
        }
      } catch (error) {
        console.error('Error al cargar consumos pendientes:', error);
        showError('Error', 'No se pudieron cargar los consumos pendientes de todos los usuarios');
      } finally {
        setLoading(false);
      }
    };
    
    loadAllUnpaidConsumptions();
  }, [user]);

  // Función para normalizar los datos de consumo
  const normalizeConsumptionData = (data: any[]): UnpaidConsumption[] => {
    return data.map(item => {
      // Función auxiliar para convertir a número de manera segura
      const safeParseFloat = (value: unknown): number => {
        if (value === null || value === undefined) return 0;
        
        if (typeof value === 'number') return value;
        
        if (typeof value === 'string') {
          // Solo reemplazamos comas por puntos (formato europeo a formato americano)
          // pero dejamos los puntos decimales existentes
          const cleanedValue = value.replace(/,/g, '.');
          const parsedValue = parseFloat(cleanedValue);
          return isNaN(parsedValue) ? 0 : parsedValue;
        }
        
        return Number(value) || 0; // Último recurso
      };
      
      // Log detallado de cada consumo para debug
      const itemId = typeof item === 'object' && item !== null ? item.id : 'desconocido';
      console.log(`Consumo ID ${itemId} - datos originales (admin):`, {
        valor_original: item,
        tipo_original: typeof item
      });
      
      // Verificar si el item es un objeto válido
      if (typeof item !== 'object' || item === null) {
        console.error('Item inválido en normalizeConsumptionData:', item);
        return {} as UnpaidConsumption; // Devolver un objeto vacío como fallback
      }
      
      // Extraer valores de manera segura
      const total_price = 'total_price' in item ? item.total_price : 0;
      const quantity = 'quantity' in item ? item.quantity : 0;
      
      // Convertimos los valores de manera segura
      const safeTotal = safeParseFloat(total_price);
      const safeQuantity = safeParseFloat(quantity);
      
      // Si price_per_unit está ausente, lo calculamos dividiendo el total entre la cantidad
      let price_per_unit;
      if ('price_per_unit' in item && item.price_per_unit !== undefined) {
        price_per_unit = safeParseFloat(item.price_per_unit);
      } else {
        // Evitar división por cero
        price_per_unit = safeQuantity > 0 ? safeTotal / safeQuantity : 0;
        console.log(`Calculando price_per_unit para ID ${item.id} (admin): ${safeTotal} / ${safeQuantity} = ${price_per_unit}`);
      }
      
      const normalizedItem = {
        ...item,
        price_per_unit: price_per_unit,
        total_price: safeTotal,
        quantity: safeQuantity
      };
      
      // Log de los valores normalizados para verificar
      console.log(`Consumo ID ${itemId} - datos normalizados (admin):`, {
        price_per_unit: normalizedItem.price_per_unit,
        total_price: normalizedItem.total_price,
        quantity: normalizedItem.quantity,
        formateados: {
          price_per_unit: formatCurrency(normalizedItem.price_per_unit),
          total_price: formatCurrency(normalizedItem.total_price)
        }
      });
      
      return normalizedItem as UnpaidConsumption;
    });
  };

  // Agrupar consumos por usuario
  const groupConsumptionsByUser = () => {
    const grouped: { [userId: number]: { 
      userName: string, 
      consumptions: UnpaidConsumption[], 
      total: number 
    }} = {};
    
    if (Array.isArray(allUnpaidConsumptions)) {
      allUnpaidConsumptions.forEach(consumption => {
        if (!grouped[consumption.user_id]) {
          grouped[consumption.user_id] = {
            userName: consumption.user_name || `Usuario ID: ${consumption.user_id}`,
            consumptions: [],
            total: 0
          };
        }
        grouped[consumption.user_id].consumptions.push(consumption);
        grouped[consumption.user_id].total += typeof consumption.total_price === 'number' 
          ? consumption.total_price 
          : parseFloat(consumption.total_price) || 0;
      });
    }
    
    return grouped;
  };

  // Filtrar consumos
  const filteredConsumptions = allUnpaidConsumptions.filter(consumption => {
    const matchesUser = filterUser === '' || 
      (consumption.user_name && consumption.user_name.toLowerCase().includes(filterUser.toLowerCase()));
    
    const matchesProduct = filterProduct === '' || 
      (consumption.product_name && consumption.product_name.toLowerCase().includes(filterProduct.toLowerCase()));
    
    return matchesUser && matchesProduct;
  });

  // Calcular total de consumos no pagados
  const totalUnpaid = filteredConsumptions.reduce((sum, item) => {
    const itemPrice = typeof item.total_price === 'number' 
      ? item.total_price 
      : parseFloat(item.total_price) || 0;
    return sum + itemPrice;
  }, 0);

  // Agrupar consumos por usuario para la visualización
  const groupedByUser = groupConsumptionsByUser();

  return (
    <div>
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filtrar por usuario
          </label>
          <input
            type="text"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            placeholder="Nombre de usuario..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filtrar por producto
          </label>
          <input
            type="text"
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            placeholder="Nombre de producto..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : allUnpaidConsumptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay consumos pendientes de pago en el sistema
        </div>
      ) : filteredConsumptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No se encontraron consumos que coincidan con los filtros
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-md flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-300">Total pendiente:</span>
              <span className="ml-2 text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalUnpaid)}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredConsumptions.length} consumo(s) pendiente(s)
            </div>
          </div>

          {/* Lista agrupada por usuario */}
          <div className="space-y-6">
            {Object.entries(groupedByUser).map(([userId, userData]) => (
              <div key={userId} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {userData.userName}
                  </h3>
                  <span className="text-md font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(userData.total)}
                  </span>
                </div>
                
                {/* Tabla de consumos del usuario */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {userData.consumptions.filter(consumption => {
                        const matchesProductFilter = filterProduct === '' || 
                          (consumption.product_name && consumption.product_name.toLowerCase().includes(filterProduct.toLowerCase()));
                        return matchesProductFilter;
                      }).map(consumption => (
                        <tr key={consumption.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {formatDateTime(consumption.created_at)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-300">
                            {consumption.product_name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {consumption.quantity}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(consumption.price_per_unit)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-300">
                            {formatCurrency(consumption.total_price)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              consumption.paid === 0 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {consumption.paid === 0 ? 'Pendiente' : 'Procesando'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AllUnpaidConsumptionsAdmin;
