import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Users, Trophy, Shield, Calendar, Coffee, Info } from '../utils/icons';
import { useAuth } from '../contexts/AuthContext';

export const AboutPage: React.FC = () => {
  // Importar el contexto de autenticación para verificar si el usuario está logueado
  const { user } = useAuth();
  
  // Datos sobre la asociación
  const teamMembers = [
    {
      name: 'Presidente García',
      role: 'Presidente',
      bio: 'Aficionado al modelismo y juegos de mesa desde hace 20 años. Fundador de MEGAVERSE.'
    },
    {
      name: 'Secretario López',
      role: 'Secretario',
      bio: 'Experta en organización de torneos y eventos. Cinco años de experiencia en gestión de comunidades gaming.'
    },
    {
      name: 'Tesorero Sánchez',
      role: 'Tesorero',
      bio: 'Responsable de la gestión económica. Jugador profesional de Warhammer 40K con múltiples premios regionales.'
    },

  ];

  const milestones = [
    { year: '2015', event: 'Fundación de la asociación MEGAVERSE' },
    { year: '2017', event: 'Apertura de la primera sede social' },
    { year: '2019', event: 'Expansión de instalaciones y primera liga oficial' },
    { year: '2021', event: 'Renovación tecnológica y lanzamiento de la plataforma digital' },
    { year: '2023', event: 'Alcance de 150+ miembros activos y nuevos servicios' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
            <Info className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Sobre Nosotros
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Conoce más sobre MEGAVERSE, nuestra misión y las personas detrás de la mejor asociación de juegos de mesa y wargames.
          </p>
        </motion.div>

        {/* Historia y Misión */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <Card className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Nuestra Historia
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  MEGAVERSE nació en 2015 de la pasión compartida por un grupo de amigos que querían crear un espacio donde los amantes de los juegos de mesa y wargames pudieran reunirse, compartir experiencias y disfrutar de su hobby favorito.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Lo que comenzó como pequeñas reuniones en un local alquilado ha crecido hasta convertirse en una de las asociaciones más importantes de la región, con instalaciones propias, torneos regulares y una comunidad vibrante de más de 150 miembros.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Con el tiempo, hemos expandido nuestras actividades para incluir modelismo, pintura, juegos de rol y eventos especiales, siempre manteniendo como núcleo nuestra pasión por Warhammer 40.000 y otros juegos estratégicos.
                </p>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Nuestra Misión
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Comunidad</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        Construir una comunidad inclusiva donde todos los jugadores, desde principiantes hasta veteranos, se sientan bienvenidos y respetados.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                      <Trophy className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Excelencia</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        Promover la mejora continua, tanto en el juego como en nuestras instalaciones y servicios para los miembros.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                      <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Pasión</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        Mantener viva la pasión por los juegos de mesa, wargames y el hobby del modelismo a través de eventos, torneos y actividades regulares.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Historia de la asociación en línea de tiempo */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Nuestro Camino
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              La evolución de MEGAVERSE a través del tiempo
            </p>
          </div>

          <div className="relative wrap">
            <div className="absolute h-full border-r-2 border-primary-500/30 left-1/2 transform -translate-x-1/2"></div>
            
            {milestones.map((milestone, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                viewport={{ once: true }}
                className={`mb-12 flex justify-between items-center w-full ${
                  index % 2 === 0 ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="order-1 w-5/12"></div>
                <div className="z-20">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-full">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className={`order-1 w-5/12 rounded-lg shadow-md px-6 py-4 bg-white dark:bg-dark-800 ${
                  index % 2 === 0 ? 'text-right' : ''
                }`}>
                  <h3 className="font-bold text-primary-600 dark:text-primary-400 text-lg mb-1">{milestone.year}</h3>
                  <p className="text-gray-700 dark:text-gray-300">{milestone.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Nuestro Equipo */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Nuestro Equipo
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Las personas que hacen posible MEGAVERSE
            </p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    viewport={{ once: true }}
                >
                    <Card className="p-6 text-center h-full flex flex-col">
                        <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Users className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{member.name}</h3>
                        <div className="mb-3">
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                                {member.role}
                            </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 flex-grow">{member.bio}</p>
                    </Card>
                </motion.div>
            ))}
        </div>
        </motion.div>

        {/* Instalaciones */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Nuestras Instalaciones
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Un espacio diseñado para la mejor experiencia de juego
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-gray-200 dark:bg-dark-800 h-64 md:h-auto flex items-center justify-center">
                <Coffee className="w-24 h-24 text-gray-400 dark:text-gray-600" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Espacio de Juego Premium
                </h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <p className="ml-3">3 mesas profesionales para wargames con terreno personalizable</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <p className="ml-3">Zona de pintura y modelismo con iluminación profesional</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <p className="ml-3">Biblioteca con reglamentos, codex y literatura especializada</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <p className="ml-3">Área de descanso con bebidas y snacks para los miembros</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <p className="ml-3">WiFi de alta velocidad y sistema de reservas digital</p>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* CTA: Únete - Solo se muestra si el usuario no está autenticado */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Card className="p-8 bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-900 text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                ¿Listo para unirte a nuestra comunidad?
              </h2>
              <p className="max-w-2xl mx-auto mb-8 text-primary-100">
                Forma parte de MEGAVERSE hoy mismo y disfruta de todas las ventajas de ser miembro: instalaciones exclusivas, torneos regulares, eventos especiales y una comunidad apasionada.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/auth" className="inline-block bg-white text-primary-700 hover:bg-primary-50 font-medium rounded-lg px-6 py-3 transition-colors">
                  Únete Ahora
                </a>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AboutPage;
