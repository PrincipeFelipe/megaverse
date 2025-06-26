import React from 'react';

interface SimplePDFViewerProps {
  file: string;
  className?: string;
  height?: string;
  showToolbar?: boolean;
}

/**
 * Componente simple para visualizar PDFs usando un iframe
 * Esta es una alternativa más fiable a react-pdf cuando hay problemas de compatibilidad
 */
const SimplePDFViewer: React.FC<SimplePDFViewerProps> = ({
  file,
  className = "w-full",
  height = "500px",
  showToolbar = false,
}) => {
  // Añadir parámetros al PDF para controlar la visualización
  // #toolbar=0 oculta la barra de herramientas
  const fileUrl = `${file}${showToolbar ? '' : '#toolbar=0'}`;

  return (
    <div className={`simple-pdf-viewer ${className}`}>
      <iframe 
        src={fileUrl}
        style={{ width: '100%', height, border: 'none' }}
        title="PDF Viewer"
      />
    </div>
  );
};

export default SimplePDFViewer;
