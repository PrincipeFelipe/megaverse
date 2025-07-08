/**
 * Servicios para interactuar con la API
 */

import { User, Product, Reservation, Table, Notification } from '../types';
export { configService } from './configService';
export { paymentsService } from './paymentsService';
export { uploadService } from './uploadService';
export { consumptionPaymentsService } from './consumptionPaymentsService';
export { documentService } from './documentService';
export { cleaningDutyService } from './cleaningDutyService';

// VITE_API_URL ya incluye /api al final
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';
const API_PATH = ''; // Dejamos esto vacío porque VITE_API_URL ya incluye /api

/**
 * Función para asegurar que los valores numéricos sean correctamente parseados
 * cuando se reciben de la API. Esta función es recursiva y convertirá todos los
 * valores de tipo string que parezcan números en su respectivo tipo numérico.
 * @param data Datos a normalizar
 * @returns Datos con valores numéricos correctamente convertidos
 */
export const normalizeNumericValues = <T>(data: T): T => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    // Si es una cadena que parece un número, convertirla
    if (typeof data === 'string' && !isNaN(Number(data)) && data.trim() !== '') {
      return Number(data) as unknown as T;
    }
    return data;
  }

  // Si es un array, normalizar cada elemento
  if (Array.isArray(data)) {
    return data.map(item => normalizeNumericValues(item)) as unknown as T;
  }

  // Si es un objeto, normalizar cada propiedad
  const result = { ...(data as object) } as any;
  Object.keys(result).forEach(key => {
    result[key] = normalizeNumericValues(result[key]);
  });

  return result as T;
};

// Función helper para hacer peticiones con autorización
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  // Asegurar que la URL esté bien formada
  const fullUrl = `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
  console.log('fetchWithAuth URL:', fullUrl); // Para depuración
  
  const response = await fetch(fullUrl, {
    ...options,
    headers
  });
  
  if (!response.ok && response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/auth';
    throw new Error('Sesión expirada. Inicia sesión de nuevo.');
  }
  
  return response;
};

// Servicios de autenticación
export const authService = {  
  login: async (username: string, password: string) => {
    // Log para depuración
    console.log('API_URL:', API_URL);
    console.log('API_PATH:', API_PATH);
    const fullUrl = `${API_URL}/auth/login`;
    console.log('URL completa de login:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.log('Error de login recibido del servidor:', error);
      throw new Error(error.error || 'Error al iniciar sesión');
    }
    
    return response.json();
  },
  
  register: async (name: string, username: string, email: string, phone: string, dni: string, password: string) => {
    const userData = { 
      name, 
      username, 
      email, 
      phone, 
      dni, 
      password,
      // Añadimos la fecha actual como fecha de alta por defecto
      membership_date: new Date().toISOString().split('T')[0]
    };
    
    console.log('Datos de registro enviados (registro normal):', { ...userData, password: '******' });
    
    const response = await fetch(`${API_URL}${API_PATH}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    console.log('Respuesta del registro normal:', response.status, response.statusText);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrarse');
    }
    
    return response.json();
  },
    getProfile: async () => {
    const response = await fetchWithAuth('/auth/me');
    
    if (!response.ok) {
      throw new Error('Error al obtener el perfil');
    }
    
    return response.json();
  },  updateProfile: async (userData: {
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    membership_date?: string;
    current_password?: string;
    new_password?: string;
    avatar_url?: string;
  }) => {
    try {
      // Limpia los datos para enviar solo los campos que cambiaron
      const cleanedData: Record<string, any> = {};
      
      // Incluir solo los campos con valores definidos
      for (const [key, value] of Object.entries(userData)) {
        // No incluir campos vacíos excepto si son explícitamente null
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      }
      
      // Siempre usar 'me' para actualizar el perfil del usuario actual
      const response = await fetchWithAuth('/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error al actualizar el perfil: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error en updateProfile:', error);
      throw error;
    }
  }
};

// Servicios de productos
export const productService = {  getAllProducts: async () => {
    const response = await fetch(`${API_URL}${API_PATH}/products`);
    
    if (!response.ok) {
      throw new Error('Error al obtener productos');
    }
    
    const data = await response.json();
    // Asegurar que los valores numéricos como price y stock sean realmente números
    return data.map((product: any) => ({
      ...product,
      price: typeof product.price === 'number' ? product.price : parseFloat(String(product.price)) || 0,
      stock: typeof product.stock === 'number' ? product.stock : parseInt(String(product.stock)) || 0
    }));
  },
    getProductById: async (id: number) => {
    const response = await fetch(`${API_URL}${API_PATH}/products/${id}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener el producto');
    }
    
    return response.json();
  },
    createProduct: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await fetchWithAuth('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear el producto');
    }
    
    return response.json();
  },
  
  updateProduct: async (id: number, productData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) => {
    const response = await fetchWithAuth(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar el producto');
    }
    
    return response.json();
  },
  
  deleteProduct: async (id: number) => {
    const response = await fetchWithAuth(`/products/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar el producto');
    }
    
    return response.json();
  }
};

// Servicios de mesas
export const tableService = {  
  getAllTables: async () => {
    const response = await fetch(`${API_URL}${API_PATH}/tables`);
    
    if (!response.ok) {
      throw new Error('Error al obtener mesas');
    }
    
    return response.json();
  },
    getTableById: async (id: number) => {
    const response = await fetch(`${API_URL}${API_PATH}/tables/${id}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener la mesa');
    }
    
    return response.json();
  }
};

// Servicios de reservas
export const reservationService = {
  getAllReservations: async () => {
    const response = await fetchWithAuth('/reservations');
    
    if (!response.ok) {
      throw new Error('Error al obtener reservas');
    }
    
    return response.json();
  },
    createReservation: async (reservationData: { 
    tableId: number, 
    startTime: string, 
    endTime: string,
    durationHours: number,
    numMembers: number,
    numGuests: number,
    allDay?: boolean,
    reason?: string
  }) => {
    const response = await fetchWithAuth('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear la reserva');
    }
    
    return response.json();
  },
  
  updateReservation: async (id: number, reservationData: { 
    tableId?: number, 
    startTime?: string, 
    endTime?: string,
    durationHours?: number,
    numMembers?: number,
    numGuests?: number,
    allDay?: boolean,
    reason?: string
  }) => {
    const response = await fetchWithAuth(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reservationData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar la reserva');
    }
    
    return response.json();
  },
  
  updateReservationStatus: async (id: number, status: 'active' | 'cancelled' | 'completed') => {
    const response = await fetchWithAuth(`/reservations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar la reserva');
    }
    
    return response.json();
  },
  
  deleteReservation: async (id: number) => {
    const response = await fetchWithAuth(`/reservations/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar la reserva');
    }
    
    return response.json();
  }
};

// Servicios de consumos
export const consumptionService = {
  getAllConsumptions: async () => {
    const response = await fetchWithAuth('/consumptions');
    
    if (!response.ok) {
      throw new Error('Error al obtener consumos');
    }
    
    return response.json();
  },
  
  getUserConsumptions: async (userId: number) => {
    const response = await fetchWithAuth(`/consumptions/user/${userId}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener consumos del usuario');
    }
    
    return response.json();
  },
  
  createConsumption: async (consumptionData: { productId: number, quantity: number, userId?: number }) => {
    const response = await fetchWithAuth('/consumptions', {
      method: 'POST',
      body: JSON.stringify(consumptionData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear el consumo');
    }
    
    return response.json();
  }
};

// Servicio de pagos de consumos
export const consumptionPaymentService = {
  getUserDebt: async (userId?: number) => {
    const endpoint = userId ? `/consumption-payments/debt/${userId}` : '/consumption-payments/debt';
    const response = await fetchWithAuth(endpoint);
    
    if (!response.ok) {
      throw new Error('Error al obtener la deuda del usuario');
    }
    
    return response.json();
  }
};

/**
 * Servicios para administración de usuarios
 */

export const adminUserService = {  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await fetchWithAuth('/users');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Log para verificar que los datos incluyan los campos críticos
      console.log('getAllUsers - datos recibidos del servidor:', data);
      if (data && data.length > 0) {
        console.log('getAllUsers - primer usuario con campos críticos:', {
          phone: data[0].phone,
          dni: data[0].dni,
          membership_date: data[0].membership_date,
          is_active: data[0].is_active,
          is_active_type: typeof data[0].is_active
        });
      }
      
      // Mapear a la interfaz User correctamente sin procesamiento de balance
      return data;
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  },getUserById: async (id: number): Promise<User> => {
    try {
      const response = await fetchWithAuth(`/users/${id}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error obteniendo usuario ${id}:`, error);
      throw error;
    }
  },  createUser: async (userData: Omit<User, 'id' | 'createdAt' | 'balance'> & { password: string, balance?: number }): Promise<User> => {
    try {
      // Aseguramos que los campos tengan valores predeterminados si no se proporcionan
      const dataToSend = {
        ...userData,
        // Asegurar que los campos estén correctamente formateados
        phone: userData.phone || '',
        dni: userData.dni || '',
        // Establecer el rol explícitamente (el registro normal siempre crea usuarios con rol 'user')
        role: userData.role || 'user',
        // Formatear la fecha correctamente para MySQL
        membership_date: userData.membership_date 
          ? new Date(userData.membership_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0] // Fecha actual como valor por defecto
      };
      
      // Log de los datos que se envían al servidor (ocultando la contraseña)
      const logData = { ...dataToSend };
      if (logData.password) logData.password = '******';
      console.log('Datos enviados para crear usuario (admin):', logData);
      console.log('Tipo de dato de membership_date:', typeof dataToSend.membership_date, 'Valor:', dataToSend.membership_date);
      
      // Usamos la ruta pública específica para registro administrativo
      console.log('Llamando al endpoint: /users/public-register (sin requerir token auth)');
      
      // Usamos fetch directamente ya que la ruta es pública
      const response = await fetch(`${API_URL}${API_PATH}/users/public-register`, {
        method: 'POST',
        body: JSON.stringify(dataToSend),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Respuesta del servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        // Intentar leer el mensaje de error del cuerpo de la respuesta
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
          console.error('Respuesta de error completa:', errorData);
        } catch (e) {
          console.error('No se pudo parsear la respuesta de error');
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Respuesta exitosa:', result);
      
      // Extraer el usuario de la respuesta y verificar sus campos
      const user = result.user || result;
      console.log('Usuario extraído:', user);
      console.log('Campos del usuario:', {
        phone: user.phone,
        dni: user.dni,
        membership_date: user.membership_date
      });
      
      return user;
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  },  updateUser: async (id: number, userData: Partial<Omit<User, 'id' | 'createdAt'> & { password?: string }>): Promise<User> => {
    try {
      const response = await fetchWithAuth(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error actualizando usuario ${id}:`, error);
      throw error;
    }
  },  deleteUser: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await fetchWithAuth(`/users/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error eliminando usuario ${id}:`, error);
      throw error;
    }
  },
  
  toggleUserActive: async (id: number, isActive: boolean): Promise<User> => {
    try {
      const response = await fetchWithAuth(`/users/${id}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error cambiando estado del usuario ${id}:`, error);
      throw error;
    }
  },
};

/**
 * Servicios para administración de mesas
 */
export const adminTableService = {
  getAllTables: async () => {
    try {
      const response = await fetchWithAuth('/tables');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return normalizeNumericValues(data);
    } catch (error) {
      console.error('Error obteniendo mesas:', error);
      throw error;
    }
  },
  
  getTableById: async (id: number) => {
    try {
      const response = await fetchWithAuth(`/tables/${id}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return normalizeNumericValues(await response.json());
    } catch (error) {
      console.error(`Error obteniendo mesa ${id}:`, error);
      throw error;
    }
  },
  
  createTable: async (tableData: Omit<Table, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetchWithAuth('/tables', {
        method: 'POST',
        body: JSON.stringify(tableData),
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creando mesa:', error);
      throw error;
    }
  },
  
  updateTable: async (id: number, tableData: Partial<Omit<Table, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const response = await fetchWithAuth(`/tables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tableData),
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error actualizando mesa ${id}:`, error);
      throw error;
    }
  },
    deleteTable: async (id: number, forceDelete: boolean = false) => {
    try {
      // Añadimos el parámetro force=true cuando queremos forzar la eliminación de todas las reservas
      const url = forceDelete 
        ? `/tables/${id}?force=true` 
        : `/tables/${id}`;
        
      const response = await fetchWithAuth(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error eliminando mesa ${id}:`, error);
      throw error;
    }
  }
};

/**
 * Servicios para administración de reservas
 */
export const adminReservationService = {  
  getAllReservations: async (): Promise<Reservation[]> => {
    try {
      const response = await fetchWithAuth('/reservations');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo reservas:', error);
      throw error;
    }
  },
    getReservationsByTableId: async (tableId: number): Promise<Reservation[]> => {
    try {
      // Obtener todas las reservas
      const response = await fetchWithAuth(`/reservations`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Filtrar las reservas solo para la mesa específica y que estén activas
      const reservations = await response.json();
      return reservations.filter((reservation: Reservation) => 
        reservation.table_id === tableId && reservation.status === 'active'
      );
    } catch (error) {
      console.error(`Error obteniendo reservas de la mesa ${tableId}:`, error);
      throw error;
    }
  },
  getAllReservationsByTableId: async (tableId: number): Promise<Reservation[]> => {
    try {
      // Obtener todas las reservas
      const response = await fetchWithAuth(`/reservations`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Filtrar todas las reservas para la mesa específica (sin importar su estado)
      const reservations = await response.json();
      return reservations.filter((reservation: Reservation) => 
        reservation.table_id === tableId
      );
    } catch (error) {
      console.error(`Error obteniendo todas las reservas de la mesa ${tableId}:`, error);
      throw error;
    }
  },getReservationById: async (id: number): Promise<Reservation> => {
    try {
      const response = await fetchWithAuth(`/reservations/${id}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error obteniendo reserva ${id}:`, error);
      throw error;
    }
  },  createReservation: async (reservationData: Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'user_name' | 'table_name'>): Promise<Reservation> => {
    try {
      const response = await fetchWithAuth(`/reservations`, {
        method: 'POST',
        body: JSON.stringify(reservationData),
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creando reserva:', error);
      throw error;
    }
  },
  updateReservation: async (id: number, reservationData: Partial<Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'user_name' | 'table_name'>>): Promise<Reservation> => {
    try {      const response = await fetchWithAuth(`/reservations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reservationData),
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error actualizando reserva ${id}:`, error);
      throw error;
    }
  },  updateReservationStatus: async (id: number, status: Reservation['status']): Promise<Reservation> => {
    try {
      const response = await fetchWithAuth(`/reservations/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error actualizando estado de reserva ${id}:`, error);
      throw error;
    }
  },
  
  approveReservation: async (id: number): Promise<Reservation> => {
    try {
      const response = await fetchWithAuth(`/reservations/${id}/approve`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error aprobando reserva ${id}:`, error);
      throw error;
    }
  },

  rejectReservation: async (id: number, rejection_reason: string): Promise<Reservation> => {
    try {
      const response = await fetchWithAuth(`/reservations/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason }),
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error denegando reserva ${id}:`, error);
      throw error;
    }
  },
  
  deleteReservation: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await fetchWithAuth(`/reservations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error eliminando reserva ${id}:`, error);
      throw error;
    }  },
  
  // Función para eliminar múltiples reservas
  deleteMultipleReservations: async (ids: number[]): Promise<{ message: string }> => {
    try {
      // Validar que hay IDs para eliminar
      if (ids.length === 0) {
        return { message: "No hay reservas para eliminar" };
      }
      
      // Eliminar todas las reservas en secuencia
      const eliminadas = [];
      const fallidas = [];
      
      for (const id of ids) {
        try {
          const response = await fetchWithAuth(`/reservations/${id}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            eliminadas.push(id);
          } else {
            fallidas.push(id);
            console.error(`Error al eliminar reserva ${id}: ${response.status} ${response.statusText}`);
          }
        } catch (err) {
          fallidas.push(id);
          console.error(`Error al eliminar reserva ${id}:`, err);
          // Continuamos con las siguientes reservas aunque esta falle
        }
      }
      
      if (fallidas.length > 0) {
        console.warn(`No se pudieron eliminar ${fallidas.length} reservas: ${fallidas.join(', ')}`);
      }
      
      return { 
        message: `${eliminadas.length} de ${ids.length} reservas eliminadas correctamente${
          fallidas.length > 0 ? `. No se pudieron eliminar ${fallidas.length} reservas.` : ''
        }` 
      };
    } catch (error) {
      console.error(`Error eliminando múltiples reservas:`, error);
      throw error;
    }
  },
};

/**
 * Servicios para notificaciones
 */
export const notificationService = {
  // Obtener notificaciones del usuario actual
  getNotifications: async (unreadOnly = false, limit = 50): Promise<Notification[]> => {
    try {
      const params = new URLSearchParams({
        unread_only: unreadOnly.toString(),
        limit: limit.toString()
      });
      
      const response = await fetchWithAuth(`/notifications?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  },

  // Obtener conteo de notificaciones no leídas
  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    try {
      const response = await fetchWithAuth('/notifications/unread-count');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo conteo de notificaciones no leídas:', error);
      throw error;
    }
  },

  // Marcar notificación específica como leída
  markAsRead: async (notificationId: number): Promise<{ message: string }> => {
    try {
      const response = await fetchWithAuth(`/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error marcando notificación ${notificationId} como leída:`, error);
      throw error;
    }
  },

  // Marcar todas las notificaciones como leídas
  markAllAsRead: async (): Promise<{ message: string }> => {
    try {
      const response = await fetchWithAuth('/notifications/mark-all-read', {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
      throw error;
    }
  },

  // Eliminar notificación específica
  deleteNotification: async (notificationId: number): Promise<{ message: string }> => {
    try {
      const response = await fetchWithAuth(`/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error eliminando notificación ${notificationId}:`, error);
      throw error;
    }
  },
};
