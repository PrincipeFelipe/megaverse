import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminTable } from '../../../components/admin/AdminTable';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { AdminForm } from '../../../components/admin/AdminForm';
import { Product } from '../../../types';
import { productService } from '../../../services/api';
import { Pencil, Trash2, Plus as PlusIcon, Package, ShoppingCart } from 'lucide-react';
import { showDangerConfirm, showSuccess, showError, showLoading, closeLoading } from '../../../utils/alerts';
import { ConsumptionsHistoryPage } from './ConsumptionsHistoryPage';

export const AdminProductsPage: React.FC = () => {
  // Estado para manejar las pestañas
  const [activeTab, setActiveTab] = useState<'products' | 'consumptions'>('products');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    price: 0,
    stock: 0,
    category: 'Bebidas',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const categories = ['Bebidas', 'Snacks', 'Juegos', 'Merchandising'];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar productos: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setIsEditMode(true);
      setSelectedProduct(product);
      setFormValues({
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category
      });
    } else {
      setIsEditMode(false);
      setSelectedProduct(null);
      setFormValues({
        name: '',
        price: 0,
        stock: 0,
        category: 'Bebidas'
      });
    }
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (name: string, value: string | number) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }));
  };
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      showLoading(isEditMode ? 'Actualizando producto...' : 'Creando producto...');
      
      if (isEditMode && selectedProduct) {
        // Actualizamos producto
        await productService.updateProduct(selectedProduct.id, formValues);
        closeLoading();
        showSuccess(
          'Producto actualizado', 
          `El producto "${formValues.name}" ha sido actualizado correctamente`
        );
      } else {
        // Creamos producto nuevo
        await productService.createProduct(formValues);
        closeLoading();
        showSuccess(
          'Producto creado', 
          `El producto "${formValues.name}" ha sido creado correctamente`
        );
      }
      // Recargamos la lista de productos
      fetchProducts();
      handleCloseModal();
    } catch (err) {
      closeLoading();
      showError('Error', (err as Error).message);
      setFormError('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteProduct = async (productId: number) => {
    const isConfirmed = await showDangerConfirm(
      'Eliminar producto', 
      '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
      'Eliminar',
      'Cancelar'
    );
    
    if (isConfirmed) {
      try {
        showLoading('Eliminando producto...');
        await productService.deleteProduct(productId);
        closeLoading();
        showSuccess('Producto eliminado', 'El producto ha sido eliminado correctamente');
        fetchProducts(); // Recargamos la lista tras eliminar
      } catch (err) {
        closeLoading();
        showError('Error', 'Error al eliminar producto: ' + (err as Error).message);
        setError('Error al eliminar producto: ' + (err as Error).message);
      }
    }
  };

  const formFields = [
    { name: 'name', label: 'Nombre', type: 'text' as const, required: true, placeholder: 'Nombre del producto' },
    { name: 'price', label: 'Precio (€)', type: 'number' as const, required: true, placeholder: '0.00' },
    { name: 'stock', label: 'Stock', type: 'number' as const, required: true, placeholder: '0' },
    { 
      name: 'category', 
      label: 'Categoría', 
      type: 'select' as const, 
      required: true,
      options: categories.map(cat => ({ value: cat, label: cat }))
    },
  ];

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Product },
    { header: 'Nombre', accessor: 'name' as keyof Product },
    { 
      header: 'Precio', 
      accessor: (product: Product) => {
        const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price));
        return `€${isNaN(price) ? '0.00' : price.toFixed(2)}`;
      }
    },
    { header: 'Stock', accessor: 'stock' as keyof Product },
    { 
      header: 'Categoría', 
      accessor: (product: Product) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          product.category === 'Bebidas' 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
            : product.category === 'Snacks'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : product.category === 'Juegos'
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
        }`}>
          {product.category}
        </span>
      )
    }
  ];

  const renderActions = (product: Product) => (
    <div className="flex justify-end space-x-2">      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => handleOpenModal(product)}
      >
        <Pencil className="w-4 h-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => handleDeleteProduct(product.id)}
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </div>
  );

  const renderProductsTab = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona el catálogo de productos
        </p>
        <Button 
          onClick={() => handleOpenModal()}
          className="flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-1" />
          Nuevo Producto
        </Button>
      </div>

      <AdminTable
        columns={columns}
        data={products}
        actions={renderActions}
        keyExtractor={(product) => product.id}
        loading={loading}
        error={error}
        emptyMessage="No hay productos registrados"
      />
    </>
  );

  return (
    <AdminLayout title="Administrar Productos">
      {/* Tabs de navegación */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button 
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'products' 
                  ? 'border-b-2 border-primary-500 text-primary-500 dark:text-primary-400 dark:border-primary-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('products')}
            >
              <Package className="w-4 h-4 mr-2" />
              Productos
            </button>
          </li>
          <li>
            <button 
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'consumptions' 
                  ? 'border-b-2 border-primary-500 text-primary-500 dark:text-primary-400 dark:border-primary-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('consumptions')}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Historial de Consumiciones
            </button>
          </li>
        </ul>
      </div>

      {/* Contenido basado en la pestaña activa */}
      {activeTab === 'products' ? renderProductsTab() : <ConsumptionsHistoryPage />}

      {/* Modal para crear/editar productos */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditMode ? "Editar Producto" : "Crear Producto"}
      >
        <AdminForm
          fields={formFields}
          values={formValues}
          onChange={handleInputChange}
          onSubmit={handleSubmitForm}
          submitText={isEditMode ? "Guardar Cambios" : "Crear Producto"}
          loading={loading}
          error={formError}
        />
      </Modal>
    </AdminLayout>
  );
};
