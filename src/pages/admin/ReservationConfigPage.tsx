import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ReservationConfig, ConfigResponse } from '../../types';
import { configService } from '../../services/api';
import { showSuccess, showError, showLoading, closeLoading } from '../../utils/alerts';

const ReservationConfigPage: React.FC = () => {
  const [config, setConfig] = useState<ReservationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    // Formulario - Configuración de reservas
  const [maxHours, setMaxHours] = useState<number>(4);
  const [maxReservations, setMaxReservations] = useState<number>(1);
  const [minHoursAdvance, setMinHoursAdvance] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("22:00");
  const [requiresApproval, setRequiresApproval] = useState<boolean>(true);
  
  // Configuración para evitar reservas consecutivas
  const [allowConsecutiveReservations, setAllowConsecutiveReservations] = useState<boolean>(true);
  const [minTimeBetweenReservations, setMinTimeBetweenReservations] = useState<number>(30);
  
  // Formulario - Configuración de cuotas
  const [normalFee, setNormalFee] = useState<number>(30);
  const [maintenanceFee, setMaintenanceFee] = useState<number>(15);
    // Cargar la configuración actual
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const configData = await configService.getConfig();
        setConfig(configData);
        
        // Inicializar valores del formulario        setMaxHours(configData.max_hours_per_reservation);
        setMaxReservations(configData.max_reservations_per_user_per_day);
        setMinHoursAdvance(configData.min_hours_in_advance);
        setStartTime(configData.allowed_start_time);
        setEndTime(configData.allowed_end_time);
        setRequiresApproval(configData.requires_approval_for_all_day);
        
        // Configuración para evitar reservas consecutivas
        setAllowConsecutiveReservations(
          configData.allow_consecutive_reservations !== undefined 
            ? configData.allow_consecutive_reservations 
            : true
        );
        setMinTimeBetweenReservations(
          configData.min_time_between_reservations !== undefined 
            ? configData.min_time_between_reservations 
            : 30
        );
        
        // Cuotas
        if(configData.normal_fee !== undefined) {
          setNormalFee(configData.normal_fee);
        }
        if(configData.maintenance_fee !== undefined) {
          setMaintenanceFee(configData.maintenance_fee);
        }} catch (err) {
        const error = err as Error;
        console.error('Error al cargar la configuración:', error);
        setError('No se pudo cargar la configuración. Inténtalo de nuevo más tarde.');
          // Usar valores predeterminados en caso de error
        const defaultConfig = {
          id: 1,
          max_hours_per_reservation: 4,
          max_reservations_per_user_per_day: 1,
          min_hours_in_advance: 0,
          allowed_start_time: '08:00',
          allowed_end_time: '22:00',
          requires_approval_for_all_day: true,
          allow_consecutive_reservations: true,
          min_time_between_reservations: 30,
          normal_fee: 30,
          maintenance_fee: 15
        };
        
        setConfig(defaultConfig);
        setMaxHours(defaultConfig.max_hours_per_reservation);
        setMaxReservations(defaultConfig.max_reservations_per_user_per_day);
        setMinHoursAdvance(defaultConfig.min_hours_in_advance);
        setStartTime(defaultConfig.allowed_start_time);
        setEndTime(defaultConfig.allowed_end_time);
        setRequiresApproval(defaultConfig.requires_approval_for_all_day);
        setAllowConsecutiveReservations(defaultConfig.allow_consecutive_reservations);
        setMinTimeBetweenReservations(defaultConfig.min_time_between_reservations);
        setNormalFee(defaultConfig.normal_fee);
        setMaintenanceFee(defaultConfig.maintenance_fee);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, []);
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      showLoading('Guardando configuración...');
      
      // Log para depuración
      console.log('Datos que se enviarán:', {
        max_hours_per_reservation: maxHours,
        max_reservations_per_user_per_day: maxReservations,
        min_hours_in_advance: minHoursAdvance,
        allowed_start_time: startTime,
        allowed_end_time: endTime,
        requires_approval_for_all_day: requiresApproval,
        allow_consecutive_reservations: allowConsecutiveReservations,
        min_time_between_reservations: minTimeBetweenReservations,
        normal_fee: normalFee,
        maintenance_fee: maintenanceFee
      });
      
      const updatedConfig: ConfigResponse = await configService.updateConfig({
        max_hours_per_reservation: maxHours,
        max_reservations_per_user_per_day: maxReservations,
        min_hours_in_advance: minHoursAdvance,
        allowed_start_time: startTime,
        allowed_end_time: endTime,
        requires_approval_for_all_day: requiresApproval,
        allow_consecutive_reservations: allowConsecutiveReservations,
        min_time_between_reservations: minTimeBetweenReservations,
        normal_fee: normalFee,
        maintenance_fee: maintenanceFee
      });
      
      setConfig(updatedConfig.config);
      closeLoading();
      showSuccess('Configuración guardada', 'Los parámetros del sistema han sido actualizados correctamente');    } catch (err: unknown) {
      console.error('Error al guardar la configuración:', err);
      closeLoading();
      
      let errorMsg = 'No se pudo guardar la configuración. Inténtalo de nuevo más tarde.';
      
      if (typeof err === 'object' && err !== null) {
        const errorObj = err as { error?: string, message?: string };
        if (errorObj.error) {
          errorMsg = errorObj.error;
        } else if (errorObj.message) {
          errorMsg = errorObj.message;
        }
      }
      
      showError('Error', errorMsg);
      setError(errorMsg);
    }
  };
  
  // Validación de formulario
  const isTimeFormatValid = (time: string): boolean => {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
  };
  
  const isFormValid = (): boolean => {
    return (
      maxHours > 0 &&
      maxReservations >= 0 &&
      minHoursAdvance >= 0 &&
      isTimeFormatValid(startTime) &&
      isTimeFormatValid(endTime) &&
      normalFee >= 0 &&
      maintenanceFee >= 0
    );
  };
  
  return (
    <AdminLayout title="Configuración del Sistema">
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Configuración del Sistema</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sección de configuración de reservas */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 pb-2 border-b">Configuración de Reservas</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Horas máximas por reserva */}
                    <div>
                      <label htmlFor="maxHours" className="block text-sm font-medium mb-1">
                        Horas máximas por reserva
                      </label>
                      <Input
                        id="maxHours"
                        type="number"
                        min="1"
                        max="24"
                        value={maxHours}
                        onChange={(e) => setMaxHours(Number(e.target.value))}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cantidad máxima de horas que un usuario puede reservar en una sola reserva.
                      </p>
                    </div>
                    
                    {/* Máximo de reservas por usuario por día */}
                    <div>
                      <label htmlFor="maxReservations" className="block text-sm font-medium mb-1">
                        Máximo de reservas por usuario/día
                      </label>
                      <Input
                        id="maxReservations"
                        type="number"
                        min="0"
                        value={maxReservations}
                        onChange={(e) => setMaxReservations(Number(e.target.value))}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Número máximo de reservas que un usuario puede hacer en un mismo día. 0 = sin límite.
                      </p>
                    </div>
                    
                    {/* Horas mínimas de antelación */}
                    <div>
                      <label htmlFor="minHoursAdvance" className="block text-sm font-medium mb-1">
                        Horas mínimas de antelación
                      </label>
                      <Input
                        id="minHoursAdvance"
                        type="number"
                        min="0"
                        value={minHoursAdvance}
                        onChange={(e) => setMinHoursAdvance(Number(e.target.value))}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Horas mínimas de antelación para realizar una reserva. 0 = sin antelación.
                      </p>
                    </div>
                    
                    {/* Hora de inicio permitida */}
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium mb-1">
                        Hora de inicio permitida
                      </label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Primera hora del día en que se pueden hacer reservas.
                      </p>
                    </div>
                    
                    {/* Hora de fin permitida */}
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium mb-1">
                        Hora de fin permitida
                      </label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Última hora del día en que se pueden terminar las reservas.
                      </p>
                    </div>
                    
                    {/* Requiere aprobación para todo el día */}
                    <div>
                      <div className="flex items-center">
                        <input
                          id="requiresApproval"
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          checked={requiresApproval}
                          onChange={(e) => setRequiresApproval(e.target.checked)}
                        />
                        <label htmlFor="requiresApproval" className="ml-2 block text-sm font-medium">
                          Requiere aprobación para reservas de todo el día
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Si está marcado, las reservas de todo el día requerirán aprobación de un administrador.
                      </p>
                    </div>
                    
                    {/* Permitir reservas consecutivas */}
                    <div>
                      <div className="flex items-center">
                        <input
                          id="allowConsecutiveReservations"
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          checked={allowConsecutiveReservations}
                          onChange={(e) => setAllowConsecutiveReservations(e.target.checked)}
                        />
                        <label htmlFor="allowConsecutiveReservations" className="ml-2 block text-sm font-medium">
                          Permitir reservas consecutivas del mismo usuario
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Si está desmarcado, un usuario no podrá hacer reservas consecutivas de la misma mesa.
                      </p>
                    </div>
                    
                    {/* Tiempo mínimo entre reservas */}
                    <div className={allowConsecutiveReservations ? "opacity-50" : ""}>
                      <label htmlFor="minTimeBetweenReservations" className="block text-sm font-medium mb-1">
                        Tiempo mínimo entre reservas (minutos)
                      </label>
                      <Input
                        id="minTimeBetweenReservations"
                        type="number"
                        min="0"
                        value={minTimeBetweenReservations}
                        onChange={(e) => setMinTimeBetweenReservations(Number(e.target.value))}
                        disabled={allowConsecutiveReservations}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tiempo mínimo (en minutos) que debe transcurrir entre reservas del mismo usuario.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Sección de configuración de cuotas */}
                <div className="pt-4 mt-4">
                  <h3 className="text-xl font-semibold mb-4 pb-2 border-b">Configuración de Cuotas</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Cuota Normal */}
                    <div>
                      <label htmlFor="normalFee" className="block text-sm font-medium mb-1">
                        Cuota mensual normal (€)
                      </label>
                      <Input
                        id="normalFee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={normalFee}
                        onChange={(e) => setNormalFee(Number(e.target.value))}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cantidad mensual a pagar por los usuarios con cuota normal.
                      </p>
                    </div>
                    
                    {/* Cuota de Mantenimiento */}
                    <div>
                      <label htmlFor="maintenanceFee" className="block text-sm font-medium mb-1">
                        Cuota mensual de mantenimiento (€)
                      </label>
                      <Input
                        id="maintenanceFee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={maintenanceFee}
                        onChange={(e) => setMaintenanceFee(Number(e.target.value))}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cantidad mensual a pagar por los usuarios con cuota de mantenimiento.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={!isFormValid() || loading}
                  >
                    Guardar configuración
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ReservationConfigPage;
