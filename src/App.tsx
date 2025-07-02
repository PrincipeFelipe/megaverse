import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import ReservationsPage from './pages/ReservationsPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PaymentHistoryPage } from './pages/PaymentHistoryPage';
import AboutPage from './pages/AboutPage';

// Importar estilos globales para corregir problemas de SweetAlert
import './components/ui/sweetalertFix.css';

// Estilos para tooltips y notificaciones
import './styles/notifications.css';
import './styles/rejection-tooltip.css';

// Admin Pages
import { AdminPage } from './pages/admin/AdminPage';
import { AdminUsersPage } from './pages/admin/users/AdminUsersPage';
import { AdminProductsPage } from './pages/admin/products/AdminProductsPage';
import { AdminReservationsPage } from './pages/admin/reservations/AdminReservationsPage';
import { AdminTablesPage } from './pages/admin/tables/AdminTablesPage';
import ReservationConfigPage from './pages/admin/ReservationConfigPage';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';

// Pagos Pages
import AdminPaymentsPage from './pages/admin/payments/AdminPaymentsPage';
import PaymentStatsPage from './pages/admin/payments/PaymentStatsPage';
import PaymentDetails from './pages/admin/payments/PaymentDetails';
import PaymentReportsPage from './pages/admin/payments/PaymentReportsPage';
import PaymentForm from './pages/admin/payments/PaymentForm';

// Gastos Pages (Páginas de Gastos)
import { ExpensesPage } from './pages/admin/ExpensesPage';
// Las páginas de formulario y detalle de gastos ya no se usan, se manejan con modal
import ExpenseReportPage from './pages/admin/expenses/ExpenseReport';

// Pagos de Consumiciones
import { ConsumptionPaymentsPage } from './pages/admin/ConsumptionPaymentsPage';

// Documentación
import DocumentsPage from './pages/admin/DocumentsPage';

// Blog Admin
import AdminBlogPage from './pages/admin/blog/AdminBlogPage';

// Blog Pages
import BlogPage from './pages/blog/BlogPage';
import BlogPostPage from './pages/blog/BlogPostPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 to-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary-500 border-opacity-80 shadow-lg"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payments/history" 
              element={
                <ProtectedRoute>
                  <PaymentHistoryPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <AdminProtectedRoute>
                  <AdminPage />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <AdminProtectedRoute>
                  <AdminUsersPage />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products" 
              element={
                <AdminProtectedRoute>
                  <AdminProductsPage />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reservations" 
              element={
                <AdminProtectedRoute>
                  <AdminReservationsPage />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tables" 
              element={
                <AdminProtectedRoute>
                  <AdminTablesPage />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reservation-config" 
              element={
                <AdminProtectedRoute>
                  <ReservationConfigPage />
                </AdminProtectedRoute>
              } 
            />
            {/* Rutas de pagos - orden importante: específicas primero */}
            <Route 
              path="/admin/payments" 
              element={
                <AdminProtectedRoute>
                  <AdminPaymentsPage />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/payments/stats" 
              element={
                <AdminProtectedRoute>
                  <PaymentStatsPage />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/payments/reports" 
              element={
                <AdminProtectedRoute>
                  <PaymentReportsPage />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/payments/new" 
              element={
                <AdminProtectedRoute>
                  <PaymentForm />
                </AdminProtectedRoute>
              } 
            />
            {/* Las rutas con parámetros deben ir después de las rutas específicas */}
            <Route 
              path="/admin/payments/:id/edit" 
              element={
                <AdminProtectedRoute>
                  <PaymentForm />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/payments/:id" 
              element={
                <AdminProtectedRoute>
                  <PaymentDetails />
                </AdminProtectedRoute>
              } 
            />
            
            {/* Rutas para Gastos (Expenses) */}
            <Route 
              path="/admin/expenses" 
              element={
                <AdminProtectedRoute>
                  <ExpensesPage />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/expenses/report" 
              element={
                <AdminProtectedRoute>
                  <ExpenseReportPage />
                </AdminProtectedRoute>
              } 
            />

            {/* Rutas para Pagos de Consumiciones */}
            <Route 
              path="/admin/consumption-payments" 
              element={
                <AdminProtectedRoute>
                  <ConsumptionPaymentsPage />
                </AdminProtectedRoute>
              } 
            />

            {/* Ruta para Documentación */}
            <Route 
              path="/admin/documents" 
              element={
                <AdminProtectedRoute>
                  <DocumentsPage />
                </AdminProtectedRoute>
              } 
            />

            {/* Ruta para Blog Admin */}
            <Route 
              path="/admin/blog" 
              element={
                <AdminProtectedRoute>
                  <AdminBlogPage />
                </AdminProtectedRoute>
              } 
            />

            {/* Rutas del Blog */}
            <Route
              path="/blog"
              element={<BlogPage />}
            />
            <Route
              path="/blog/:slug"
              element={<BlogPostPage />}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;