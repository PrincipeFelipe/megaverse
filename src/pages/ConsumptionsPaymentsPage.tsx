import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { UserLayout } from '../components/layout/UserLayout';
import { AdminLayout } from '../components/admin/AdminLayout';
import PendingConsumptions from '../components/consumptions/PendingConsumptions';
import PendingPaymentsAdmin from '../components/admin/PendingPaymentsAdmin';
import AllUnpaidConsumptionsAdmin from '../components/admin/AllUnpaidConsumptionsAdmin';

const ConsumptionsPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  if (isAdminRoute && user?.role === 'admin') {
    return (
      <AdminLayout title="Gestión de Pagos de Consumos">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Gestiona los pagos de consumos de todos los usuarios y revisa las solicitudes pendientes
        </p>
        
        <div className="space-y-6">
          {/* Pagos pendientes de aprobación - PRIMERO */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Pagos Pendientes de Aprobación
            </h2>
            <PendingPaymentsAdmin />
          </div>
          
          {/* Consumos sin pagar - SEGUNDO */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Consumos Sin Pagar
            </h2>
            <AllUnpaidConsumptionsAdmin />
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Mis Consumos Pendientes de Pago
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualiza y gestiona tus consumos pendientes de pago
          </p>
        </div>
        
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
          <PendingConsumptions />
        </div>
      </div>
    </UserLayout>
  );
};

export default ConsumptionsPaymentsPage;
