import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { paymentsService, adminUserService } from '../../../services/api';
import { PaymentFormData, User, Payment, ReservationConfig } from '../../../types';
import { showError, showSuccess, showLoading, closeLoading } from '../../../utils/alerts';
import { configService } from '../../../services/api';

// Función para obtener el nombre del mes
const getMonthName = (month: number): string => {
  return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2000, month - 1, 1));
};

// Componente principal del formulario de pago
const PaymentForm: React.FC = () => {
  // Para editar o crear según la ruta
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  
  // Estados
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<ReservationConfig | null>(null);
  const [payment, setPayment] = useState<PaymentFormData>({
    user_id: 0,
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'normal',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    payment_method: 'transferencia'
  });
  const [loading, setLoading] = useState(true);
  const [originalPayment, setOriginalPayment] = useState<Payment | null>(null);
  
  const navigate = useNavigate();
  
  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar la lista de usuarios
        await loadUsers();
        
        // Cargar configuración para obtener los importes de las cuotas
        await loadConfig();
        
        // Si estamos en modo edición, cargar el pago existente
        if (isEditMode && id) {
          const { payment: existingPayment } = await paymentsService.getPaymentById(Number(id));
          setOriginalPayment(existingPayment);
          
          setPayment({
            user_id: existingPayment.user_id,
            amount: existingPayment.amount,
            payment_date: existingPayment.payment_date.split('T')[0], // Convertir formato completo a solo fecha
            payment_type: existingPayment.payment_type,
            month: existingPayment.month,
            year: existingPayment.year,
            payment_method: existingPayment.payment_method,
            reference: existingPayment.reference || undefined,
            notes: existingPayment.notes || undefined
          });
        }
      } catch (error: any) {
        showError('Error', error.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isEditMode, id]);
  
  // Cargar la configuración del sistema
  const loadConfig = async () => {
    try {
      const configData = await configService.getConfig();
      setConfig(configData);
      
      // Si estamos creando un nuevo pago, usar los valores de la configuración
      if (!isEditMode) {
        setPayment(prev => ({
          ...prev,
          amount: prev.payment_type === 'normal' ? configData.normal_fee : 
                  prev.payment_type === 'maintenance' ? configData.maintenance_fee :
                  configData.entrance_fee
        }));
      }
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
    }
  };
    // Cargar la lista de usuarios
  const loadUsers = async () => {
    try {
      const usersData = await adminUserService.getAllUsers();
      setUsers(usersData);
      
      // Si estamos creando un pago y hay usuarios, seleccionar el primero por defecto
      if (!isEditMode && usersData.length > 0) {
        setPayment(prev => ({
          ...prev,
          user_id: usersData[0].id
        }));
      }
    } catch (error) {
      console.error('Error al cargar la lista de usuarios:', error);
      throw error;
    }
  };
  
  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Para checkboxes
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setPayment(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    // Para campos numéricos
    if (type === 'number') {
      setPayment(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
      return;
    }
    
    // Para el resto de campos
    setPayment(prev => ({ ...prev, [name]: value }));
    
    // Actualizar automáticamente el importe según el tipo de cuota
    if (name === 'payment_type' && config) {
      const amount = value === 'normal' ? config.normal_fee : 
                     value === 'maintenance' ? config.maintenance_fee :
                     config.entrance_fee;
      setPayment(prev => ({ ...prev, amount }));
    }
  };
  
  // Guardar el pago
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      showLoading(isEditMode ? 'Actualizando cuota...' : 'Guardando cuota...');
      
      let result;
      if (isEditMode && id) {
        result = await paymentsService.updatePayment(Number(id), payment);
      } else {
        result = await paymentsService.createPayment(payment);
      }
      
      closeLoading();
      showSuccess('Éxito', result.message || `Cuota ${isEditMode ? 'actualizada' : 'creada'} correctamente`);
      
      // Redireccionar a la lista de pagos
      navigate('/admin/payments');
    } catch (error: any) {
      closeLoading();
      showError('Error', error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} la cuota`);
    }
  };
  
  // Validar el formulario
  const isFormValid = (): boolean => {
    return (
      payment.user_id > 0 &&
      payment.amount > 0 &&
      payment.payment_date?.trim() !== '' &&
      payment.month >= 1 &&
      payment.month <= 12 &&
      payment.year >= 2000
    );
  };
  
  return (
    <AdminLayout title={isEditMode ? 'Editar Cuota' : 'Nueva Cuota'}>
      <div className="max-w-3xl mx-auto">
        <Card>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Usuario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="user_id" className="block text-sm font-medium mb-1">
                      Usuario
                    </label>
                    <Select
                      id="user_id"
                      name="user_id"
                      value={payment.user_id}
                      onChange={handleChange}
                      disabled={isEditMode} // No permitir cambiar el usuario en modo edición
                      required
                    >
                      <option value="">Selecciona un usuario</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                
                  {/* Tipo de cuota */}
                  <div>
                    <label htmlFor="payment_type" className="block text-sm font-medium mb-1">
                      Tipo de cuota
                    </label>
                    <Select
                      id="payment_type"
                      name="payment_type"
                      value={payment.payment_type}
                      onChange={handleChange}
                      disabled={isEditMode} // No permitir cambiar el tipo en modo edición
                      required
                    >
                      <option value="normal">Normal</option>
                      <option value="maintenance">Mantenimiento</option>
                      <option value="entrance">Entrada</option>
                    </Select>
                  </div>
                </div>
                
                {/* Importe y fecha */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Importe */}
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium mb-1">
                      Importe (€)
                    </label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={payment.amount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  {/* Fecha */}
                  <div>
                    <label htmlFor="payment_date" className="block text-sm font-medium mb-1">
                      Fecha de pago
                    </label>
                    <Input
                      id="payment_date"
                      name="payment_date"
                      type="date"
                      value={payment.payment_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  {/* Método de pago */}
                  <div>
                    <label htmlFor="payment_method" className="block text-sm font-medium mb-1">
                      Método de pago
                    </label>
                    <Select
                      id="payment_method"
                      name="payment_method"
                      value={payment.payment_method}
                      onChange={handleChange}
                      required
                    >
                      <option value="transferencia">Transferencia</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="bizum">Bizum</option>
                      <option value="otro">Otro</option>
                    </Select>
                  </div>
                </div>
                
                {/* Periodo (mes y año) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mes */}
                  <div>
                    <label htmlFor="month" className="block text-sm font-medium mb-1">
                      Mes
                    </label>
                    <Select
                      id="month"
                      name="month"
                      value={payment.month}
                      onChange={handleChange}
                      disabled={isEditMode} // No permitir cambiar el mes en modo edición
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {getMonthName(month)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  
                  {/* Año */}
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium mb-1">
                      Año
                    </label>
                    <Select
                      id="year"
                      name="year"
                      value={payment.year}
                      onChange={handleChange}
                      disabled={isEditMode} // No permitir cambiar el año en modo edición
                      required
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                
                {/* Referencia */}
                <div>
                  <label htmlFor="reference" className="block text-sm font-medium mb-1">
                    Referencia
                  </label>
                  <Input
                    id="reference"
                    name="reference"
                    type="text"
                    value={payment.reference || ''}
                    onChange={handleChange}
                    placeholder="Número de transferencia, recibo, etc."
                  />
                </div>
                
                {/* Notas */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-1">
                    Notas
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={payment.notes || ''}
                    onChange={handleChange}
                    placeholder="Información adicional sobre el pago"
                  ></textarea>
                </div>
                
                {/* Botones */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/payments')}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={!isFormValid()}
                  >
                    {isEditMode ? 'Actualizar' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PaymentForm;
