import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-700 border-t border-dark-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img src="/images/logo.svg" alt="Megaverse Logo" className="w-6 h-6" />
            <span className="text-lg font-semibold text-white">MEGAVERSE</span>
          </div>
          
          <div className="flex space-x-6 mb-4 md:mb-0">
            <Link to="/" className="text-secondary-300 hover:text-white transition-colors">
              Inicio
            </Link>
            <Link to="/about" className="text-secondary-300 hover:text-white transition-colors">
              Sobre Nosotros
            </Link>
            <Link to="/reservations" className="text-secondary-300 hover:text-white transition-colors">
              Reservas
            </Link>
            <Link to="/products" className="text-secondary-300 hover:text-white transition-colors">
              Productos
            </Link>
          </div>
          
          <p className="text-secondary-300 text-sm">
            © 2025 MEGAVERSE. Asociación de ocio y gaming.
          </p>
        </div>
        <div className="mt-4 text-center text-secondary-400 text-sm">
          <p>Especialistas en juegos de mesa, wargames y Warhammer 40.000</p>
        </div>
      </div>
    </footer>
  );
};