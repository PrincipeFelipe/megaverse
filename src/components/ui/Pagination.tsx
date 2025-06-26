import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Número de páginas para mostrar a cada lado de la página actual
  const paginationRange = 2;
  
  // Generar array de páginas para mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    // Siempre mostrar la primera página
    pages.push(1);
    
    // Calcular el rango de páginas a mostrar
    let startPage = Math.max(2, currentPage - paginationRange);
    let endPage = Math.min(totalPages - 1, currentPage + paginationRange);
    
    // Añadir ellipsis después de la página 1 si es necesario
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Añadir páginas del rango
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Añadir ellipsis antes de la última página si es necesario
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Añadir la última página si hay más de una página
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="flex items-center justify-center">
      {/* Botón Anterior */}
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-2 py-1 mx-1 rounded ${
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/20'
        }`}
      >
        &laquo; Anterior
      </button>
      
      {/* Números de página */}
      {pageNumbers.map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          className={`px-3 py-1 mx-1 rounded ${
            page === currentPage
              ? 'bg-primary-600 text-white'
              : typeof page === 'number'
                ? 'hover:bg-primary-100 dark:hover:bg-primary-900/20'
                : ''
          }`}
          disabled={typeof page !== 'number'}
        >
          {page}
        </button>
      ))}
      
      {/* Botón Siguiente */}
      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-2 py-1 mx-1 rounded ${
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/20'
        }`}
      >
        Siguiente &raquo;
      </button>
    </div>
  );
};
