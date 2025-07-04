import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from '../utils/icons';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const initialFormData = {
    name: '',
    username: '',
    email: '',
    phone: '',
    dni: '',
    password: '',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        // Validación de campos obligatorios
        if (!formData.username) {
          setErrors({ username: 'El nombre de usuario es obligatorio' });
          setLoading(false);
          return;
        }
        
        if (!formData.password) {
          setErrors({ password: 'La contraseña es obligatoria' });
          setLoading(false);
          return;
        }
        
        const success = await login(formData.username, formData.password);
        if (success) {
          navigate('/dashboard');
        }
      } else {
        // Validación para el registro
        if (!formData.name) {
          setErrors({ name: 'El nombre es obligatorio' });
          setLoading(false);
          return;
        }
        
        if (!formData.username) {
          setErrors({ username: 'El nombre de usuario es obligatorio' });
          setLoading(false);
          return;
        }
        
        if (!formData.email) {
          setErrors({ email: 'El email es obligatorio' });
          setLoading(false);
          return;
        }
        
        if (!formData.phone) {
          setErrors({ phone: 'El teléfono es obligatorio' });
          setLoading(false);
          return;
        }
        
        if (!formData.dni) {
          setErrors({ dni: 'El DNI/NIE es obligatorio' });
          setLoading(false);
          return;
        }
        
        if (!formData.password) {
          setErrors({ password: 'La contraseña es obligatoria' });
          setLoading(false);
          return;
        }
        
        try {
          await register(formData.name, formData.username, formData.email, formData.phone, formData.dni, formData.password);
          // Mostrar mensaje de éxito
          setSuccess(true);
          setSuccessMessage('Tu cuenta ha sido registrada correctamente. Un administrador deberá activarla antes de que puedas iniciar sesión.');
          // Limpiar el formulario
          setFormData(initialFormData);
          // Cambiar a la pestaña de login
          setActiveTab('login');
        } catch (registerError) {
          const errorMessage = registerError instanceof Error ? registerError.message : 'Error al registrarse. Inténtalo de nuevo.';
          setErrors({ 
            general: errorMessage
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión. Inténtalo de nuevo.';
      console.log('Error capturado en AuthPage:', error);
      setErrors({ 
        general: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-megaverse-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-10 w-48 h-48 border-2 border-primary-400/20 rounded-full backdrop-blur-sm"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 0.9, 1]
          }}
          transition={{ 
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-10 w-64 h-64 border-2 border-secondary-300/20 rounded-full backdrop-blur-sm"
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="p-6 sm:p-8 backdrop-blur-md bg-dark-800/80 border border-dark-700 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex justify-center mb-3"
            >
              <div className="p-3 bg-dark-700 border border-primary-500/50 rounded-full shadow-lg">
                <img src="/images/logo.svg" alt="Megaverse Logo" className="w-10 h-10" />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-secondary-300 text-sm">
              {isLogin ? 'Accede a tu cuenta de MEGAVERSE' : 'Únete a la comunidad MEGAVERSE'}
            </p>
          </div>

          {/* Mensaje de éxito */}
          {success && successMessage && (
            <div className="p-4 bg-green-900/30 border border-green-500/50 text-green-400 rounded-lg backdrop-blur-sm mb-4">
              {successMessage}
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg backdrop-blur-sm mb-4">
                {errors.general}
              </div>
            )}

            {!isLogin ? (
              <>
                {/* Diseño de 2 columnas para el formulario de registro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Nombre completo"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={errors.name}
                      required
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Nombre de usuario"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      error={errors.username}
                      required
                      placeholder="Tu nombre de usuario"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                      required
                      placeholder="tu@email.com"
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Teléfono"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={errors.phone}
                      required
                      placeholder="612345678"
                    />
                  </div>
                </div>
                
                <div>
                  <Input
                    label="DNI/NIE"
                    name="dni"
                    type="text"
                    value={formData.dni}
                    onChange={handleInputChange}
                    error={errors.dni}
                    required
                    placeholder="12345678X"
                  />
                </div>
              </>
            ) : (
              <div>
                <Input
                  label="Nombre de usuario"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  error={errors.username}
                  required
                  placeholder="Tu nombre de usuario"
                />
              </div>
            )}

            <div className="relative">
              <Input
                label="Contraseña"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                required
                placeholder="Tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              size="md"
              disabled={loading}
              className="w-full mt-4"
            >
              {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                const newIsLogin = !isLogin;
                setIsLogin(newIsLogin);
                setActiveTab(newIsLogin ? 'login' : 'register');
                setErrors({});
                setSuccess(false);
                setSuccessMessage('');
              }}
              className="text-primary-500 hover:text-primary-400 font-medium transition-colors duration-200 text-sm"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
          
          <div className="mt-5 pt-4 border-t border-dark-600 text-center">
            <p className="text-xs text-dark-300">
              MEGAVERSE - Asociación de Ocio y Gaming
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};