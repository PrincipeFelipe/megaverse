import React, { useState, useEffect } from 'react';
import { AdminTable } from '../../../components/admin/AdminTable';
import { Consumption, Product, User } from '../../../types';
import { consumptionService, productService, adminUserService } from '../../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown } from 'lucide-react';

export const ConsumptionsHistoryPage: React.FC = () => {
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [filteredConsumptions, setFilteredConsumptions] = useState<Consumption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState({
    products: true,
    users: true
  });
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    product: '',
    user: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Estado para controlar los desplegables
  const [dropdownState, setDropdownState] = useState({
    products: false,
    users: false
  });

  const fetchConsumptions = async () => {
    try {
      setLoading(true);
      const data = await consumptionService.getAllConsumptions();
      setConsumptions(data);
      setFilteredConsumptions(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar consumiciones: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingData(prev => ({ ...prev, products: true }));
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoadingData(prev => ({ ...prev, products: false }));
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingData(prev => ({ ...prev, users: true }));
      const data = await adminUserService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoadingData(prev => ({ ...prev, users: false }));
    }
  };

  // Manejar la apertura/cierre de desplegables
  const toggleDropdown = (type: 'products' | 'users') => {
    setDropdownState(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Manejar selección en desplegables
  const handleSelect = (type: 'product' | 'user', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
    // Cerrar el desplegable correspondiente
    if (type === 'product') {
      setDropdownState(prev => ({ ...prev, products: false }));
    } else {
      setDropdownState(prev => ({ ...prev, users: false }));
    }
  };

  useEffect(() => {
    fetchConsumptions();
    fetchProducts();
    fetchUsers();
  }, []);

  useEffect(() => {
    // Aplicar filtros a las consumiciones
    let filtered = [...consumptions];
    
    if (filters.product) {
      filtered = filtered.filter(c => 
        c.product_name.toLowerCase().includes(filters.product.toLowerCase())
      );
    }
    
    if (filters.user) {
      filtered = filtered.filter(c => 
        (c.user_name && c.user_name.toLowerCase().includes(filters.user.toLowerCase())) || 
        c.user_id.toString().includes(filters.user)
      );
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(c => new Date(c.created_at) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Final del día
      filtered = filtered.filter(c => new Date(c.created_at) <= toDate);
    }
    
    setFilteredConsumptions(filtered);
  }, [filters, consumptions]);
  
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Columnas para la tabla de consumiciones
  const columns = [
    { header: 'ID', accessor: 'id' as keyof Consumption },
    { 
      header: 'Producto', 
      accessor: (consumption: Consumption) => consumption.product_name 
    },
    { 
      header: 'Usuario', 
      accessor: (consumption: Consumption) => consumption.user_name || `Usuario #${consumption.user_id}` 
    },
    { 
      header: 'Cantidad', 
      accessor: 'quantity' as keyof Consumption 
    },
    { 
      header: 'Total', 
      accessor: (consumption: Consumption) => {
        const price = typeof consumption.total_price === 'number' ? 
          consumption.total_price : 
          parseFloat(String(consumption.total_price));
        return `€${isNaN(price) ? '0.00' : price.toFixed(2)}`;
      }
    },
    { 
      header: 'Fecha', 
      accessor: (consumption: Consumption) => 
        format(new Date(consumption.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
    }
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Registro completo de consumiciones de productos
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Desplegable de Productos */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Producto
            </label>
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white text-sm"
              onClick={() => toggleDropdown('products')}
            >
              {filters.product || 'Seleccionar producto'}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            
            {/* Lista desplegable de productos */}
            {dropdownState.products && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-dark-700 rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
                    onClick={() => handleSelect('product', '')}
                  >
                    Todos los productos
                  </button>
                  
                  {loadingData.products ? (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
                  ) : (
                    products.map(product => (
                      <button
                        key={product.id}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
                        onClick={() => handleSelect('product', product.name)}
                      >
                        {product.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Desplegable de Usuarios */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Usuario
            </label>
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white text-sm"
              onClick={() => toggleDropdown('users')}
            >
              {filters.user || 'Seleccionar usuario'}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            
            {/* Lista desplegable de usuarios */}
            {dropdownState.users && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-dark-700 rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
                    onClick={() => handleSelect('user', '')}
                  >
                    Todos los usuarios
                  </button>
                  
                  {loadingData.users ? (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
                  ) : (
                    users.map(user => (
                      <button
                        key={user.id}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
                        onClick={() => handleSelect('user', user.name)}
                      >
                        {user.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Selector de fecha desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Desde
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white text-sm"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          
          {/* Selector de fecha hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hasta
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white text-sm"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Resultados y limpieza de filtros */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredConsumptions.length} de {consumptions.length} consumiciones
        </span>
        
        {(filters.product || filters.user || filters.dateFrom || filters.dateTo) && (
          <button
            onClick={() => {
              setFilters({
                product: '',
                user: '',
                dateFrom: '',
                dateTo: ''
              });
            }}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <AdminTable
        columns={columns}
        data={filteredConsumptions}
        keyExtractor={(consumption) => consumption.id}
        loading={loading}
        error={error}
        emptyMessage="No hay consumiciones registradas"
      />
    </>
  );
};
