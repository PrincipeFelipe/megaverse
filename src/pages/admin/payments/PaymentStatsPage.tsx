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
const StatsSummaryCard: React.FC<{ title: string; value: string; subtitle?: string; className?: string }> = ({ title, value, subtitle, className = '' }) => {
  return (
    <Card className={className}>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-semibold">{value}</p>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
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
      } catch (error: any) {
        showError('Error', error.message || 'Error al cargar las estadísticas');
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsSummaryCard 
                title="Total recaudado" 
                value={formatCurrency(stats.yearlyTotal.total)}
                subtitle={`${stats.yearlyTotal.count} pagos en ${selectedYear}`}
                className="bg-gradient-to-br from-blue-50 to-blue-100"
              />
              
              <StatsSummaryCard 
                title="Cuotas normales" 
                value={formatCurrency(stats.monthlyStats
                  .filter(s => s.payment_type === 'normal')
                  .reduce((acc, curr) => acc + Number(curr.total), 0))}
                subtitle={`${stats.monthlyStats
                  .filter(s => s.payment_type === 'normal')
                  .reduce((acc, curr) => acc + Number(curr.count), 0)} pagos`}
                className="bg-gradient-to-br from-green-50 to-green-100"
              />
              
              <StatsSummaryCard 
                title="Cuotas mantenimiento" 
                value={formatCurrency(stats.monthlyStats
                  .filter(s => s.payment_type === 'maintenance')
                  .reduce((acc, curr) => acc + Number(curr.total), 0))}
                subtitle={`${stats.monthlyStats
                  .filter(s => s.payment_type === 'maintenance')
                  .reduce((acc, curr) => acc + Number(curr.count), 0)} pagos`}
                className="bg-gradient-to-br from-purple-50 to-purple-100"
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
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {stat.payment_type === 'normal' ? 'Normal' : 'Mantenimiento'}
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
