import React, { useState } from 'react';
import { BlogCategory, BlogTag } from '../../types/blog';
import { Filter, X, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface BlogFiltersProps {
  categories: BlogCategory[];
  tags: BlogTag[];
  onFilterChange: (filters: {
    category: string;
    tag: string;
    search: string;
  }) => void;
  initialFilters?: {
    category: string;
    tag: string;
    search: string;
  };
}

export const BlogFilters: React.FC<BlogFiltersProps> = ({
  categories,
  tags,
  onFilterChange,
  initialFilters = { category: '', tag: '', search: '' }
}) => {
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState(initialFilters);
  
  // Función para aplicar filtros
  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onFilterChange(filters);
  };
  
  // Función para resetear filtros
  const resetFilters = () => {
    const resetValues = { category: '', tag: '', search: '' };
    setFilters(resetValues);
    onFilterChange(resetValues);
  };
  
  // Función para manejar cambios en los filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </Button>
        </div>
        
        <form onSubmit={applyFilters} className="flex gap-2">
          <div className="relative">
            <Input
              type="text"
              name="search"
              placeholder="Buscar posts..."
              value={filters.search}
              onChange={handleFilterChange}
              className="min-w-[200px] sm:min-w-[300px]"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <Button type="submit" variant="primary">Buscar</Button>
        </form>
      </div>
      
      {/* Filtros avanzados */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filtros avanzados</h3>
            <Button
              onClick={resetFilters}
              variant="ghost"
              className="text-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar filtros
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tag</label>
              <select
                name="tag"
                value={filters.tag}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
              >
                <option value="">Todos los tags</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.slug}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button onClick={() => applyFilters()} variant="primary">
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
