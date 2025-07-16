import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { LoggerControlPanel } from '../../components/admin/LoggerControlPanel';

export const AdminLoggerPage: React.FC = () => {
  return (
    <AdminLayout title="Sistema de Logging">
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Panel de control para gestionar y monitorear los logs de la aplicación
          </p>
        </div>
        
        <LoggerControlPanel />
      </div>
    </AdminLayout>
  );
};

export default AdminLoggerPage;
