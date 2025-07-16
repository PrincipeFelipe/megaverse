/**
 * Servicios para interactuar con la API
 */

import { User, Product, Reservation, Table, Notification } from '../types';
import { createModuleLogger } from '../utils/loggerExampleUsage';

// Crear logger específico para API
const apiLogger = createModuleLogger('API');

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
  const result = { ...(data as Record<string, unknown>) };
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
  apiLogger.debug('Realizando petición autenticada', { 
    endpoint: url, 
    method: options.method || 'GET',
    hasToken: !!token,
    fullUrl 
  });
  
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
    apiLogger.info('Iniciando proceso de login', { username });
    
    // Log para depuración de configuración
    apiLogger.debug('Configuración de API', { 
      API_URL, 
      API_PATH, 
      fullUrl: `${API_URL}/auth/login` 
    });
    
    const fullUrl = `${API_URL}/auth/login`;
    
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        apiLogger.error('Error en respuesta de login', { 
          status: response.status, 
          statusText: response.statusText,
          error 
        });
        throw new Error(error.error || 'Error al iniciar sesión');
      }
      
      const result = await response.json();
      apiLogger.info('Login exitoso', { username, userId: result.user?.id });
      return result;
    } catch (error) {
      if (error instanceof Error) {
        apiLogger.error('Excepción durante login', { 
          username, 
          error: error.message,
          stack: error.stack 
        });
      }
      throw error;
    }
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
    
    apiLogger.info('Iniciando registro de usuario', { 
      username, 
      email, 
      phone, 
      membershipDate: userData.membership_date 
    });
    
    const response = await fetch(`${API_URL}${API_PATH}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      apiLogger.error('Error en registro de usuario', { 
        status: response.status, 
        statusText: response.statusText, 
        error: error.error,
        username 
      });
      throw new Error(error.error || 'Error al registrarse');
    }

    const result = await response.json();
    apiLogger.info('Usuario registrado exitosamente', { 
      username, 
      userId: result.user?.id 
    });
    return result;
  },
  
  getProfile: async () => {
    apiLogger.debug('Obteniendo perfil del usuario');
    const response = await fetchWithAuth('/auth/me');
    
    if (!response.ok) {
      apiLogger.error('Error al obtener perfil', { 
        status: response.status, 
        statusText: response.statusText,
        endpoint: '/auth/me'
      });
      throw new Error('Error al obtener el perfil');
    }
    
    const profileData = await response.json();
    apiLogger.info('Perfil obtenido del servidor', { 
      username: profileData?.username,
      userId: profileData?.id,
      hasAvatar: !!profileData?.avatar_url
    });
    return profileData;
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
      const cleanedData: Record<string, unknown> = {};
      
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
      apiLogger.error('Error en updateProfile', { 
        error: error instanceof Error ? error.message : error,
        userData: Object.keys(userData),
        hasPassword: !!userData.current_password || !!userData.new_password
      });
      throw error;
    }
  }
};

// Servicios de productos
export const productService = {  
  getAllProducts: async () => {
    apiLogger.info('Obteniendo todos los productos');
    
    try {
      const response = await fetch(`${API_URL}${API_PATH}/products`);
      
      if (!response.ok) {
        apiLogger.error('Error en respuesta de productos', { 
          status: response.status, 
          statusText: response.statusText 
        });
        throw new Error('Error al obtener productos');
      }
      
      const data = await response.json();
      apiLogger.info('Productos obtenidos exitosamente', { 
        count: data.length 
      });
      
      // Asegurar que los valores numéricos como price y stock sean realmente números
      return data.map((product: unknown) => {
        const p = product as { 
          price?: unknown; 
          stock?: unknown; 
          [key: string]: unknown 
        };
        return {
          ...p,
          price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price)) || 0,
          stock: typeof p.stock === 'number' ? p.stock : parseInt(String(p.stock)) || 0
        };
      });
    } catch (error) {
      if (error instanceof Error) {
        apiLogger.error('Excepción al obtener productos', { 
          error: error.message,
          stack: error.stack 
        });
      }
      throw error;
    }
  },
  getProductById: async (id: number) => {
    apiLogger.debug('Obteniendo producto por ID', { productId: id });
    const response = await fetch(`${API_URL}${API_PATH}/products/${id}`);
    
    if (!response.ok) {
      apiLogger.error('Error al obtener producto por ID', { 
        productId: id,
        status: response.status,
        statusText: response.statusText
      });
      throw new Error('Error al obtener el producto');
    }
    
    const product = await response.json();
    apiLogger.info('Producto obtenido por ID', { 
      productId: id,
      productName: product?.name 
    });
    return product;
  },
  createProduct: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    apiLogger.debug('Creando nuevo producto', { 
      productName: productData.name,
      price: productData.price 
    });
    
    const response = await fetchWithAuth('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      apiLogger.error('Error al crear producto', { 
        productName: productData.name,
        error: error.error,
        status: response.status
      });
      throw new Error(error.error || 'Error al crear el producto');
    }
    
    const newProduct = await response.json();
    apiLogger.info('Producto creado exitosamente', { 
      productId: newProduct.id,
      productName: newProduct.name 
    });
    return newProduct;
  },
  
  updateProduct: async (id: number, productData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) => {
    apiLogger.debug('Actualizando producto', { 
      productId: id,
      fieldsToUpdate: Object.keys(productData) 
    });
    
    const response = await fetchWithAuth(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      apiLogger.error('Error al actualizar producto', { 
        productId: id,
        error: error.error,
        status: response.status
      });
      throw new Error(error.error || 'Error al actualizar el producto');
    }
    
    const updatedProduct = await response.json();
    apiLogger.info('Producto actualizado exitosamente', { 
      productId: id,
      productName: updatedProduct.name 
    });
    return updatedProduct;
  },
  
  deleteProduct: async (id: number) => {
    apiLogger.debug('Eliminando producto', { productId: id });
    
    const response = await fetchWithAuth(`/products/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      apiLogger.error('Error al eliminar producto', { 
        productId: id,
        error: error.error,
        status: response.status
      });
      throw new Error(error.error || 'Error al eliminar el producto');
    }
    
    const result = await response.json();
    apiLogger.info('Producto eliminado exitosamente', { productId: id });
    return result;
  }
};

// Servicios de mesas
export const tableService = {  
  getAllTables: async () => {
    apiLogger.debug('Obteniendo todas las mesas');
    const response = await fetch(`${API_URL}${API_PATH}/tables`);
    
    if (!response.ok) {
      apiLogger.error('Error al obtener mesas', { 
        status: response.status,
        statusText: response.statusText
      });
      throw new Error('Error al obtener mesas');
    }
    
    const tables = await response.json();
    apiLogger.info('Mesas obtenidas exitosamente', { count: tables.length });
    return tables;
  },
  getTableById: async (id: number) => {
    apiLogger.debug('Obteniendo mesa por ID', { tableId: id });
    const response = await fetch(`${API_URL}${API_PATH}/tables/${id}`);
    
    if (!response.ok) {
      apiLogger.error('Error al obtener mesa por ID', { 
        tableId: id,
        status: response.status,
        statusText: response.statusText
      });
      throw new Error('Error al obtener la mesa');
    }
    
    const table = await response.json();
    apiLogger.info('Mesa obtenida por ID', { 
      tableId: id,
      tableName: table?.name 
    });
    return table;
  }
};

// Servicios de reservas
export const reservationService = {
  getAllReservations: async () => {
    apiLogger.debug('Obteniendo todas las reservas');
    const response = await fetchWithAuth('/reservations');
    
    if (!response.ok) {
      apiLogger.error('Error al obtener reservas', { 
        status: response.status,
        statusText: response.statusText
      });
      throw new Error('Error al obtener reservas');
    }
    
    const reservations = await response.json();
    apiLogger.info('Reservas obtenidas exitosamente', { count: reservations.length });
    return reservations;
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
    apiLogger.debug('Creando nueva reserva', { 
      tableId: reservationData.tableId,
      startTime: reservationData.startTime,
      durationHours: reservationData.durationHours,
      allDay: reservationData.allDay
    });
    
    const response = await fetchWithAuth('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      apiLogger.error('Error al crear reserva', { 
        tableId: reservationData.tableId,
        error: error.error,
        status: response.status
      });
      throw new Error(error.error || 'Error al crear la reserva');
    }
    
    const newReservation = await response.json();
    apiLogger.info('Reserva creada exitosamente', { 
      reservationId: newReservation.id,
      tableId: reservationData.tableId 
    });
    return newReservation;
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
    apiLogger.debug('Actualizando reserva', { 
      reservationId: id,
      fieldsToUpdate: Object.keys(reservationData) 
    });
    
    const response = await fetchWithAuth(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reservationData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      apiLogger.error('Error al actualizar reserva', { 
        reservationId: id,
        error: error.error,
        status: response.status
      });
      throw new Error(error.error || 'Error al actualizar la reserva');
    }
    
    const updatedReservation = await response.json();
    apiLogger.info('Reserva actualizada exitosamente', { reservationId: id });
    return updatedReservation;
  },
  
  updateReservationStatus: async (id: number, status: 'active' | 'cancelled' | 'completed') => {
    apiLogger.debug('Actualizando estado de reserva', { 
      reservationId: id,
      newStatus: status 
    });
    
    const response = await fetchWithAuth(`/reservations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      const error = await response.json();
      apiLogger.error('Error al actualizar estado de reserva', { 
        reservationId: id,
        status,
        error: error.error,
        responseStatus: response.status
      });
      throw new Error(error.error || 'Error al actualizar la reserva');
    }
    
    const result = await response.json();
    apiLogger.info('Estado de reserva actualizado exitosamente', { 
      reservationId: id,
      newStatus: status 
    });
    return result;
  },
  
  deleteReservation: async (id: number) => {
    apiLogger.debug('Eliminando reserva', { reservationId: id });
    
    const response = await fetchWithAuth(`/reservations/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      apiLogger.error('Error al eliminar reserva', { 
        reservationId: id,
        error: error.error,
        status: response.status
      });
      throw new Error(error.error || 'Error al eliminar la reserva');
    }
    
    const result = await response.json();
    apiLogger.info('Reserva eliminada exitosamente', { reservationId: id });
    return result;
  }
};

// Servicios de consumos
export const consumptionService = {
  getAllConsumptions: async () => {
    apiLogger.debug('Obteniendo todos los consumos');
    const response = await fetchWithAuth('/consumptions');
    
    if (!response.ok) {
      apiLogger.error('Error al obtener consumos', { 
        status: response.status,
        statusText: response.statusText
      });
      throw new Error('Error al obtener consumos');
    }
    
    const consumptions = await response.json();
    apiLogger.info('Consumos obtenidos exitosamente', { count: consumptions.length });
    return consumptions;
    
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
      apiLogger.debug('getAllUsers - datos recibidos del servidor', { count: data?.length });
      if (data && data.length > 0) {
        apiLogger.debug('getAllUsers - primer usuario con campos críticos', {
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
        } catch {
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
