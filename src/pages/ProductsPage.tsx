import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Coffee, Package, Plus, CreditCard } from '../utils/icons';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Product } from '../types';
import { productService, consumptionService } from '../services/api';
import { showSuccess, showError, showLoading, closeLoading } from '../utils/alerts';
import { PayConsumptionsModal } from '../components/ui/PayConsumptionsModal';
import { UserLayout } from '../components/layout/UserLayout';

export const ProductsPage: React.FC = () => {
  const { user, updateUserData } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Función auxiliar para normalizar valores numéricos
  const ensureNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && !isNaN(parseFloat(value))) {
      return parseFloat(value);
    }
    return 0;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsData = await productService.getAllProducts();
        // Normalizar valores numéricos de los productos
        const normalizedProducts = productsData.map((product: Product) => ({
          ...product,
          price: ensureNumber(product.price),
          stock: ensureNumber(product.stock)
        }));
        setProducts(normalizedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        showError('Error al cargar los productos. Por favor, inténtelo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = (productId: number) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === parseInt(productId));
      return total + (product ? ensureNumber(product.price) * quantity : 0);
    }, 0);
  };

  const handlePurchase = async () => {
    if (!user || Object.keys(cart).length === 0) return;

    try {
      showLoading('Procesando compra...');
      
      // Procesar cada producto en el carrito de forma secuencial para evitar problemas de concurrencia
      const cartItems = Object.entries(cart);
      let hasError = false;
      
      for (const [productId, quantity] of cartItems) {
        try {
          // Procesar un producto a la vez
          await consumptionService.createConsumption({
            productId: parseInt(productId),
            quantity
          });
        } catch (error) {
          console.error(`Error al procesar producto ${productId}:`, error);
          hasError = true;
          // Seguimos procesando el resto aunque haya errores
        }
      }
      
      closeLoading();
      
      if (hasError) {
        showError('Se han producido errores al procesar algunos productos. Verifica tu carrito.');
      } else {
        showSuccess('¡Productos añadidos a tu cuenta correctamente! El importe se ha registrado como pendiente de pago.');
        // Vaciar el carrito solo si no hubo errores
        setCart({});
      }
      
      // Recargar los productos para actualizar el stock
      const updatedProducts = await productService.getAllProducts();
      const normalizedProducts = updatedProducts.map((product: Product) => ({
        ...product,
        price: ensureNumber(product.price),
        stock: ensureNumber(product.stock)
      }));
      setProducts(normalizedProducts);
      
      // Actualizar el contexto de autenticación para tener el nuevo saldo (deuda)
      if (user) {
        updateUserData();
      }
    } catch (error) {
      closeLoading();
      console.error('Error processing purchase:', error);
      console.error('Error type:', typeof error);
      console.error('Error stringify:', JSON.stringify(error, null, 2));
      if (error instanceof Error) {
        showError(`Error al procesar la compra: ${error.message}`);
      } else {
        showError('Error al procesar la compra. Por favor, inténtelo de nuevo más tarde.');
      }
    }
  };

  // Extraer categorías únicas de los productos
  const categories = [...new Set(products.map(p => p.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <UserLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Productos & Consumibles
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Disfruta de refrescos y snacks mientras juegas
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Products */}
            <div className="lg:col-span-3">
              {categories.map((category) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8"
                >
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    {category === 'Bebidas' ? <Coffee className="w-6 h-6 mr-2" /> : <Package className="w-6 h-6 mr-2" />}
                    {category}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products
                      .filter(product => product.category === category)
                      .map((product) => (
                        <Card key={product.id} className="p-6" hover>
                          <div className="text-center">
                            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                              {category === 'Bebidas' ? (
                                <Coffee className="w-8 h-8 text-primary-600" />
                              ) : (
                                <Package className="w-8 h-8 text-primary-600" />
                              )}
                            </div>
                            
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {product.name}
                            </h3>
                            
                            <p className="text-2xl font-bold text-primary-600 mb-2">
                              €{product.price.toFixed(2)}
                            </p>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              Stock: {product.stock} unidades
                            </p>

                            <div className="flex items-center justify-center space-x-2">
                              {cart[product.id] > 0 && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeFromCart(product.id)}
                                  >
                                    -
                                  </Button>
                                  <span className="px-3 py-1 bg-gray-100 dark:bg-dark-800 rounded text-sm font-medium">
                                    {cart[product.id]}
                                  </span>
                                </>
                              )}
                              
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Validar que hay suficiente stock antes de agregar al carrito
                                  const currentQuantity = cart[product.id] || 0;
                                  if (product.stock > currentQuantity) {
                                    addToCart(product.id);
                                  } else {
                                    showError('No hay más unidades disponibles de este producto');
                                  }
                                }}
                                disabled={!user || product.stock === 0}
                                title={product.stock === 0 ? 'Producto agotado' : ''}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                {cart[product.id] > 0 ? 'Añadir' : 'Agregar'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Cart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <Card className="p-6 sticky top-24">
                <div className="flex items-center mb-4">
                  <ShoppingCart className="w-5 h-5 text-primary-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Mi Carrito
                  </h2>
                </div>

                {Object.keys(cart).length > 0 ? (
                  <>
                    <div className="space-y-3 mb-4">
                      {Object.entries(cart).map(([productId, quantity]) => {
                        const product = products.find(p => p.id === parseInt(productId));
                        if (!product) return null;

                        return (
                          <div key={productId} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                {quantity} × €{product.price.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              €{(product.price * quantity).toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-gray-200 dark:border-dark-700 pt-4 mb-4">
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span className="text-gray-900 dark:text-white">Total:</span>
                        <span className="text-primary-600">€{getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handlePurchase}
                      disabled={!user}
                      className="w-full"
                    >
                      Añadir a Mi Cuenta
                    </Button>

                    {!user && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                        Inicia sesión para realizar compras
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Tu carrito está vacío
                    </p>
                  </div>
                )}

                {user && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <div className="text-sm text-center">
                      <p className="text-gray-600 dark:text-gray-400">Cuenta por pagar:</p>
                      {ensureNumber(user.balance) < 0 ? (
                        <>
                          <p className="text-lg font-semibold text-red-600 mb-3">
                            €{Math.abs(ensureNumber(user.balance)).toFixed(2)}
                          </p>
                          <Button 
                            size="sm"
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pagar ahora
                          </Button>
                        </>
                      ) : (
                        <p className="text-lg font-semibold text-green-600">
                          €0.00
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Modal de pago de consumiciones */}
                <PayConsumptionsModal 
                  isOpen={showPaymentModal} 
                  onClose={() => setShowPaymentModal(false)} 
                  onPaymentComplete={() => {
                    // Actualizar la página después del pago
                    updateUserData();
                  }}
                />
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};