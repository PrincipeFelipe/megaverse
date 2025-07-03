import React, { useState, useEffect } from 'react';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useNotifications } from '../../hooks/useNotifications';

interface User {
  id: number;
  name: string;
}

interface UserSelectorProps {
  onUserSelected: (userId: number) => void;
  onCancel: () => void;
  currentUserId?: number;
  title?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ 
  onUserSelected, 
  onCancel, 
  currentUserId, 
  title = "Seleccionar Usuario"
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Obteniendo lista de usuarios...');
        
        // Importar dinámicamente fetchWithAuth para evitar problemas de importación circular
        const { fetchWithAuth } = await import('../../services/api');
        
        // Obtener usuarios desde la API usando fetchWithAuth para incluir el token de autenticación
        // Usando la nueva ruta específica para selección que no requiere ser admin
        const response = await fetchWithAuth('/users/list-for-selection');
        
        // Verificar si hay un error de permisos (403) o cualquier otro error
        if (!response.ok) {
          const errorMessage = response.status === 403 
            ? 'No tienes permisos suficientes para cargar la lista de usuarios.'
            : `Error ${response.status}: ${response.statusText}`;
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log(`Se han obtenido ${data.length} usuarios`);
        
        // Verificar que tenemos un array con la estructura esperada
        if (Array.isArray(data) && data.length > 0) {
          // Ordenar usuarios por nombre para facilitar la búsqueda
          const sortedUsers = data.sort((a, b) => a.name.localeCompare(b.name));
          setUsers(sortedUsers);
          
          // Si hay un usuario actual, seleccionarlo por defecto
          if (currentUserId) {
            console.log(`Seleccionando usuario actual con ID: ${currentUserId}`);
            setSelectedUserId(currentUserId);
          }
        } else {
          console.warn('La respuesta de usuarios no tiene el formato esperado:', data);
          setError('No se encontraron usuarios para mostrar');
          addNotification({
            type: 'warning',
            title: 'Advertencia',
            message: 'No se encontraron usuarios para mostrar'
          });
        }
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
        const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar los usuarios';
        setError(errorMessage);
        
        addNotification({
          type: 'error',
          title: 'Error',
          message: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUserId, addNotification]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUserId === '') {
      addNotification({
        type: 'warning',
        title: 'Advertencia',
        message: 'Por favor, selecciona un usuario'
      });
      return;
    }
    
    onUserSelected(Number(selectedUserId));
  };

  // Filtrar usuarios según el término de búsqueda
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-primary-600 dark:text-primary-400">{title}</h2>
        <button 
          onClick={onCancel} 
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400">Cargando usuarios...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Button onClick={onCancel} color="secondary" className="w-full">
              Cerrar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Buscador de usuarios */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white bg-white dark:bg-dark-800"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="user-select" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Seleccionar usuario
            </label>
            <Select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              required
              className={`${filteredUsers.length > 8 ? 'h-12' : ''}`}
            >
              <option value="">-- Seleccionar usuario --</option>
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
            <div className="text-xs text-gray-500 mt-1">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
            <Button 
              type="button" 
              onClick={onCancel}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button type="submit" color="primary">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar
              </span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
