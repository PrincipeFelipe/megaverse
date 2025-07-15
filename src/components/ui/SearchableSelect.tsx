import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
  searchPlaceholder = 'Buscar...',
  emptyText = 'No se encontraron opciones'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const selectRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filtrar opciones basado en el término de búsqueda
  useEffect(() => {
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Enfocar el input de búsqueda cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find(option => option.value === value);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const handleOptionClick = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (event.key === 'Enter' && filteredOptions.length === 1) {
      handleOptionClick(filteredOptions[0].value);
    }
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-3 py-2 text-left bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary hover:border-gray-400 dark:hover:border-dark-500 transition-colors"
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transform transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-dark-600">
            <input
              ref={searchRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-dark-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-dark-600 transition-colors ${
                    option.value === value
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{option.label}</span>
                    {option.value === value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
