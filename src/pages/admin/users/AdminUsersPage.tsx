import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminTable } from '../../../components/admin/AdminTable';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { AdminForm } from '../../../components/admin/AdminForm';
import { User } from '../../../types';
import { adminUserService } from '../../../services/api';
import { Pencil, Trash2, Plus as PlusIcon } from 'lucide-react';
import { showDangerConfirm, showSuccess, showError, showLoading, closeLoading } from '../../../utils/alerts';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    dni: '',
    membership_date: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getAllUsers();
      
      // Verificar si los datos recibidos tienen los campos phone, dni y membership_date
      if (data && data.length > 0) {
        console.log('Ejemplo de usuario recibido:', data[0]);
        console.log('Campos críticos en usuario recibido:', {
          phone: data[0].phone !== undefined ? 'SÍ' : 'NO',
          dni: data[0].dni !== undefined ? 'SÍ' : 'NO',
          membership_date: data[0].membership_date !== undefined ? 'SÍ' : 'NO',
          is_active: data[0].is_active !== undefined ? 'SÍ' : 'NO',
          is_active_value: data[0].is_active,
          is_active_type: typeof data[0].is_active
        });
        
        // Revisar todos los usuarios
        console.log('Estado de todos los usuarios:');
        data.forEach((user: User) => {
          console.log(`Usuario ${user.id} (${user.name}): is_active = ${user.is_active} (${typeof user.is_active})`);
        });
      }
      
      // Contar usuarios pendientes de activación
      const inactiveUsers = data.filter(user => !user.is_active);
      setPendingUsers(inactiveUsers.length);
      
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar usuarios: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Efecto para filtrar usuarios basado en activeFilter
  useEffect(() => {
    if (!users.length) {
      setFilteredUsers([]);
      return;
    }

    if (activeFilter === 'all') {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => {
      if (activeFilter === 'active') return user.is_active;
      if (activeFilter === 'pending') return !user.is_active;
      return true;
    });
    
    setFilteredUsers(filtered);
  }, [users, activeFilter]);

  const handleOpenModal = (user: User | null = null) => {    if (user) {
      setIsEditMode(true);
      setSelectedUser(user);      setFormValues({
        name: user.name,
        username: user.username || '',
        email: user.email || '',
        password: '', // No establecemos la contraseña para edición
        role: user.role,
        phone: user.phone || '',
        dni: user.dni || '',
        membership_date: user.membership_date || ''
      });
    } else {
      setIsEditMode(false);
      setSelectedUser(null);      setFormValues({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
        phone: '',
        dni: '',
        membership_date: ''
      });
    }
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const handleInputChange = (name: string, value: string | number | boolean | File | null) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formValues.email)) {
      showError('Error', 'El formato del correo electrónico no es válido');
      return;
    }
    
    // Validar formato de teléfono (permite formato internacional +XX XXXXXXXXX)
    const phoneRegex = /^\+?[\d\s]{6,15}$/;
    if (formValues.phone && !phoneRegex.test(formValues.phone)) {
      showError('Error', 'El formato del número de teléfono no es válido');
      return;
    }
    
    // Validar formato de DNI/NIE (8 números y letra o letra + 7 números + letra)
    if (formValues.dni) {
      const dniRegex = /^[0-9]{8}[A-Za-z]$|^[XYZxyz][0-9]{7}[A-Za-z]$/;
      if (!dniRegex.test(formValues.dni)) {
        showError('Error', 'El formato del DNI/NIE no es válido');
        return;
      }
    }
    
    try {
      setLoading(true);
      showLoading(isEditMode ? 'Actualizando usuario...' : 'Creando usuario...');
      
      if (isEditMode && selectedUser) {        // Actualizamos usuario
        const userData = {
          name: formValues.name,
          username: formValues.username,
          email: formValues.email,
          role: formValues.role as 'admin' | 'user',
          phone: formValues.phone,
          dni: formValues.dni,
          membership_date: formValues.membership_date
        };
        
        // Si hay contraseña, la incluimos
        if (formValues.password) {
          Object.assign(userData, { password: formValues.password });
        }
        
        await adminUserService.updateUser(selectedUser.id, userData);
        closeLoading();
        showSuccess(
          'Usuario actualizado', 
          `El usuario "${formValues.name}" ha sido actualizado correctamente`
        );
      } else {        // Creamos usuario nuevo
        const newUserData = {
          name: formValues.name,
          username: formValues.username,
          email: formValues.email,
          password: formValues.password,
          role: formValues.role as 'admin' | 'user',
          phone: formValues.phone,
          dni: formValues.dni,
          membership_date: formValues.membership_date,
          is_active: true // Los usuarios creados desde el panel de admin son activos por defecto
        };
        
        const createdUser = await adminUserService.createUser(newUserData);
        console.log('Usuario creado:', createdUser);
        
        // Verificar si se guardaron los campos
        console.log('Campos guardados:', {
          phone: createdUser.phone !== undefined ? 'SÍ' : 'NO',
          dni: createdUser.dni !== undefined ? 'SÍ' : 'NO',
          membership_date: createdUser.membership_date !== undefined ? 'SÍ' : 'NO'
        });
        
        closeLoading();
        showSuccess(
          'Usuario creado', 
          `El usuario "${formValues.name}" ha sido creado correctamente`
        );
      }
      // Recargamos la lista de usuarios
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      closeLoading();
      showError('Error', (err as Error).message);
      setFormError('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteUser = async (userId: number) => {
    const isConfirmed = await showDangerConfirm(
      'Eliminar usuario',
      '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.',
      'Eliminar',
      'Cancelar'
    );
    
    if (isConfirmed) {
      try {
        showLoading('Eliminando usuario...');
        await adminUserService.deleteUser(userId);
        closeLoading();
        showSuccess('Usuario eliminado', 'El usuario ha sido eliminado correctamente');
        fetchUsers(); // Recargamos la lista tras eliminar
      } catch (err) {
        closeLoading();
        showError('Error', 'Error al eliminar usuario: ' + (err as Error).message);
        setError('Error al eliminar usuario: ' + (err as Error).message);
      }
    }
  };  const formFields = [
    { name: 'name', label: 'Nombre', type: 'text' as const, required: true, placeholder: 'Nombre completo' },
    { name: 'username', label: 'Nombre de usuario', type: 'text' as const, required: true, placeholder: 'nombreusuario' },
    { name: 'email', label: 'Email', type: 'email' as const, required: true, placeholder: 'correo@ejemplo.com' },
    { name: 'password', label: isEditMode ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña', type: 'password' as const, required: !isEditMode, placeholder: '••••••••' },
    { 
      name: 'role', 
      label: 'Rol', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'user', label: 'Usuario' },
        { value: 'admin', label: 'Administrador' }
      ] 
    },    
    { name: 'phone', label: 'Teléfono', type: 'tel' as const, required: true, placeholder: '+34 600000000' },
    { name: 'dni', label: 'DNI/NIE', type: 'text' as const, required: false, placeholder: '12345678X' },
    { name: 'membership_date', label: 'Fecha de alta', type: 'date' as const, required: false }
  ];  const columns = [
    { header: 'ID', accessor: 'id' as keyof User },
    { header: 'Nombre', accessor: 'name' as keyof User },
    { header: 'Nombre de usuario', accessor: 'username' as keyof User },
    { header: 'Email', accessor: 'email' as keyof User },
    { 
      header: 'Rol', 
      accessor: (user: User) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.role === 'admin' 
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }`}>
          {user.role === 'admin' ? 'Admin' : 'Usuario'}
        </span>
      )
    },
    {
      header: 'Estado',
      accessor: (user: User) => {
        console.log(`Renderizando estado para usuario ${user.id}: is_active = ${user.is_active} (${typeof user.is_active})`);
        // Asegurarse de que is_active sea un booleano (podría venir como 1/0 desde la BD)
        const isActive = Boolean(user.is_active);
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        );
      }
    },
    { header: 'Teléfono', accessor: 'phone' as keyof User },
    { header: 'DNI/NIE', accessor: 'dni' as keyof User },
    { 
      header: 'Fecha de alta', 
      accessor: (user: User) => user.membership_date ? new Date(user.membership_date).toLocaleDateString() : '-'
    }
  ];

  const handleToggleUserActive = async (userId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const actionText = newStatus ? 'Activar' : 'Desactivar';
    
    const isConfirmed = await showDangerConfirm(
      `${actionText} usuario`,
      `¿Estás seguro de que deseas ${actionText.toLowerCase()} este usuario?`,
      actionText,
      'Cancelar'
    );
    
    if (isConfirmed) {
      try {
        showLoading(`${actionText} usuario...`);
        await adminUserService.toggleUserActive(userId, newStatus);
        closeLoading();
        showSuccess(`Usuario ${newStatus ? 'activado' : 'desactivado'}`, 
          `El usuario ha sido ${newStatus ? 'activado' : 'desactivado'} correctamente`);
        fetchUsers(); // Recargamos la lista tras el cambio
      } catch (err) {
        closeLoading();
        showError('Error', `Error al ${actionText.toLowerCase()} usuario: ` + (err as Error).message);
      }
    }
  };
  
  const renderActions = (user: User) => (
    <div className="flex justify-end space-x-2">      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => handleOpenModal(user)}
        title="Editar usuario"
      >
        <Pencil className="w-4 h-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => handleToggleUserActive(user.id, user.is_active)}
        title={user.is_active ? "Desactivar usuario" : "Activar usuario"}
      >
        {user.is_active ? (
          <span className="w-4 h-4 text-red-500">🚫</span> // Desactivar
        ) : (
          <span className="w-4 h-4 text-green-500">✓</span> // Activar
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => handleDeleteUser(user.id)}
        title="Eliminar usuario"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </div>
  );

  return (
    <AdminLayout title="Administrar Usuarios">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona los usuarios del sistema
        </p>
        <Button 
          onClick={() => handleOpenModal()}
          className="flex items-center"
        >          <PlusIcon className="w-5 h-5 mr-1" />
          Nuevo Usuario
        </Button>
      </div>

      {pendingUsers > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-grow">
              <h3 className="text-sm font-medium text-yellow-800">
                Usuarios pendientes de activación
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {pendingUsers === 1 
                    ? 'Hay 1 usuario pendiente de activación.' 
                    : `Hay ${pendingUsers} usuarios pendientes de activación.`}
                </p>
              </div>
            </div>
            <div>
              <Button 
                onClick={() => setActiveFilter('pending')}
                size="sm"
                variant="secondary"
              >
                Ver usuarios pendientes
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex space-x-2">
        <Button 
          onClick={() => setActiveFilter('all')}
          size="sm"
          variant={activeFilter === 'all' ? 'primary' : 'outline'}
        >
          Todos los usuarios
        </Button>
        <Button 
          onClick={() => setActiveFilter('active')}
          size="sm"
          variant={activeFilter === 'active' ? 'primary' : 'outline'}
        >
          Usuarios activos
        </Button>
        <Button 
          onClick={() => setActiveFilter('pending')}
          size="sm"
          variant={activeFilter === 'pending' ? 'primary' : 'outline'}
        >
          Pendientes de activación ({pendingUsers})
        </Button>
      </div>

      {/* Filtros de usuario */}
      {/* Filtros ya están implementados arriba, eliminamos esta sección duplicada */}

      <AdminTable
        columns={columns}
        data={filteredUsers}
        actions={renderActions}
        keyExtractor={(user) => user.id}
        loading={loading}
        error={error}
        emptyMessage="No hay usuarios registrados"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditMode ? "Editar Usuario" : "Crear Usuario"}
      >
        <AdminForm
          fields={formFields}
          values={formValues}
          onChange={handleInputChange}
          onSubmit={handleSubmitForm}
          submitText={isEditMode ? "Guardar Cambios" : "Crear Usuario"}
          loading={loading}
          error={formError}
        />
      </Modal>
    </AdminLayout>
  );
};
