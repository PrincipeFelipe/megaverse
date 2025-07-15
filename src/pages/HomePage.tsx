import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Calendar, Trophy, Coffee, Shield, Info } from '../utils/icons';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Comunidad Gaming',
      description: 'Únete a nuestra comunidad de jugadores apasionados por los juegos de mesa y wargames.',
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Sistema de Reservas',
      description: 'Reserva tu mesa favorita para tus partidas épicas de Warhammer 40K y otros juegos.',
    },
    {
      icon: <Coffee className="w-8 h-8" />,
      title: 'Productos & Snacks',
      description: 'Disfruta de refrescos y snacks mientras juegas. Sistema de consumo integrado.',
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Torneos & Eventos',
      description: 'Participa en torneos organizados y eventos especiales para la comunidad.',
    },
  ];

  const stats = [
    { number: '150+', label: 'Miembros Activos' },
    { number: '3', label: 'Mesas de Juego' },
    { number: '50+', label: 'Juegos Disponibles' },
    { number: '24/7', label: 'Disponibilidad' },
  ];

  return (
    <div className="min-h-screen bg-megaverse-gradient-dark">
      {/* Hero Section */}
      <section className="relative px-4 py-12 sm:py-16 md:py-20 sm:px-6 lg:px-8 min-h-[calc(100vh-64px)] flex items-center">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-center mb-6 md:mb-8"
            >
              <div className="p-3 md:p-4 bg-dark-800/80 backdrop-blur-lg shadow-xl rounded-full border border-primary-500/50">
                <img src="/images/logo.svg" alt="Megaverse Logo" className="w-16 md:w-20 h-16 md:h-20" />
              </div>
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 relative z-10">
              Bienvenido a{' '}
              <span className="text-megaverse-gradient">
                MEGAVERSE
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto bg-dark-900/30 md:bg-transparent backdrop-blur-md md:backdrop-blur-none py-2 px-4 md:p-0 rounded-lg relative z-10">
              La asociación de ocio definitiva para los amantes de los juegos de mesa, wargames y especialmente Warhammer 40.000. 
              Únete a nuestra comunidad y vive experiencias épicas.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {!isLoggedIn && (
                <Link to="/auth">
                  <Button size="lg" className="min-w-[200px]">
                    <Shield className="w-5 h-5 mr-2" />
                    Únete Ahora
                  </Button>
                </Link>
              )}
              {isLoggedIn && (
                <Link to="/reservations">
                  <Button variant="outline" size="lg" className="min-w-[200px]">
                    <Calendar className="w-5 h-5 mr-2" />
                    Ver Reservas
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 left-10 w-32 h-32 border-2 border-primary-400/30 rounded-full backdrop-blur-sm"
          />
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1, 0.9, 1]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-20 right-10 w-40 h-40 border-2 border-secondary-300/30 rounded-full backdrop-blur-sm"
          />
          <motion.div
            animate={{ 
              rotate: 180,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-40 right-20 w-24 h-24 border border-primary-500/20 rounded-full backdrop-blur-sm"
          />
          <motion.div
            animate={{ 
              rotate: -180,
              scale: [1, 0.8, 1]
            }}
            transition={{ 
              duration: 28,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-40 left-20 w-36 h-36 border border-secondary-400/20 rounded-full backdrop-blur-sm"
          />
        </div>
        
        {/* Fondo estático simplificado para dispositivos móviles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none md:hidden">
          <div className="absolute top-20 left-10 w-24 h-24 border-2 border-primary-400/20 rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 border-2 border-secondary-300/20 rounded-full"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 relative z-10">
              ¿Por qué elegir MEGAVERSE?
            </h2>
            <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto bg-dark-900/30 md:bg-transparent py-2 px-4 md:p-0 rounded-lg">
              Ofrecemos la mejor experiencia gaming con instalaciones de primera y una comunidad increíble.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-4 md:p-6 h-full text-center">
                  <div className="text-primary-400 mb-3 md:mb-4 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-dark-700 dark:text-secondary-300 mb-2 md:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-dark-500 dark:text-gray-400 text-sm md:text-base">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-4 md:p-8 rounded-xl bg-dark-700/80 md:bg-dark-700/50 backdrop-blur-none md:backdrop-blur-sm border border-dark-600/50 shadow-lg"
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-megaverse-gradient mb-1 md:mb-2">
                  {stat.number}
                </div>
                <div className="text-secondary-300 font-medium text-sm md:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Solo visible para usuarios no logueados */}
      {!isLoggedIn && (
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-megaverse-gradient-soft">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="p-6 md:p-10 rounded-2xl bg-dark-800/90 md:bg-dark-800/70 backdrop-blur-none md:backdrop-blur-lg border border-primary-500/30 shadow-xl"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">
                ¡ÚNETE <span className="text-megaverse-gradient">AHORA</span>!
              </h2>
              <p className="text-secondary-300 text-base md:text-lg mb-6 md:mb-8">
                Únete a MEGAVERSE y forma parte de la mejor comunidad gaming. 
                Reserva tu primera mesa y comienza tu aventura épica.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:min-w-[180px] shadow-lg">
                    <Shield className="w-5 h-5 mr-2" />
                    Comenzar Ahora
                  </Button>
                </Link>
                <Link to="/about" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:min-w-[180px] shadow-lg bg-dark-800/80 backdrop-blur-sm hover:bg-dark-700">
                    <Info className="w-5 h-5 mr-2" />
                    Conócenos
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};