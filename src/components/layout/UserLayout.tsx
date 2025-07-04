import React, { ReactNode } from 'react';
import { UserSidebar } from './UserSidebar';

interface UserLayoutProps {
  children: ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Menú lateral */}
          <div className="lg:col-span-1">
            <UserSidebar />
          </div>
          
          {/* Contenido principal */}
          <div className="lg:col-span-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
