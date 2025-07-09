import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-700 border-t border-dark-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center space-x-2 mb-4">
            <img src="/images/logo.svg" alt="Megaverse Logo" className="w-6 h-6" />
            <span className="text-lg font-semibold text-white">MEGAVERSE</span>
          </div>
          
          <p className="text-secondary-300 text-sm mb-2">
            © 2025 MEGAVERSE. Asociación de ocio y gaming.
          </p>
          
          <p className="text-secondary-400 text-sm">
            Especialistas en juegos de mesa, wargames y Warhammer 40.000
          </p>
        </div>
      </div>
    </footer>
  );
};