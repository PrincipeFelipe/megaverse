import React, { useState } from 'react';
import { cleaningDutyService } from '../../services/cleaningDutyService';
import { Button } from '../../components/ui/Button';
import { useNotifications } from '../../hooks/useNotifications';

interface ExemptionFormProps {
  userId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const ExemptionForm: React.FC<ExemptionFormProps> = ({ userId, onSuccess, onCancel }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isPermanent, setIsPermanent] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Por favor, proporciona un motivo para la exención');
      return;
    }
    
    if (!startDate) {
      setError('Por favor, selecciona una fecha de inicio');
      return;
    }
    
    if (!isPermanent && !endDate) {
      setError('Por favor, selecciona una fecha de fin o marca como permanente');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await cleaningDutyService.addExemption({
        userId,
        startDate,
        endDate: isPermanent ? undefined : endDate,
        reason,
        isPermanent
      });
      
      addNotification({
        type: 'info',
        title: 'Éxito',
        message: 'Exención solicitada con éxito'
      });
      onSuccess();
    } catch (error) {
      const errorMessage = 'Error al crear la exención';
      setError(errorMessage);
      console.error('Error al crear exención:', error);
      
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Solicitar exención de limpieza</h2>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 mb-4 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">
            Fecha de inicio
          </label>
          <input
            type="date"
            id="startDate"
            className="w-full p-2 border rounded"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="isPermanent"
              className="mr-2"
              checked={isPermanent}
              onChange={() => setIsPermanent(!isPermanent)}
            />
            <label htmlFor="isPermanent" className="text-sm font-medium">
              Exención permanente
            </label>
          </div>
          
          {!isPermanent && (
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium mb-1">
                Fecha de fin
              </label>
              <input
                type="date"
                id="endDate"
                className="w-full p-2 border rounded"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required={!isPermanent}
              />
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="reason" className="block text-sm font-medium mb-1">
            Motivo
          </label>
          <textarea
            id="reason"
            className="w-full p-2 border rounded"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explica por qué necesitas esta exención..."
            required
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button onClick={onCancel} type="button" color="secondary">
            Cancelar
          </Button>
          <Button type="submit" color="primary" disabled={loading}>
            {loading ? 'Enviando...' : 'Solicitar exención'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExemptionForm;
