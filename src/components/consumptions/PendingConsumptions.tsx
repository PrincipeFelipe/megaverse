import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  consumptionPaymentsService, 
  Consumption,
  UnpaidConsumptionsResponse 
} from '../../services/consumptionPaymentsService';
import { showSuccess, showError, showConfirm } from '../../utils/alerts';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PendingConsumptions: React.FC = () => {
  const { user } = useAuth();
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('transferencia');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  
  // Cargar consumos pendientes de pago
  useEffect(() => {
    const loadUnpaidConsumptions = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await consumptionPaymentsService.getUnpaidConsumptions(user.id);
        
        // Asegurarnos de que la respuesta tiene la estructura esperada
        if (response && response.consumptions && Array.isArray(response.consumptions)) {
          console.log("Consumos recibidos:", response.consumptions);
          
          // Verificar los primeros elementos para depurar
          if (response.consumptions.length > 0) {
            console.log("Ejemplo de consumo:", response.consumptions[0]);
            console.log("Tipo de price_per_unit:", typeof response.consumptions[0].price_per_unit);
            console.log("Valor de price_per_unit:", response.consumptions[0].price_per_unit);
          }
          
          // Aplicamos la función de normalización para asegurar datos consistentes
          const normalizedData = normalizeConsumptionData(response.consumptions);
          setConsumptions(normalizedData);
        } else {
          setConsumptions([]);
          console.error('Formato de respuesta inesperado:', response);
        }
      } catch (error) {
        console.error('Error al cargar consumos pendientes:', error);
        showError('Error', 'No se pudieron cargar los consumos pendientes de pago');
        setConsumptions([]); // Asegurar que siempre sea un array
      } finally {
        setLoading(false);
      }
    };
    
    loadUnpaidConsumptions();
  }, [user]);

  // Función para inspeccionar y convertir los datos recibidos del servidor si es necesario
  const normalizeConsumptionData = (data: any[]): Consumption[] => {
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
      const itemId = typeof item === 'object' && item !== null && 'id' in item ? item.id : 'desconocido';
      console.log(`Consumo ID ${itemId} - datos originales:`, {
        valor_original: item,
        tipo_original: typeof item
      });
      
      // Verificar si el item es un objeto válido
      if (typeof item !== 'object' || item === null) {
        console.error('Item inválido en normalizeConsumptionData:', item);
        return {} as Consumption; // Devolver un objeto vacío como fallback
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
        console.log(`Calculando price_per_unit para ID ${item.id}: ${safeTotal} / ${safeQuantity} = ${price_per_unit}`);
      }
      
      const normalizedItem = {
        ...item,
        price_per_unit: price_per_unit,
        total_price: safeTotal,
        quantity: safeQuantity
      };
      
      // Log de los valores normalizados para verificar
      console.log(`Consumo ID ${itemId} - datos normalizados:`, {
        price_per_unit: normalizedItem.price_per_unit,
        total_price: normalizedItem.total_price,
        quantity: normalizedItem.quantity,
        formateados: {
          price_per_unit: formatCurrency(normalizedItem.price_per_unit),
          total_price: formatCurrency(normalizedItem.total_price)
        }
      });
      
      return normalizedItem as Consumption;
    });
  };

  // Calcular el total seleccionado
  const calculateSelectedTotal = (): number => {
    return consumptions
      .filter(item => selectedIds.includes(item.id))
      .reduce((sum, item) => {
        // Asegurar que total_price sea un número válido
        const itemPrice = typeof item.total_price === 'number' 
          ? item.total_price 
          : parseFloat(item.total_price) || 0;
        return sum + itemPrice;
      }, 0);
  };

  // Manejar selección de todos los consumos
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(consumptions.map(item => item.id));
      const total = consumptions.reduce((sum, item) => {
        // Asegurar que total_price sea un número válido
        const itemPrice = typeof item.total_price === 'number' 
          ? item.total_price 
          : parseFloat(item.total_price) || 0;
        return sum + itemPrice;
      }, 0);
      setPaymentAmount(typeof total === 'number' ? total.toFixed(2) : '0.00');
    } else {
      setSelectedIds([]);
      setPaymentAmount('');
    }
  };

  // Manejar selección individual de consumo
  const handleSelectItem = (id: number, checked: boolean) => {
    let newSelected;
    if (checked) {
      newSelected = [...selectedIds, id];
    } else {
      newSelected = selectedIds.filter(itemId => itemId !== id);
    }
    
    setSelectedIds(newSelected);
    
    // Actualizar el monto de pago
    const total = consumptions
      .filter(item => newSelected.includes(item.id))
      .reduce((sum, item) => {
        // Asegurar que total_price sea un número válido
        const itemPrice = typeof item.total_price === 'number' 
          ? item.total_price 
          : parseFloat(item.total_price) || 0;
        return sum + itemPrice;
      }, 0);
    
    // Asegurarnos de que total sea un número antes de usar toFixed
    setPaymentAmount(typeof total === 'number' ? total.toFixed(2) : '0.00');
  };

  // Enviar pago
  const handleSubmitPayment = async () => {
    if (selectedIds.length === 0) {
      showError('Selección vacía', 'Debes seleccionar al menos un consumo para pagar');
      return;
    }

    if (!paymentReference.trim()) {
      showError('Referencia requerida', 'Debes ingresar una referencia de pago');
      return;
    }

    // Confirmar antes de enviar
    const totalAmount = calculateSelectedTotal();
    
    const confirmed = await showConfirm(
      'Confirmar pago', 
      `¿Estás seguro de registrar el pago por ${formatCurrency(totalAmount)} para ${selectedIds.length} consumo(s)?`,
      'Confirmar',
      'Cancelar'
    );

    if (confirmed) {
      try {
        console.log('Enviando datos de pago:', {
          user_id: user!.id,
          amount: totalAmount,
          payment_method: paymentMethod,
          reference: paymentReference,
          consumption_ids: selectedIds
        });
        
        await consumptionPaymentsService.createConsumptionPayment({
          user_id: user!.id,
          amount: totalAmount,
          payment_method: paymentMethod,
          reference: paymentReference,
          consumption_ids: selectedIds
        });
        
        showSuccess('Pago registrado', 'Tu pago ha sido registrado y está pendiente de aprobación');
        
        // Recargar consumos pendientes
        const response = await consumptionPaymentsService.getUnpaidConsumptions(user!.id);
        
        // Asegurarnos de que la respuesta tiene la estructura esperada
        if (response && response.consumptions && Array.isArray(response.consumptions)) {
          // Normalizar los datos antes de establecerlos
          const normalizedData = normalizeConsumptionData(response.consumptions);
          setConsumptions(normalizedData);
        } else {
          setConsumptions([]);
          console.error('Formato de respuesta inesperado al recargar consumos:', response);
        }
        
        // Limpiar selección y formulario
        setSelectedIds([]);
        setPaymentReference('');
        setPaymentAmount('');
      } catch (error) {
        console.error('Error al registrar pago:', error);
        showError('Error', 'No se pudo registrar el pago. Por favor intenta de nuevo.');
      }
    }
  };

  // Agrupar consumos por fecha para mejor visualización
  const groupConsumptionsByDate = () => {
    const grouped: { [date: string]: Consumption[] } = {};
    
    // Verificar que consumptions es un array antes de usar forEach
    if (Array.isArray(consumptions)) {
      consumptions.forEach(consumption => {
        const date = consumption.created_at.split('T')[0];
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(consumption);
      });
    }
    
    return grouped;
  };

  const groupedConsumptions = groupConsumptionsByDate();
  const selectedTotal = calculateSelectedTotal();
  const totalUnpaid = consumptions.reduce((sum, item) => {
    // Asegurar que total_price sea un número válido
    const itemPrice = typeof item.total_price === 'number' 
      ? item.total_price 
      : parseFloat(item.total_price) || 0;
    return sum + itemPrice;
  }, 0);

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : consumptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No tienes consumos pendientes de pago
        </div>
      ) : (
        <>
          {/* Total y selección general */}
          <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-md flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-300">Total pendiente:</span>
              <span className="ml-2 text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalUnpaid)}</span>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="selectAll"
                className="mr-2"
                checked={selectedIds.length === consumptions.length}
                onChange={handleSelectAll}
              />
              <label htmlFor="selectAll" className="cursor-pointer">
                Seleccionar todos
              </label>
            </div>
          </div>

          {/* Lista de consumos agrupados por fecha */}
          <div className="space-y-6">
            {Object.entries(groupedConsumptions).map(([date, items]) => (
              <div key={date} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {formatDate(date)}
                </h3>
                <div className="space-y-2">
                  {items.map(item => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`item-${item.id}`}
                          checked={selectedIds.includes(item.id)}
                          onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.quantity} x {formatCurrency(item.price_per_unit)}
                          </div>
                        </div>
                      </div>
                      <div className="font-medium">{formatCurrency(item.total_price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Formulario de pago */}
          {selectedIds.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-3">
                Registrar pago
              </h3>
              
              <div className="mb-4">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total seleccionado:
                </div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(selectedTotal)}
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Método de pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="transferencia">Transferencia bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="bizum">Bizum</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Referencia de pago
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ej: Últimos 4 dígitos cuenta, referencia transferencia..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Importe pagado
                </label>
                <input
                  type="text"
                  value={formatCurrency(parseFloat(paymentAmount) || 0)}
                  readOnly
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 bg-gray-100 dark:bg-gray-700"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  El importe corresponde a la suma de los consumos seleccionados
                </p>
              </div>
              
              <button
                onClick={handleSubmitPayment}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors"
              >
                Registrar Pago
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PendingConsumptions;
