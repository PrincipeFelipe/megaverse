import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { Notification } from '../../contexts/NotificationContext';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBadge } from './NotificationBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    hasRejectedPayments,
    markAsRead,
    removeNotification 
  } = useNotifications();
  
  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);
  
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.url) {
      navigate(notification.url);
    }
    setIsOpen(false);
  };
  
  const formatNotificationDate = (date: Date) => {
    return format(date, "dd MMM, HH:mm", { locale: es });
  };
  
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <NotificationBadge 
        count={unreadCount} 
        type={hasRejectedPayments ? 'danger' : 'info'} 
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-300 hover:text-white transition-colors mr-2"
        icon={<Bell className="w-5 h-5" />}
      />
      
      {isOpen && notifications.length > 0 && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-md shadow-lg z-40 border border-gray-200 dark:border-dark-700 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {unreadCount} {unreadCount === 1 ? 'no leída' : 'no leídas'}
              </span>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-3 border-b border-gray-200 dark:border-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 ${!notification.read ? 'bg-gray-50 dark:bg-dark-700' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white flex items-center">
                      <span 
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${notification.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary-500'}`}
                      />
                      {notification.title}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                  </div>
                  
                  {notification.dismissible !== false && (
                    <button
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {notification.type !== 'info' && (
                  <div className={`mt-2 px-2 py-1 rounded text-xs inline-block ${getTypeStyles(notification.type)}`}>
                    {notification.type === 'error' ? 'Error' : 'Advertencia'}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-dark-700 text-center">
              <button
                className="text-xs text-primary-500 hover:text-primary-700 dark:hover:text-primary-300"
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
