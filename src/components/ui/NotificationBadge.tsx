import React from 'react';
import { AlertCircle, Bell } from 'lucide-react';

interface NotificationBadgeProps {
  count?: number;
  type?: 'info' | 'warning' | 'danger';
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  type = 'danger',
  icon,
  onClick,
  className = '',
}) => {
  // Colores basados en el tipo de notificación
  const typeStyles = {
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const defaultIcon = () => {
    switch(type) {
      case 'warning':
      case 'danger':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };
  return (
    <div 
      className={`relative inline-flex cursor-pointer ${className}`}
      onClick={onClick}
    >
      {icon || defaultIcon()}
      
      {(count !== undefined && count > 0) && (
        <div 
          className={`absolute -top-1 -right-1 ${typeStyles[type]} text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border border-dark-700 ${count > 0 ? 'notification-badge-pulse' : ''}`}
        >
          {count > 99 ? '99+' : count}
        </div>
      )}
    </div>
  );
};
