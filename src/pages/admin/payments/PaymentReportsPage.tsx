import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Table } from '../../../components/ui/Table';
import { paymentsService } from '../../../services/api';
import { Payment, PaymentReportResponse } from '../../../types';
import { showError, showLoading, closeLoading } from '../../../utils/alerts';

/**
 * Página de reportes de pagos
 */
const PaymentReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PaymentReportResponse | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentType: 'all',
  });

  // Función para formatear montos monetarios
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Manejador para cambios en los filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para generar el reporte
  const generateReport = async () => {
    try {
      showLoading('Generando reporte...');
      setLoading(true);
      
      const { startDate, endDate, paymentType } = filters;
      const reportData = await paymentsService.getPaymentReport({
        startDate,
        endDate,
        paymentType: paymentType === 'all' ? undefined : paymentType as 'normal' | 'maintenance'
      });
      
      setReport(reportData);
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      showError('No se pudo generar el reporte. Por favor, inténtelo de nuevo.');
    } finally {
      closeLoading();
      setLoading(false);
    }
  };

  // Función para descargar el reporte en formato CSV
  const downloadReportCSV = () => {
    if (!report) return;

    try {
      // Cabeceras del CSV
      let csv = 'ID,Usuario,Fecha,Monto,Tipo,Mes,Año,Método de pago,Referencia,Notas\n';
      
      // Añadir los pagos al CSV
      report.payments.forEach((payment) => {
        csv += `${payment.id},`;
        csv += `${payment.user_name?.replace(',', ' ')},`;
        csv += `${payment.payment_date},`;
        csv += `${payment.amount},`;
        csv += `${payment.payment_type},`;
        csv += `${payment.month},`;
        csv += `${payment.year},`;
        csv += `${payment.payment_method},`;
        csv += `"${payment.reference || ''}",`;
        csv += `"${payment.notes?.replace(/"/g, '""') || ''}"\n`;
      });
      
      // Crear elemento para la descarga
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte-pagos-${report.period.startDate}-${report.period.endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      showError('Error al descargar el reporte');
      console.error('Error al descargar el reporte:', error);
    }
  };

  // Función para descargar el reporte en formato PDF
  const printReport = () => {
    window.print();
  };

  return (
    <AdminLayout title="Reportes de Pagos">
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Filtros del Reporte</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <Input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <Input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de cuota
              </label>
              <Select
                id="paymentType"
                name="paymentType"
                value={filters.paymentType}
                onChange={handleFilterChange}
              >
                <option value="all">Todos</option>
                <option value="normal">Normal</option>
                <option value="maintenance">Mantenimiento</option>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={generateReport} 
              disabled={loading || !filters.startDate || !filters.endDate}
              variant="primary"
            >
              Generar Reporte
            </Button>
          </div>
        </Card>

        {report && (
          <div className="print:block">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Resultados del Reporte</h2>
                <div className="space-x-2 print:hidden">
                  <Button onClick={downloadReportCSV} variant="outline" size="sm">
                    Descargar CSV
                  </Button>
                  <Button onClick={printReport} variant="outline" size="sm">
                    Imprimir
                  </Button>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Período: {report.period.startDate} a {report.period.endDate}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.totals.map((total, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-dark-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {total.payment_type === 'normal' ? 'Cuotas normales' : 
                         total.payment_type === 'maintenance' ? 'Cuotas mantenimiento' : 
                         'Todas las cuotas'}
                      </p>
                      <div className="mt-1">
                        <p className="text-xl font-bold">{formatCurrency(total.total)}</p>
                        <p className="text-sm">{total.count} pagos de {total.users_count} usuarios</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {report.payments.length > 0 ? (
                <Table
                  headers={[
                    'ID',
                    'Usuario',
                    'Fecha',
                    'Cuota',
                    'Tipo',
                    'Método',
                    'Monto'
                  ]}
                  rows={report.payments.map((payment) => [
                    payment.id,
                    payment.user_name || `Usuario ${payment.user_id}`,
                    new Date(payment.payment_date).toLocaleDateString(),
                    `${payment.month}/${payment.year}`,
                    payment.payment_type === 'normal' ? 'Normal' : 'Mantenimiento',
                    payment.payment_method,
                    formatCurrency(payment.amount)
                  ])}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron pagos para el período seleccionado.</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PaymentReportsPage;
