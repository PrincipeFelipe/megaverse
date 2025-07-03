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
import { AvatarPreview } from '../../../components/admin/AvatarPreview';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);  const [formValues, setFormValues] = useState({
    avatar: null as File | null,
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    dni: '',
    membership_date: '',
    balance: '0.00'
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getAllUsers();
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
  const handleOpenModal = (user: User | null = null) => {    if (user) {
      setIsEditMode(true);
      setSelectedUser(user);      setFormValues({
        avatar: null, // No cargamos el avatar en edición
        name: user.name,
        username: user.username || '',
        email: user.email || '',
        password: '', // No establecemos la contraseña para edición
        role: user.role,
        phone: user.phone || '',
        dni: user.dni || '',
        membership_date: user.membership_date || '',
        balance: user.balance.toString()
      });
    } else {
      setIsEditMode(false);
      setSelectedUser(null);      setFormValues({
        avatar: null,
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
        phone: '',
        dni: '',
        membership_date: '',
        balance: '0.00'
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
      
      // Procesamos el avatar si existe
      let avatarUrl = null;
      if (formValues.avatar) {
        const formData = new FormData();
        formData.append('avatar', formValues.avatar);
        
        try {
          // Subir avatar
          const uploadResponse = await fetch('/api/uploads/avatar', {
            method: 'POST',
            body: formData,
            // No incluir Content-Type, se establece automáticamente con FormData
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            avatarUrl = uploadResult.url;
          }
        } catch (uploadError) {
          console.error('Error al subir avatar:', uploadError);
        }
      }
      
      if (isEditMode && selectedUser) {        // Actualizamos usuario
        const userData = {
          name: formValues.name,
          username: formValues.username,
          email: formValues.email,
          role: formValues.role as 'admin' | 'user',
          phone: formValues.phone,
          dni: formValues.dni,
          membership_date: formValues.membership_date,
          balance: parseFloat(formValues.balance)
        };
        
        // Si se ha cargado un avatar, lo incluimos
        if (avatarUrl) {
          Object.assign(userData, { avatar_url: avatarUrl });
        }
        
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
          balance: parseFloat(formValues.balance) // Convertir string a número
        };
        
        // Si se ha cargado un avatar, lo incluimos
        if (avatarUrl) {
          Object.assign(newUserData, { avatar_url: avatarUrl });
        }
        
        await adminUserService.createUser(newUserData);
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
    { name: 'avatar', label: 'Imagen de perfil', type: 'file' as const, required: false, accept: 'image/*' },
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
    { name: 'membership_date', label: 'Fecha de alta', type: 'date' as const, required: false },
    { name: 'balance', label: 'Saldo inicial (€)', type: 'number' as const, required: false, placeholder: '0.00', step: 0.01, min: 0 }
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
    { header: 'Teléfono', accessor: 'phone' as keyof User },
    { header: 'DNI/NIE', accessor: 'dni' as keyof User },
    { 
      header: 'Fecha de alta', 
      accessor: (user: User) => user.membership_date ? new Date(user.membership_date).toLocaleDateString() : '-'
    }
  ];

  const renderActions = (user: User) => (
    <div className="flex justify-end space-x-2">      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => handleOpenModal(user)}
      >
        <Pencil className="w-4 h-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => handleDeleteUser(user.id)}
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

      <AdminTable
        columns={columns}
        data={users}
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
