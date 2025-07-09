import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Table } from '../../../components/ui/Table';
import { paymentsService } from '../../../services/api';
import { PaymentStatsResponse } from '../../../types';
import { showError } from '../../../utils/alerts';

// Función para formatear montos monetarios
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Función para obtener el nombre del mes
const getMonthName = (month: number): string => {
  return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2000, month - 1, 1));
};

// Componente para la tarjeta de resumen
const StatsSummaryCard: React.FC<{ title: string; value: string; subtitle?: string; className?: string; color?: string }> = ({ title, value, subtitle, className = '', color = 'blue' }) => {
  const colorClasses = {
    blue: {
      border: 'border-l-blue-500',
      title: 'text-blue-600 dark:text-blue-400',
      accent: 'bg-blue-50 dark:bg-blue-900/20'
    },
    emerald: {
      border: 'border-l-emerald-500',
      title: 'text-emerald-600 dark:text-emerald-400',
      accent: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    violet: {
      border: 'border-l-violet-500',
      title: 'text-violet-600 dark:text-violet-400',
      accent: 'bg-violet-50 dark:bg-violet-900/20'
    },
    amber: {
      border: 'border-l-amber-500',
      title: 'text-amber-600 dark:text-amber-400',
      accent: 'bg-amber-50 dark:bg-amber-900/20'
    }
  };
  
  const selectedColor = colorClasses[color as keyof typeof colorClasses];
  
  return (
    <Card className={`border-l-4 ${selectedColor.border} ${selectedColor.accent} shadow-lg hover:shadow-xl transition-shadow duration-200 ${className}`}>
      <div className="p-6">
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${selectedColor.title}`}>{title}</h3>
        <p className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-2">{value}</p>
        {subtitle && <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{subtitle}</p>}
      </div>
    </Card>
  );
};

const PaymentStatsPage: React.FC = () => {
  const [stats, setStats] = useState<PaymentStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [years, setYears] = useState<number[]>([]);
  
  const navigate = useNavigate();
  
  // Inicializar los años disponibles
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearsList = Array.from({ length: 5 }, (_, i) => currentYear - i);
    setYears(yearsList);
  }, []);
  
  // Cargar estadísticas al cambiar el año
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        const result = await paymentsService.getPaymentStats(selectedYear);
        setStats(result);
      } catch (error) {
        showError('Error', error instanceof Error ? error.message : 'Error al cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [selectedYear]);
  
  // Generar informe para los últimos 12 meses
  const generateReport = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 12);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];
    
    navigate(`/admin/payments/report?startDate=${startStr}&endDate=${endStr}`);
  };
  
  return (
    <AdminLayout title="Estadísticas de Pagos">
      <div className="space-y-6">
        {/* Selector de año y acciones */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Año:</span>
            <Select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))} 
              className="w-32"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              onClick={generateReport} 
              variant="outline"
            >
              Generar informe anual
            </Button>
            <Button 
              onClick={() => navigate('/admin/payments')} 
              variant="outline"
            >
              Volver a pagos
            </Button>
          </div>
        </div>
        
        {/* Tarjetas de resumen */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsSummaryCard 
                title="Total recaudado" 
                value={formatCurrency(stats.yearlyTotal.total)}
                subtitle={`${stats.yearlyTotal.count} pagos en ${selectedYear}`}
                color="blue"
              />
              
              <StatsSummaryCard 
                title="Cuotas normales" 
                value={formatCurrency(stats.monthlyStats
                  .filter(s => s.payment_type === 'normal')
                  .reduce((acc, curr) => acc + Number(curr.total), 0))}
                subtitle={`${stats.monthlyStats
                  .filter(s => s.payment_type === 'normal')
                  .reduce((acc, curr) => acc + Number(curr.count), 0)} pagos`}
                color="emerald"
              />
              
              <StatsSummaryCard 
                title="Cuotas mantenimiento" 
                value={formatCurrency(stats.monthlyStats
                  .filter(s => s.payment_type === 'maintenance')
                  .reduce((acc, curr) => acc + Number(curr.total), 0))}
                subtitle={`${stats.monthlyStats
                  .filter(s => s.payment_type === 'maintenance')
                  .reduce((acc, curr) => acc + Number(curr.count), 0)} pagos`}
                color="violet"
              />

              <StatsSummaryCard 
                title="Cuotas de entrada" 
                value={formatCurrency(stats.monthlyStats
                  .filter(s => s.payment_type === 'entrance')
                  .reduce((acc, curr) => acc + Number(curr.total), 0))}
                subtitle={`${stats.monthlyStats
                  .filter(s => s.payment_type === 'entrance')
                  .reduce((acc, curr) => acc + Number(curr.count), 0)} pagos`}
                color="amber"
              />
            </div>
            
            {/* Estadísticas mensuales */}
            <Card>
              <div className="p-5">
                <h3 className="text-lg font-medium mb-4">Estadísticas mensuales</h3>
                
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Mes</Table.HeaderCell>
                      <Table.HeaderCell>Tipo</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Pagos</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  
                  <Table.Body>
                    {stats.monthlyStats.length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={4} className="text-center py-8 text-gray-500">
                          No hay datos de pagos para este año.
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      stats.monthlyStats.map((stat, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>{getMonthName(stat.month)}</Table.Cell>
                          <Table.Cell>
                            <span className={`px-2 py-1 rounded-full text-sm ${
                              stat.payment_type === 'normal' 
                                ? 'bg-blue-100 text-blue-800' 
                                : stat.payment_type === 'maintenance'
                                ? 'bg-purple-100 text-purple-800'
                                : stat.payment_type === 'entrance'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {stat.payment_type === 'normal' ? 'Normal' : 
                               stat.payment_type === 'maintenance' ? 'Mantenimiento' :
                               stat.payment_type === 'entrance' ? 'Entrada' :
                               stat.payment_type}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="text-right">{stat.count}</Table.Cell>
                          <Table.Cell className="text-right font-medium">{formatCurrency(stat.total)}</Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table>
              </div>
            </Card>
            
            {/* Pagos pendientes */}
            {stats.pendingPayments.length > 0 && (
              <Card>
                <div className="p-5">
                  <h3 className="text-lg font-medium mb-4">Cuotas pendientes</h3>
                  
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>Usuario</Table.HeaderCell>
                        <Table.HeaderCell>Meses pendientes</Table.HeaderCell>
                        <Table.HeaderCell className="text-right">Acciones</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    
                    <Table.Body>
                      {stats.pendingPayments.map((pending, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>{pending.name}</Table.Cell>
                          <Table.Cell>
                            <div className="flex flex-wrap gap-1">
                              {pending.pending_months.split(',').map((month, i) => (
                                <span 
                                  key={i} 
                                  className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                                >
                                  {getMonthName(Number(month))}
                                </span>
                              ))}
                            </div>
                          </Table.Cell>
                          <Table.Cell className="text-right">
                            <Button
                              size="xs"
                              onClick={() => navigate(`/admin/payments/new?userId=${pending.id}`)}
                            >
                              Registrar pago
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <div className="p-6 text-center">
              <p>No se pudieron cargar las estadísticas.</p>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default PaymentStatsPage;
