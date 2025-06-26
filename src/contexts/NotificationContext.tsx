import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { consumptionPaymentsService } from '../services/consumptionPaymentsService';

export type NotificationType = 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  url?: string;
  createdAt: Date;
  dismissible?: boolean;
  data?: Record<string, unknown>;
  uniqueId?: string; // Identificador único opcional para evitar duplicados
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  hasRejectedPayments: boolean;
  refreshRejectedPaymentsStatus: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasRejectedPayments, setHasRejectedPayments] = useState(false);
  const { user } = useAuth();
    // Función mejorada para añadir notificaciones sin duplicados
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    // Usamos un función con el estado previo para evitar depender de notifications directamente
    setNotifications((prevNotifications) => {
      // Verificar si ya existe una notificación similar
      const isDuplicate = prevNotifications.some(existing => {
        // Si ambas tienen uniqueId y son iguales
        if (notification.uniqueId && existing.uniqueId === notification.uniqueId) {
          return true;
        }
        
        // Si ambas tienen el mismo tipo y título
        if (existing.type === notification.type && existing.title === notification.title) {
          // Si ambas tienen URL y son iguales
          if (existing.url && notification.url && existing.url === notification.url) {
            return true;
          }
          
          // Si los mensajes son idénticos (para notificaciones sin URL)
          if (existing.message === notification.message) {
            return true;
          }
          
          // Si ambas tienen datos y son para el mismo tipo de evento
          if (existing.data && notification.data) {
            // Comprobamos si son pagos rechazados (caso especial)
            if (existing.title === 'Pago rechazado' && notification.title === 'Pago rechazado') {
              return true; // Ya hay una notificación sobre pagos rechazados
            }
          }
        }
        
        return false;
      });

      // Si es un duplicado, no añadir
      if (isDuplicate) {
        console.log('Notificación duplicada, no se añadirá:', notification);
        return prevNotifications; // Devuelve el mismo array sin cambios
      }
      
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substring(2, 11),
        read: false,
        createdAt: new Date(),
      };

      return [newNotification, ...prevNotifications]; // Añadimos la nueva notificación al principio
    });
  }, []); // No dependemos de notifications, usamos el estado previo dentro del setNotifications
  // Definir checkForRejectedPayments con dependencias minimizadas
  const checkForRejectedPayments = useCallback(async () => {
    if (!user) return;

    try {
      // Comprobar si hay pagos rechazados
      const response = await consumptionPaymentsService.getPaymentHistory({
        status: 'rechazado'
      });
        if (response.payments && response.payments.length > 0) {
        setHasRejectedPayments(true);
        
        // Crear notificación para el pago rechazado con uniqueId para mejor control de duplicados
        addNotification({
          type: 'error',
          title: 'Pago rechazado',
          message: `Tienes ${response.payments.length > 1 ? response.payments.length + ' pagos rechazados' : 'un pago rechazado'}. Revisa tu historial de pagos.`,
          url: '/payments/history',
          dismissible: false,
          uniqueId: 'rejected-payments-notification', // Añadimos un identificador único
          data: {
            rejectedCount: response.payments.length
          }
        });
      } else {
        setHasRejectedPayments(false);
        
        // Eliminar notificaciones de pagos rechazados si ya no hay
        setNotifications(prev => {
          const filteredNotifications = prev.filter(n => !(
            n.uniqueId === 'rejected-payments-notification' || 
            (n.type === 'error' && n.title === 'Pago rechazado' && n.url === '/payments/history')
          ));
          
          // Solo devolver un nuevo array si hubo cambios
          if (filteredNotifications.length !== prev.length) {
            return filteredNotifications;
          }
          return prev; // Devolver el mismo array si no hubo cambios
        });
      }
    } catch (error) {
      console.error('Error al comprobar pagos rechazados:', error);
    }
  }, [user, addNotification]); // Reducimos las dependencias
  
  // Función pública para actualizar el estado de pagos rechazados
  const refreshRejectedPaymentsStatus = useCallback(async () => {
    await checkForRejectedPayments();
  }, [checkForRejectedPayments]);  // Un efecto para limpiar notificaciones cuando el usuario cambia
  useEffect(() => {
    if (!user) {
      // Si no hay usuario, simplemente establecer hasRejectedPayments a false
      setHasRejectedPayments(false);
      
      // Limpiar notificaciones relacionadas con pagos cuando el usuario se desconecta
      setNotifications(prev => {
        // Solo hacemos el cambio si hay notificaciones de pagos para eliminar
        const filteredNotifications = prev.filter(n => !(n.url === '/payments/history'));
        if (filteredNotifications.length !== prev.length) {
          return filteredNotifications;
        }
        return prev; // Devuelve el mismo array si no hay cambios para evitar renders innecesarios
      });
    }
  }, [user]); // Solo dependemos de user para este efecto
  
  // Un efecto separado para comprobar pagos rechazados cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      // Solo comprobar pagos rechazados si hay un usuario autenticado
      checkForRejectedPayments();
    }
  }, [user, checkForRejectedPayments]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        hasRejectedPayments,
        refreshRejectedPaymentsStatus
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// useNotifications se ha movido a src/hooks/useNotifications.ts
