import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Button } from '../../../components/ui/Button';

interface ExpenseFormProps {
  mode: 'new' | 'edit';
  id?: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ mode, id }) => {
  const navigate = useNavigate();
  
  return (
    <AdminLayout title={mode === 'new' ? 'Nuevo Gasto' : 'Editar Gasto'}>
      <div className="space-y-6">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-md mb-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            La funcionalidad de {mode === 'new' ? 'creación' : 'edición'} de gastos se está implementando. 
            Por favor, vuelve más tarde.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/admin/expenses')}
          >
            Volver a la lista
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExpenseForm;
