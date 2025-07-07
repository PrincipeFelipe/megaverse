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
import cleaningDutyRoutes from './routes/cleaningDuty.js';
import fs from 'fs';
import path from 'path';
import fileUpload from 'express-fileupload';

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

// Middleware para manejar la subida de archivos
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // Límite de 50MB
  createParentPath: true,
  useTempFiles: false, // Desactivado para evitar problemas con permisos temporales
  debug: true // Habilitar logs para depuración
}));

// Configuración para servir archivos estáticos
// Primero aseguramos que los directorios existan
['uploads', 'uploads/avatars', 'uploads/blog', 'uploads/documents'].forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creando directorio: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
    
    // Intentar dar permisos de escritura explícitos en Windows
    try {
      fs.chmodSync(dirPath, 0o755); // Permisos rwxr-xr-x
      console.log(`Permisos establecidos para: ${dirPath}`);
    } catch (err) {
      console.error(`Error al establecer permisos para ${dirPath}:`, err);
    }
  } else {
    console.log(`Directorio ya existe: ${dirPath}`);
  }
});

// Servir desde la raíz /uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// También servir desde /api/uploads para compatibilidad
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Servir archivos estáticos desde public
app.use(express.static(path.join(process.cwd(), 'public')));
// También hacer accesibles los archivos de public desde /api
app.use('/api', express.static(path.join(process.cwd(), 'public')));

console.log(`Sirviendo archivos estáticos desde: 
  - ${path.join(process.cwd(), 'uploads')} (accesible desde /uploads y /api/uploads)
  - ${path.join(process.cwd(), 'public')} (accesible desde / y /api)`);

// Los directorios ya se han creado anteriormente

// Comprobar conexión a la base de datos
testConnection();

// Rutas API
// Logging middleware para depurar
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.originalUrl}`);
  if (req.method === 'POST' && req.originalUrl.includes('/uploads/avatar')) {
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
    console.log('Body:', req.body ? Object.keys(req.body) : 'Empty body');
  }
  next();
});
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
app.use('/api/cleaning-duty', cleaningDutyRoutes);

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
