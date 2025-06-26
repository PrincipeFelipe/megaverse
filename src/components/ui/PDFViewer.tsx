import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Establecer el worker para PDF.js
// Usar el worker local para garantizar la compatibilidad
const pdfjsWorkerSrc = `/pdfjs/pdf.worker.min.js`;

// Mostrar información de la versión en el log para depuración
console.log('PDFViewer: Usando pdfjs versión', pdfjs.version, 'con worker local');

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

interface PDFViewerProps {
  file: string | Uint8Array | { data: Uint8Array };
  className?: string;
  maxHeight?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  file,
  className = "w-full",
  maxHeight = "500px"
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error('Error al cargar el PDF:', err);
    // Mostrar un mensaje más detallado
    let errorMessage = 'No se pudo cargar el documento PDF.';
    
    // Intentar identificar el error específico
    if (err.message && err.message.includes('API version') && err.message.includes('does not match')) {
      errorMessage = 'Error de compatibilidad de versiones de PDF.js. Por favor, contacte al administrador.';
      console.error('PDFViewer: Error de versiones. Asegúrese de que la versión del worker coincida con la de pdfjs-dist:', err.message);
    } else if (err.message && err.message.includes('Invalid PDF')) {
      errorMessage = 'El archivo PDF no es válido o está dañado.';
    } else if (err.message && err.message.includes('network')) {
      errorMessage = 'Error de red al cargar el PDF. Puede que no tenga permisos o la URL sea incorrecta.';
    } else if (err.message && err.message.includes('worker')) {
      errorMessage = 'Error al cargar el worker de PDF.js. Intente recargar la página.';
      console.error('PDFViewer: Error de worker. Asegúrese de que el archivo worker existe en la ruta correcta:', err.message);
    } else if (err.message && err.message.includes('fetch')) {
      errorMessage = 'Error de conexión al cargar el documento. Verifique su conexión a Internet.';
    }
    
    setError(`${errorMessage} Intente descargar el archivo para verlo.`);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      return Math.max(1, Math.min(newPage, numPages || 1));
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  return (
    <div className={`pdf-viewer ${className}`}>
      {error ? (
        <div className="w-full p-4 text-center border rounded-md border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300">
          <p>{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-full overflow-auto border rounded-md border-gray-300 dark:border-gray-700" style={{ maxHeight }}>
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex justify-center items-center p-20">
            <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        }
        noData={
          <div className="flex justify-center items-center p-10">
            <p className="text-gray-500">No se ha podido cargar el PDF</p>
          </div>
        }
        error={
          <div className="flex justify-center items-center p-10">
            <p className="text-red-500">Error al cargar el PDF. Intente descargar el archivo.</p>
          </div>
        }
      >
        <Page 
          pageNumber={pageNumber} 
          renderAnnotationLayer={true} 
          renderTextLayer={true}
          error={
            <div className="flex justify-center items-center p-10">
              <p className="text-red-500">Error al renderizar la página {pageNumber}.</p>
            </div>
          }
        />
      </Document>
          </div>
          
          {numPages && numPages > 1 && (
            <div className="flex items-center justify-between w-full mt-4 space-x-4">
              <button 
                onClick={previousPage}
                disabled={pageNumber <= 1}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50"
              >
                Anterior
              </button>
              <p className="text-sm">
                Página {pageNumber} de {numPages}
              </p>
              <button 
                onClick={nextPage}
                disabled={pageNumber >= (numPages || 1)}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
