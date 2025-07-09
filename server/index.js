import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import reservationRoutes from './routes/reservations.js';
import tableRoutes from './routes/tables.js';
import consumptionRoutes from './routes/consumptions.js';
import consumptionPaymentsRoutes from './routes/consumptionPayments.js';
import configRoutes from './routes/config.js';
import paymentsRoutes from './routes/payments.js';
import expensesRoutes from './routes/expenses.js';
import uploadsRoutes from './routes/uploads.js';
import documentsRoutes from './routes/documents.js';
import blogRoutes from './routes/blog.js';
import rssRoutes from './routes/rss.js';
import cleaningDutyRoutes from './routes/cleaningDuty.js';
import notificationRoutes from './routes/notifications.js';
import fs from 'fs';
import path from 'path';

// Configurar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
console.log('Server - Variables de entorno cargadas desde:', path.resolve(process.cwd(), '.env'));
console.log('Server - JWT_SECRET está configurado:', !!process.env.JWT_SECRET);

// Crear la aplicación Express
const app = express();

// Middleware
app.use(cors({
  origin: true, // Permite cualquier origen (en producción deberías restringirlo)
  credentials: true,
  exposedHeaders: ['Content-Disposition'] // Útil para descargas
}));
app.use(express.json());

// Configuración para servir archivos estáticos
// Servir desde la raíz /uploads
app.use('/uploads', express.static('uploads'));
// También servir desde /api/uploads para compatibilidad
app.use('/api/uploads', express.static('uploads'));

// Crear directorio para imágenes del blog si no existe
const blogImagesDir = path.join(process.cwd(), 'uploads', 'blog');
if (!fs.existsSync(blogImagesDir)) {
  console.log(`Creando directorio para imágenes del blog: ${blogImagesDir}`);
  fs.mkdirSync(blogImagesDir, { recursive: true });
} else {
  console.log(`Directorio para imágenes del blog ya existe: ${blogImagesDir}`);
}
// Servir archivos estáticos desde public
app.use(express.static('public'));
// También hacer accesibles los archivos de public desde /api
app.use('/api', express.static('public'));
console.log(`Sirviendo archivos estáticos desde: 
  - ${process.cwd()}/uploads (accesible desde /uploads y /api/uploads)
  - ${process.cwd()}/public (accesible desde / y /api)`);

// Asegurar que existan los directorios necesarios
const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  console.log(`Creando directorio para avatares: ${avatarsDir}`);
  fs.mkdirSync(avatarsDir, { recursive: true });
} else {
  console.log(`Directorio para avatares ya existe: ${avatarsDir}`);
}

// Crear directorio para documentos si no existe
const documentsDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(documentsDir)) {
  console.log(`Creando directorio para documentos: ${documentsDir}`);
  fs.mkdirSync(documentsDir, { recursive: true });
} else {
  console.log(`Directorio para documentos ya existe: ${documentsDir}`);
}

// Comprobar conexión a la base de datos
testConnection();

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/consumptions', consumptionRoutes);
app.use('/api/consumption-payments', consumptionPaymentsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/rss', rssRoutes);
app.use('/api/cleaning-duty', cleaningDutyRoutes);
app.use('/api/notifications', notificationRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API funcionando correctamente' });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Iniciar el servidor
const PORT = 8090; // Puerto fijo para desarrollo
delete process.env.PORT; // Asegurarse de que no haya variable de entorno que interfiera
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});

export default app;
