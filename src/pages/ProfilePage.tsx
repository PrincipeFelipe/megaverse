// Importaciones iniciales
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User as UserIcon, Phone, Calendar, Save, Trash2, Camera, X } from '../utils/icons';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User } from '../types';
import { uploadService, authService } from '../services/api';
import { showSuccess, showError, showLoading, closeLoading, showConfirm } from '../utils/alerts';
import { getAvatarUrl, handleAvatarError } from '../utils/avatar';

export const ProfilePage: React.FC = () => {
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);    const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dni: user?.dni || '',
    membership_date: user?.membership_date ? format(new Date(user.membership_date), 'yyyy-MM-dd') : '',
  });
  
  // Referencia para el input de archivo oculto
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar_url ? getAvatarUrl(user.avatar_url) : null
  );

  // Estado para guardar el archivo seleccionado
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        dni: user.dni || '',
        membership_date: user.membership_date ? format(new Date(user.membership_date), 'yyyy-MM-dd') : ''
      });
      
      // Manejar la URL del avatar
      if (user.avatar_url) {
        console.log(`Avatar URL del usuario: ${user.avatar_url}`);
        const avatarUrl = getAvatarUrl(user.avatar_url);
        console.log(`URL transformada: ${avatarUrl}`);
        setAvatarPreview(avatarUrl);
        
        // Precargamos la imagen para verificar si es válida
        const img = new Image();
        img.onload = () => {
          console.log("Avatar cargado correctamente");
        };
        img.onerror = () => {
          console.error("Error al cargar el avatar, la URL parece ser inválida");
          setAvatarPreview(null);
        };
        img.src = avatarUrl || '';
      } else {
        console.log("Usuario sin avatar");
        setAvatarPreview(null);
      }
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAvatarClick = () => {
    // Click en el input de archivo oculto
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verificar que sea una imagen aceptada
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showError(
          'Tipo de archivo no válido', 
          'Por favor, selecciona una imagen en formato JPG, PNG, GIF o WebP'
        );
        // Limpiar el input
        e.target.value = '';
        return;
      }
      
      // Verificar tamaño máximo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Archivo muy grande', 'El tamaño máximo permitido es de 5MB');
        // Limpiar el input
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      
      // Crear una URL para previsualizar la imagen
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleRemoveAvatar = async () => {
    // Si solo hay una previsualización local (no se ha guardado aún)
    if (selectedFile) {
      setSelectedFile(null);
      setAvatarPreview(user?.avatar_url ? getAvatarUrl(user.avatar_url) : null);
      return;
    }
    
    // Si ya hay un avatar guardado, confirmamos su eliminación
    const isConfirmed = await showConfirm(
      'Eliminar avatar',
      '¿Estás seguro de que deseas eliminar tu imagen de perfil?',
      'Eliminar',
      'Cancelar'
    );

    if (isConfirmed) {      
      try {
        setLoading(true);
        showLoading('Eliminando avatar...');
        
        await uploadService.deleteAvatar();
        // Recargar usuario manualmente para actualizar avatar
        await updateUserData();
        
        closeLoading();
        setAvatarPreview(null);
        showSuccess('Imagen eliminada', 'Tu avatar ha sido eliminado correctamente');
      } catch (error) {
        closeLoading();
        showError('Error', 'No se ha podido eliminar el avatar');
        console.error('Error al eliminar avatar:', error);
      } finally {
        setLoading(false);
      }
    }
  };  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      showLoading('Actualizando perfil...');
      
      // Primero subir el avatar si hay uno nuevo seleccionado
      if (selectedFile) {
        // Verificar restricciones de archivo antes de intentar subir
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(selectedFile.type)) {
          closeLoading();
          showError('Tipo de archivo no permitido', 'Solo se aceptan JPG, PNG, GIF y WebP');
          setLoading(false);
          return;
        }
        
        if (selectedFile.size > 5 * 1024 * 1024) {
          closeLoading();
          showError('Archivo demasiado grande', 'El tamaño máximo permitido es 5MB');
          setLoading(false);
          return;
        }
        
        // Subir avatar y actualizar el contexto de autenticación
        await uploadService.uploadAvatar(selectedFile);
        // Actualizar el usuario en el contexto
        await updateUserData();
      }
      
      // Obtener valores del formulario
      const currentPasswordInput = document.getElementById('current_password') as HTMLInputElement;
      const newPasswordInput = document.getElementById('new_password') as HTMLInputElement;
      const confirmPasswordInput = document.getElementById('confirm_password') as HTMLInputElement;
      
      let passwordData = {};
      
      // Verificar si se está intentando cambiar la contraseña
      if (newPasswordInput.value) {
        // Validar contraseña actual
        if (!currentPasswordInput.value) {
          closeLoading();
          showError('Error', 'Debes proporcionar tu contraseña actual para cambiarla');
          setLoading(false);
          return;
        }
        
        // Validar que las contraseñas coincidan
        if (newPasswordInput.value !== confirmPasswordInput.value) {
          closeLoading();
          showError('Error', 'Las contraseñas nuevas no coinciden');
          setLoading(false);
          return;
        }
        
        // Validar longitud mínima de la contraseña
        if (newPasswordInput.value.length < 6) {
          closeLoading();
          showError('Error', 'La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        
        passwordData = {
          current_password: currentPasswordInput.value,
          new_password: newPasswordInput.value,
        };
      }      // Preparar datos para la actualización - excluyendo los campos que no se pueden modificar
      const dataToUpdate = {
        email: formData.email,
        phone: formData.phone,
        dni: formData.dni,
        ...passwordData,
      };
      
      // Llamar a la API para actualizar el perfil
      await authService.updateProfile(dataToUpdate);
      
      // Actualizar el usuario en el contexto
      await updateUserData();
      
      // Limpiar campos de contraseña
      if (currentPasswordInput) currentPasswordInput.value = '';
      if (newPasswordInput) newPasswordInput.value = '';
      if (confirmPasswordInput) confirmPasswordInput.value = '';
      
      closeLoading();
      showSuccess('Perfil actualizado', 'Tus datos han sido actualizados correctamente');
      
      // Limpiar el archivo seleccionado
      setSelectedFile(null);
      
    } catch (error) {
      closeLoading();
      console.error('Error al actualizar el perfil:', error);
      showError('Error', error instanceof Error ? error.message : 'No se ha podido actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-8 text-center">Mi Perfil</h1>
          {/* Tarjeta de acceso rápido a historial de pagos */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Pagos de Consumiciones</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Realiza pagos y consulta el historial de tus consumiciones
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-2">
                <Link to="/payments/history">
                  <Button>
                    Ver historial de pagos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Avatar */}
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div 
                  className="avatar avatar-profile relative cursor-pointer group mb-4"
                  onClick={handleAvatarClick}
                >                  {avatarPreview ? (
                    <>
                      <img 
                        src={avatarPreview} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        onLoad={() => console.log('Avatar cargado exitosamente en ProfilePage')}
                        onError={(e) => {
                          console.error(`Error al cargar avatar desde URL: ${avatarPreview}`);
                          console.error('URL original del usuario:', user?.avatar_url);
                          
                          // Si es posible, intentar con la URL directa a través de getAvatarUrl
                          if (user?.avatar_url && avatarPreview !== getAvatarUrl(user.avatar_url)) {
                            const directUrl = getAvatarUrl(user.avatar_url);
                            console.log(`Intentando con URL directa: ${directUrl}`);
                            if (directUrl) {
                              setAvatarPreview(directUrl);
                              return;
                            }
                          }
                          
                          // Fallback a placeholder si la carga falla y no hay alternativa
                          setAvatarPreview(null);
                        }}
                      />
                      <div className="avatar-upload-icon">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ): (
                    <>
                      <div className="flex items-center justify-center w-full h-full bg-dark-800 text-gray-400">
                        <UserIcon className="w-12 h-12" />
                      </div>
                      <div className="avatar-upload-icon">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                
                <div className="flex space-x-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarClick}
                    disabled={loading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {avatarPreview ? 'Cambiar' : 'Subir'}
                  </Button>
                  
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 text-center">
                  JPG, PNG, GIF o WebP. Max 5MB.
                </p>
              </div>
              
              {/* Profile Info */}
              <div className="w-full md:w-2/3">
                <form onSubmit={handleSubmit} className="space-y-4">                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Nombre completo
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      readOnly
                      disabled
                      placeholder="Tu nombre"
                      className="bg-dark-700 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Este campo no puede ser modificado</p>
                  </div>
                  
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-1">
                      Nombre de usuario
                    </label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      readOnly
                      disabled
                      placeholder="Nombre de usuario"
                      className="bg-dark-700 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Este campo no puede ser modificado</p>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Correo electrónico
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                    <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1">
                      Teléfono
                    </label>                    <div className="relative">
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        placeholder="+34 600000000"
                        className="pl-10"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Phone className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="dni" className="block text-sm font-medium mb-1">
                      DNI/NIE
                    </label>
                    <div className="relative">
                      <Input
                        id="dni"
                        name="dni"
                        value={formData.dni || ''}
                        onChange={handleInputChange}
                        placeholder="12345678X"
                      />
                    </div>
                  </div>
                    <div>
                    <label htmlFor="membership_date" className="block text-sm font-medium mb-1">
                      Fecha de alta como socio
                    </label>                    <div className="relative">
                      <Input
                        id="membership_date"
                        name="membership_date"
                        type="date"
                        value={formData.membership_date || ''}
                        readOnly
                        disabled
                        className="bg-dark-700 cursor-not-allowed pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Este campo no puede ser modificado</p>
                  </div>
                  
                  <div className="pt-6 border-t border-dark-600">
                    <h3 className="text-lg font-medium mb-4">Cambiar contraseña</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="current_password" className="block text-sm font-medium mb-1">
                          Contraseña actual
                        </label>
                        <Input
                          id="current_password"
                          type="password"
                          placeholder="Introduce tu contraseña actual"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="new_password" className="block text-sm font-medium mb-1">
                          Nueva contraseña
                        </label>
                        <Input
                          id="new_password"
                          type="password"
                          placeholder="Al menos 6 caracteres"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="confirm_password" className="block text-sm font-medium mb-1">
                          Confirmar contraseña
                        </label>
                        <Input
                          id="confirm_password"
                          type="password"
                          placeholder="Repite la nueva contraseña"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar cambios
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
