import { api } from './api';

interface ConsumptionPayment {
  user_id: number;
  amount: number;
  payment_method: string;
  reference: string;
  consumption_ids: number[];
}

// Obtener consumos pendientes de pago para un usuario
export const getUnpaidConsumptions = async (userId: number) => {
  try {
    const response = await api.get(`/consumptions/unpaid/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener consumos no pagados:', error);
    throw error;
  }
};

// Crear un nuevo pago para consumos
export const createConsumptionPayment = async (paymentData: ConsumptionPayment) => {
  try {
    const response = await api.post('/consumption-payments', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error al crear pago de consumos:', error);
    throw error;
  }
};

// Obtener pagos pendientes de aprobación (para administradores)
export const getPendingPayments = async () => {
  try {
    const response = await api.get('/consumption-payments/pending');
    return response.data;
  } catch (error) {
    console.error('Error al obtener pagos pendientes:', error);
    throw error;
  }
};

// Aprobar un pago
export const approvePayment = async (paymentId: number) => {
  try {
    const response = await api.put(`/consumption-payments/${paymentId}/approve`);
    return response.data;
  } catch (error) {
    console.error('Error al aprobar pago:', error);
    throw error;
  }
};

// Rechazar un pago
export const rejectPayment = async (paymentId: number) => {
  try {
    const response = await api.put(`/consumption-payments/${paymentId}/reject`);
    return response.data;
  } catch (error) {
    console.error('Error al rechazar pago:', error);
    throw error;
  }
};

// Obtener detalles de un pago específico
export const getPaymentDetails = async (paymentId: number) => {
  try {
    const response = await api.get(`/consumption-payments/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles del pago:', error);
    throw error;
  }
};
