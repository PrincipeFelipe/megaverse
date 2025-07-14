// Necessary imports
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// Import all API route modules
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

// Configure environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
console.log('Server - Environment variables loaded from:', path.resolve(process.cwd(), '.env'));
console.log('Server - JWT_SECRET is configured:', !!process.env.JWT_SECRET);

// Create the Express application
const app = express();

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://clubmegaverse.com'], // Frontend domains
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- STATIC FILE SERVING (ONLY FOR UPLOADS) ---
// Create directory for blog images if it doesn't exist
const blogImagesDir = path.join(process.cwd(), 'uploads', 'blog');
if (!fs.existsSync(blogImagesDir)) {
  console.log(`Creating directory for blog images: ${blogImagesDir}`);
  fs.mkdirSync(blogImagesDir, { recursive: true });
} else {
  console.log(`Blog images directory already exists: ${blogImagesDir}`);
}

// Serve static files from 'uploads' directory
// Nginx is configured to handle /uploads/ directly, but this serves as a fallback or for direct backend access
app.use('/uploads', express.static('uploads'));
app.use('/api/uploads', express.static('uploads')); // For compatibility

console.log(`Serving static files from: ${process.cwd()}/uploads (accessible from /uploads and /api/uploads)`);

// Ensure necessary directories exist
const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  console.log(`Creating directory for avatars: ${avatarsDir}`);
  fs.mkdirSync(avatarsDir, { recursive: true });
} else {
  console.log(`Avatars directory already exists: ${avatarsDir}`);
}

const documentsDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(documentsDir)) {
  console.log(`Creating directory for documents: ${documentsDir}`);
  fs.mkdirSync(documentsDir, { recursive: true });
} else {
  console.log(`Documents directory already exists: ${documentsDir}`);
}

// Check database connection
testConnection();

// --- API ROUTES ---
// Mount all your API routes
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

// Test route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API funcionando correctamente' });
});

// Rutas directas para RSS (para compatibilidad con lectores RSS y servicios)
// Estas rutas deben ir antes del middleware 404
import { rssController } from './controllers/rss.js';
app.get('/feed.xml', rssController.getBlogRSSFeed);
app.get('/rss.xml', rssController.getBlogRSSFeed);
app.get('/rss/blog', rssController.getBlogRSSFeed);
app.get('/rss', rssController.getBlogRSSFeed);
app.get('/feed', rssController.getBlogRSSFeed);
app.get('/blog/feed', rssController.getBlogRSSFeed);
// Rutas específicas para Make.com
app.get('/make.xml', rssController.getBlogRSSFeed);
app.get('/make/feed.xml', rssController.getBlogRSSFeed);
app.get('/make/feed', rssController.getBlogRSSFeed);

// Handle not found routes (for API only)
// This middleware runs if no defined API routes match the request.
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada 2' }); // This message should only appear for non-existent API routes
});

// Global error handling
app.use((err, req, res, next) => {
  console.error('Error on server:', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start the server
const PORT = process.env.PORT || 3000; // Use port from environment variable or 3000 by default
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Export the app for PM2
export default app;