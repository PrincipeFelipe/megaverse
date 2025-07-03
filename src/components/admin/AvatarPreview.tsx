import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface AvatarPreviewProps {
  file: File | null;
  existingUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({ 
  file, 
  existingUrl = null,
  size = 'md'
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Determinar clases según el tamaño
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }[size];

  useEffect(() => {
    // Limpiar cualquier URL de objeto previamente creada
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Crear URL de vista previa si hay un archivo
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Cleanup function
      return () => URL.revokeObjectURL(url);
    } else if (existingUrl) {
      // Usar la URL existente si está disponible
      setPreviewUrl(existingUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [file, existingUrl, previewUrl]);

  if (!previewUrl) {
    return (
      <div className={`${sizeClasses} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500`}>
        <User className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700`}>
      <img 
        src={previewUrl} 
        alt="Avatar preview" 
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/150?text=Error';
        }}
      />
    </div>
  );
};
