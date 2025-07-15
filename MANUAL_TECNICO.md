# Manual Técnico - MegaVerse

## 📋 Resumen del proyecto

**MegaVerse** es una aplicación web full-stack diseñada para la gestión integral de asociaciones de juegos de mesa. La aplicación resuelve la necesidad de centralizar y automatizar la administración de:

- **Reservas de mesas**: Sistema de calendario para reservar mesas por horas o días completos
- **Gestión de usuarios**: Control de acceso con roles (usuario/administrador)
- **Inventario de productos**: Gestión de stock y precios de productos consumibles
- **Sistema de consumos**: Registro y facturación de productos consumidos
- **Blog público**: Publicación de noticias y eventos con feed RSS
- **Gestión financiera**: Control de pagos, cuotas de entrada y deudas

### Problema que resuelve
Antes de MegaVerse, las asociaciones dependían de métodos manuales (hojas de cálculo, pizarras) para gestionar reservas y consumos, lo que generaba conflictos, pérdidas de información y dificultades administrativas. Esta aplicación digitaliza y automatiza estos procesos, proporcionando trazabilidad completa y acceso desde cualquier dispositivo.

---

## 🛠️ Tecnologías utilizadas

### Frontend
- **React 18** - Biblioteca principal para la interfaz de usuario
- **TypeScript** - Superset de JavaScript con tipado estático
- **Vite** - Herramienta de build y desarrollo rápido
- **Tailwind CSS** - Framework de CSS utility-first
- **Framer Motion** - Animaciones y transiciones fluidas
- **React Router DOM** - Enrutamiento del lado del cliente

### Componentes especializados
- **FullCalendar** - Sistema de calendario para reservas
- **TinyMCE** - Editor WYSIWYG para el blog
- **React PDF** - Visualización de documentos PDF
- **SweetAlert2** - Modales y alertas elegantes
- **Lucide React** - Biblioteca de iconos

### Backend
- **Node.js** - Entorno de ejecución del servidor
- **Express.js** - Framework web minimalista
- **MySQL** - Base de datos relacional
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **bcrypt** - Cifrado de contraseñas
- **Multer** - Manejo de uploads de archivos
- **CORS** - Configuración de políticas de origen cruzado

### Herramientas de desarrollo
- **ESLint** - Linter para mantener calidad del código
- **PostCSS** - Procesamiento de CSS
- **Autoprefixer** - Prefijos automáticos para CSS
- **Nodemon** - Recarga automática del servidor en desarrollo

---

## 📁 Estructura del proyecto

```
megaverse/
├── public/                    # Archivos estáticos del frontend
│   └── favicon.svg
├── server/                    # Backend de la aplicación
│   ├── config/               # Configuración de base de datos
│   ├── controllers/          # Lógica de negocio
│   │   ├── auth.js          # Autenticación y registro
│   │   ├── reservations.js  # Gestión de reservas
│   │   ├── products.js      # Gestión de productos
│   │   ├── blog.js          # Sistema de blog
│   │   ├── rss.js           # Generación de feeds RSS
│   │   └── ...
│   ├── middleware/           # Middlewares de Express
│   │   ├── auth.js          # Verificación de JWT
│   │   └── upload.js        # Configuración de uploads
│   ├── routes/               # Definición de rutas de API
│   ├── scripts/              # Scripts de utilidad y migración
│   ├── uploads/              # Archivos subidos por usuarios
│   ├── utils/                # Utilidades y helpers
│   ├── .env                  # Variables de entorno (desarrollo)
│   ├── .env.production      # Variables de entorno (producción)
│   ├── index.js             # Punto de entrada del servidor
│   └── package.json         # Dependencias del backend
├── src/                      # Código fuente del frontend
│   ├── components/           # Componentes reutilizables
│   │   ├── auth/            # Componentes de autenticación
│   │   ├── calendar/        # Sistema de calendario
│   │   ├── common/          # Componentes comunes (Header, Sidebar)
│   │   ├── forms/           # Formularios específicos
│   │   └── ...
│   ├── contexts/             # Contextos de React (AuthContext)
│   ├── hooks/                # Custom hooks
│   ├── pages/                # Páginas principales de la aplicación
│   ├── services/             # Servicios de API y comunicación
│   ├── styles/               # Archivos de estilos globales
│   ├── types/                # Definiciones de TypeScript
│   ├── utils/                # Utilidades del frontend
│   └── main.tsx             # Punto de entrada de React
├── docs/                     # Documentación técnica específica
├── tests/                    # Scripts de testing y validación
├── uploads/                  # Carpeta de archivos subidos (frontend)
├── deploy.sh                 # Script de despliegue Linux/Unix
├── deploy.ps1               # Script de despliegue Windows
├── package.json             # Dependencias del frontend
├── vite.config.ts           # Configuración de Vite
├── tailwind.config.js       # Configuración de Tailwind
└── tsconfig.json            # Configuración de TypeScript
```

### Descripción de carpetas clave

- **`server/controllers/`**: Contiene la lógica de negocio separada por módulos (auth, reservations, products, etc.)
- **`server/routes/`**: Define los endpoints de la API REST y conecta con los controllers
- **`src/components/`**: Componentes React organizados por funcionalidad
- **`src/contexts/`**: Gestión de estado global (autenticación, configuración)
- **`src/services/`**: Abstrae las llamadas a la API del backend
- **`docs/`**: Documentación específica de despliegue y solución de problemas

---

## ⚙️ Instalación y configuración del entorno de desarrollo

### Requisitos previos

- **Node.js** versión 16 o superior
- **MySQL** versión 8.0 o superior
- **Git** para clonar el repositorio
- **XAMPP** (opcional, para entorno Windows con MySQL incluido)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/megaverse.git
cd megaverse
```

### 2. Configuración del Backend

```bash
# Navegar a la carpeta del servidor
cd server

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env
```

### 3. Configurar variables de entorno

Editar el archivo `server/.env`:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_DATABASE=db_megaverse

# Seguridad
JWT_SECRET=tu_clave_secreta_muy_segura_aqui

# Servidor
PORT=8090

# URLs (para RSS y notificaciones)
SITE_URL=http://localhost:5173
```

### 4. Inicializar la base de datos

```bash
# Desde la carpeta server/
npm run init-db
```

Este comando creará automáticamente:
- La base de datos `db_megaverse`
- Todas las tablas necesarias
- Datos de ejemplo para testing
- Un usuario administrador por defecto

### 5. Configuración del Frontend

```bash
# Volver a la raíz del proyecto
cd ..

# Instalar dependencias del frontend
npm install

# Crear archivo de variables de entorno
echo "VITE_API_URL=http://localhost:8090/api" > .env
```

### 6. Iniciar el entorno de desarrollo

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 7. Verificar la instalación

- Frontend: http://localhost:5173
- Backend API: http://localhost:8090/api
- Credenciales por defecto: admin@megaverse.com / password123

---

## 🚀 Guía de uso básico

### Flujo principal de usuario

#### 1. **Registro y autenticación**
- Los nuevos usuarios pueden registrarse desde `/auth`
- El sistema solicita: nombre, email, contraseña
- Tras el registro, se asigna automáticamente el rol de "usuario"

#### 2. **Panel principal (`/dashboard`)**
- Vista general con estadísticas personales
- Accesos rápidos a reservas, productos y perfil
- Notificaciones importantes del sistema

#### 3. **Sistema de reservas (`/reservations`)**
- **Vista de calendario**: Navegación por semana/mes/día
- **Crear reserva**: Seleccionar horario y mesa disponible
- **Gestión de reservas**: Ver, modificar o cancelar reservas propias
- **Reservas de día completo**: Requieren aprobación de administrador

#### 4. **Gestión de productos (`/products`)**
- Catálogo de productos disponibles para consumo
- Añadir productos al "carrito" de consumo
- Historial de consumos realizados

#### 5. **Blog público (`/blog` y `/public/blog`)**
- Lectura de artículos sin autenticación
- Vista de administrador para crear/editar artículos (requiere permisos)
- Feed RSS automático en `/api/rss`

### Funcionalidades por rol

#### **Usuario estándar**
- Crear y gestionar sus propias reservas
- Ver todas las reservas (solo lectura de otras)
- Realizar consumos de productos
- Ver su historial y estadísticas
- Leer blog público

#### **Administrador**
- Todas las funciones de usuario
- Gestionar usuarios (crear, editar, eliminar)
- Aprobar/denegar reservas de día completo
- Gestionar inventario de productos
- Crear y publicar artículos del blog
- Acceso a estadísticas globales
- Configurar parámetros del sistema

---

## 🔄 Flujo de desarrollo y buenas prácticas

### Estrategia de branching

```bash
main/                    # Rama principal (producción)
├── develop/            # Rama de desarrollo (staging)
├── feature/nombre      # Nuevas funcionalidades
├── bugfix/nombre       # Corrección de errores
└── hotfix/nombre       # Correcciones críticas en producción
```

### Convención de commits

```bash
# Tipos de commit
feat: nueva funcionalidad
fix: corrección de errores
docs: cambios en documentación
style: cambios de formato
refactor: refactoring de código
test: añadir o modificar tests
chore: tareas de mantenimiento

# Ejemplos
feat(reservations): añadir validación de reservas consecutivas
fix(auth): corregir validación de tokens expirados
docs(readme): actualizar guía de instalación
```

### Workflow de desarrollo

1. **Crear rama feature:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/nueva-funcionalidad
```

2. **Desarrollo y testing:**
```bash
# Hacer cambios
git add .
git commit -m "feat(modulo): descripción del cambio"

# Testing local
npm run lint           # Frontend
cd server && npm run dev  # Backend
```

3. **Pull Request:**
```bash
git push origin feature/nueva-funcionalidad
# Crear PR en GitHub hacia develop
```

4. **Revisión de código:**
- Al menos una aprobación requerida
- Verificar que pasan todos los checks
- Testing en entorno de staging

5. **Merge y deploy:**
```bash
# Merge a develop
git checkout develop
git merge feature/nueva-funcionalidad

# Deploy a staging para testing final
# Si todo OK, merge a main para producción
```

### Estructura de archivos para nuevas funcionalidades

```typescript
// 1. Definir tipos en src/types/
export interface NuevaFuncionalidad {
  id: number;
  nombre: string;
  // ...
}

// 2. Crear servicio en src/services/
export const nuevaFuncionalidadService = {
  getAll: () => api.get('/nueva-funcionalidad'),
  create: (data) => api.post('/nueva-funcionalidad', data),
  // ...
};

// 3. Crear componentes en src/components/nueva-funcionalidad/
// 4. Crear páginas en src/pages/
// 5. Añadir rutas en App.tsx
// 6. Crear controller en server/controllers/
// 7. Definir rutas en server/routes/
```

---

## 🔒 Consideraciones de seguridad y rendimiento

### Seguridad

#### **Autenticación y autorización**
- **JWT tokens** con expiración configurable (por defecto 24h)
- **Refresh tokens** para renovación automática
- **Bcrypt** para hash de contraseñas (factor 12)
- **Middleware de autenticación** en todas las rutas protegidas

#### **Validación de datos**
```javascript
// Ejemplo de validación en backend
const { body, validationResult } = require('express-validator');

const validateReservation = [
  body('tableId').isInt().withMessage('ID de mesa inválido'),
  body('startTime').isISO8601().withMessage('Fecha de inicio inválida'),
  body('endTime').isISO8601().withMessage('Fecha de fin inválida'),
];
```

#### **Protección CORS**
```javascript
// Configuración CORS restrictiva
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.com'] 
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

#### **Sanitización de uploads**
- **Whitelist de extensiones** permitidas
- **Límites de tamaño** por archivo y total
- **Escaneado de contenido** malicioso
- **Almacenamiento separado** del código fuente

#### **Variables de entorno sensibles**
```bash
# Nunca commitear archivos .env
# Usar .env.example como plantilla
# Rotar JWT_SECRET regularmente
# Credenciales de DB con permisos mínimos
```

### Rendimiento

#### **Optimizaciones del Frontend**
- **Code splitting** automático con Vite
- **Lazy loading** de componentes pesados
- **Memoización** de componentes con React.memo
- **Debouncing** en búsquedas y filtros

#### **Optimizaciones del Backend**
- **Connection pooling** para MySQL
- **Compresión gzip** de respuestas
- **Caché de consultas** frecuentes
- **Paginación** en listados largos

#### **Base de datos**
```sql
-- Índices optimizados
CREATE INDEX idx_reservations_date_table ON reservations(start_time, table_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_active ON products(active);
```

#### **Monitoreo de rendimiento**
```javascript
// Logging de consultas lentas
const logSlowQueries = (duration) => {
  if (duration > 1000) {
    console.warn(`Consulta lenta detectada: ${duration}ms`);
  }
};
```

---

## 🚀 Despliegue

### Entornos disponibles

#### **Desarrollo** (Local)
- Frontend: http://localhost:5173
- Backend: http://localhost:8090
- Base de datos: localhost:3306

#### **Staging** (Opcional)
- Para testing de integraciones
- Misma configuración que producción
- Base de datos separada

#### **Producción**
- Servidor: VPS/Cloud (Debian 12/Ubuntu 22.04 recomendado)
- Proxy reverso: Nginx
- Gestor de procesos: PM2
- Base de datos: MySQL 8.0+
- Túnel seguro: Cloudflare Tunnel
- SSL: Let's Encrypt con validación DNS

### Despliegue automático

#### **Usando el script de despliegue:**

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```powershell
.\deploy.ps1
```

#### **Despliegue manual paso a paso:**

1. **Preparar el servidor Debian 12/Ubuntu 22.04:**
```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y
sudo apt install curl git nano dnsutils -y

# Instalar Node.js 20 LTS (recomendado para producción)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node -v && npm -v

# Instalar PM2 globalmente
sudo npm install pm2@latest -g

# Instalar Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Instalar MySQL/MariaDB
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Instalar PHP-FPM (si necesitas phpMyAdmin)
sudo apt install php-fpm php-mysql php-mbstring php-zip php-gd php-json php-curl php-xml -y
sudo systemctl start php8.2-fpm
sudo systemctl enable php8.2-fpm

# Instalar Certbot con plugin Cloudflare DNS
sudo apt install certbot python3-certbot-dns-cloudflare -y
```

2. **Configurar base de datos:**
```bash
sudo mysql_secure_installation
mysql -u root -p

CREATE DATABASE db_megaverse;
CREATE USER 'megaverse_user'@'localhost' IDENTIFIED BY 'password_muy_seguro';
GRANT ALL PRIVILEGES ON db_megaverse.* TO 'megaverse_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. **Clonar y configurar aplicación:**
```bash
# Crear directorio del proyecto
sudo mkdir -p /var/www/megaverse
cd /var/www/megaverse

# Clonar repositorio
sudo git clone https://github.com/PrincipeFelipe/megaverse.git .
sudo chown -R www-data:www-data /var/www/megaverse

# Configurar backend
cd /var/www/megaverse/backend
npm ci --production

# Configurar variables de entorno de producción
sudo nano /var/www/megaverse/private/.env.production
```

**Contenido del archivo `.env.production`:**
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=2af1af5bd8c15a2c17b6673ee8501033c2b737bbbdba14e291acf7b9bc01d9c8
DB_HOST=localhost
DB_USER=megaverse_user
DB_PASSWORD=M3g4V3rs3
DB_NAME=db_megaverse
SITE_URL=https://clubmegaverse.com
```

4. **Configurar PM2 con ecosystem.config.cjs:**
```bash
sudo nano /var/www/megaverse/backend/ecosystem.config.cjs
```

```javascript
module.exports = {
  apps: [{
    name: 'megaverse-api',
    script: './index.js',
    cwd: '/var/www/megaverse/backend',
    interpreter: '/usr/bin/node',
    interpreter_args: '--experimental-modules',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: '/var/www/megaverse/private/.env.production',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/www/megaverse/private/logs/app-err.log',
    out_file: '/var/www/megaverse/private/logs/app-out.log',
    log_file: '/var/www/megaverse/private/logs/app.log',
    merge_logs: true,
    time: true,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
```

5. **Configurar el backend (index.js) para producción:**

**⚠️ IMPORTANTE**: El backend NO debe servir archivos estáticos del frontend en producción. Nginx se encarga de eso.

```javascript
// /var/www/megaverse/backend/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import path from 'path';

// Importar todas las rutas de API
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

// Configurar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();

// Configuración CORS para producción
app.use(cors({
  origin: 'https://clubmegaverse.com', // ⚠️ CRÍTICO: Dominio exacto
  exposedHeaders: ['Content-Disposition']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir únicamente archivos de uploads (Nginx maneja el resto)
app.use('/uploads', express.static('uploads'));
app.use('/api/uploads', express.static('uploads'));

// Verificar conexión a base de datos
testConnection();

// Montar todas las rutas de API
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

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API funcionando correctamente' });
});

// Manejo de rutas no encontradas (solo para API)
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error en servidor:', err.stack || err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});

export default app;
```

6. **Compilar frontend:**
```bash
cd /var/www/megaverse/frontend
npm ci
npm run build

# Los archivos compilados estarán en /var/www/megaverse/frontend/dist
```

7. **Configurar Nginx:**

**a) Configuración principal (/etc/nginx/sites-available/megaverse):**
```nginx
# Redirección HTTP a HTTPS
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name clubmegaverse.com www.clubmegaverse.com;
    return 301 https://$host$request_uri;
}

# Servidor HTTPS principal
server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name clubmegaverse.com www.clubmegaverse.com;

    # Configuración SSL
    ssl_certificate /etc/letsencrypt/live/clubmegaverse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clubmegaverse.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/clubmegaverse.com/chain.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers "ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20";
    ssl_prefer_server_ciphers on;

    # Directorio raíz del frontend
    root /var/www/megaverse/frontend/dist;
    index index.html;

    # Configuraciones de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy para API del backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }

    # Servir archivos de uploads
    location /uploads {
        alias /var/www/megaverse/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend SPA - todas las rutas van a index.html
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Archivos estáticos con caché
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Bloquear acceso a archivos sensibles
    location ~ /\.git { deny all; }
    location ~ /\.env { deny all; }
    location ~ /node_modules { deny all; }
}
```

**b) Configuración para phpMyAdmin (/etc/nginx/sites-available/phpmyadmin.conf):**
```nginx
# phpMyAdmin en HTTP (interno)
server {
    listen 80;
    server_name phpmyadmin.clubmegaverse.com;
    root /usr/share/phpmyadmin;
    index index.php;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}

# phpMyAdmin en HTTPS
server {
    listen 443 ssl http2;
    server_name phpmyadmin.clubmegaverse.com;
    root /usr/share/phpmyadmin;
    index index.php;

    # Usar el mismo certificado SSL
    ssl_certificate /etc/letsencrypt/live/clubmegaverse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clubmegaverse.com/privkey.pem;
    
    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

8. **Habilitar configuraciones de Nginx:**
```bash
# Eliminar configuración por defecto
sudo rm -f /etc/nginx/sites-enabled/default

# Habilitar nuestras configuraciones
sudo ln -s /etc/nginx/sites-available/megaverse /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/phpmyadmin.conf /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t
sudo systemctl restart nginx
```

9. **Configurar Cloudflare Tunnel:**

**a) Instalar cloudflared:**
```bash
curl -L --output cloudflared-linux-amd64.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**b) Crear y configurar túnel:**
```bash
# Autenticar con Cloudflare (seguir las instrucciones en pantalla)
cloudflared tunnel login

# Crear túnel
cloudflared tunnel create megaverse-tunnel

# El comando anterior creará un archivo de credenciales en ~/.cloudflared/
# Anota el UUID del túnel
```

**c) Configurar config.yml (/etc/cloudflared/config.yml):**
```yaml
tunnel: dbda2945-4a30-4687-b844-03dd670a7c13  # Tu UUID del túnel
credentials-file: /root/.cloudflared/dbda2945-4a30-4687-b844-03dd670a7c13.json

ingress:
  # phpMyAdmin (regla más específica primero)
  - hostname: phpmyadmin.clubmegaverse.com
    service: http://localhost:80
    originRequest:
      httpHostHeader: phpmyadmin.clubmegaverse.com
  
  # Aplicación principal
  - hostname: clubmegaverse.com
    service: http://localhost:443
    originRequest:
      httpHostHeader: clubmegaverse.com
  
  - hostname: www.clubmegaverse.com
    service: http://localhost:443
    originRequest:
      httpHostHeader: www.clubmegaverse.com
  
  # Catch-all (obligatorio)
  - service: http_status:404
```

**d) Instalar como servicio:**
```bash
sudo cloudflared tunnel install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
sudo systemctl status cloudflared
```

10. **Configurar SSL con Let's Encrypt:**

**a) Crear archivo de credenciales de Cloudflare:**
```bash
sudo nano /etc/letsencrypt/cloudflare_api_token.ini
```

```ini
dns_cloudflare_api_token = TU_TOKEN_DE_CLOUDFLARE_AQUI
```

```bash
sudo chmod 600 /etc/letsencrypt/cloudflare_api_token.ini
```

**b) Generar certificados:**
```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare_api_token.ini \
  -d clubmegaverse.com \
  -d www.clubmegaverse.com \
  -d phpmyadmin.clubmegaverse.com
```

11. **Inicializar base de datos y iniciar servicios:**
```bash
# Inicializar esquema de base de datos
cd /var/www/megaverse/backend
npm run init-db

# Iniciar aplicación con PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# Verificar estado
pm2 list
pm2 logs megaverse-api
```

12. **Configurar DNS en Cloudflare:**

En el panel de Cloudflare (dash.cloudflare.com):
- `clubmegaverse.com` → CNAME o A record apuntando al túnel (nube naranja activada)
- `www.clubmegaverse.com` → CNAME apuntando a clubmegaverse.com (nube naranja activada)
- `phpmyadmin.clubmegaverse.com` → CNAME apuntando al túnel (nube naranja activada)

### Variables de entorno de producción

**Backend (.env.production):**
```env
# Entorno
NODE_ENV=production

# Servidor
PORT=3001
HOST=localhost

# Base de datos
DB_HOST=localhost
DB_USER=megaverse_user
DB_PASSWORD=M3g4V3rs3
DB_NAME=db_megaverse
DB_PORT=3306

# Autenticación
JWT_SECRET=2af1af5bd8c15a2c17b6673ee8501033c2b737bbbdba14e291acf7b9bc01d9c8
JWT_EXPIRES_IN=24h

# URLs
SITE_URL=https://clubmegaverse.com
API_URL=https://clubmegaverse.com/api

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email (si se implementa)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@clubmegaverse.com
SMTP_PASSWORD=tu_password_smtp

# Cloudflare (si se necesita API)
CLOUDFLARE_API_TOKEN=tu_token_cloudflare
CLOUDFLARE_ZONE_ID=tu_zone_id

# Debug
DEBUG=false
LOG_LEVEL=info
```

**Frontend (.env.production):**
```env
# API
VITE_API_URL=https://clubmegaverse.com/api

# Aplicación
VITE_APP_NAME=MegaVerse
VITE_APP_VERSION=1.0.0

# URLs
VITE_SITE_URL=https://clubmegaverse.com

# Configuración de build
VITE_BUILD_MODE=production
```

---

## 🛠️ Problemas comunes y soluciones

### Problemas de instalación

#### **Error: "Cannot connect to MySQL"**
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en .env
# Crear usuario si no existe:
mysql -u root -p
CREATE USER 'tu_usuario'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON db_megaverse.* TO 'tu_usuario'@'localhost';
FLUSH PRIVILEGES;
```

#### **Error: "Port 8090 already in use"**
```bash
# Encontrar proceso usando el puerto
sudo lsof -i :8090

# Matar proceso si es necesario
sudo kill -9 PID_DEL_PROCESO

# O cambiar puerto en server/.env
PORT=8091
```

#### **Error: "npm install fails"**
```bash
# Limpiar caché de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Si persiste, verificar versión de Node
node --version  # Debe ser >= 16
```

### Problemas de desarrollo

#### **CORS errors en desarrollo**
```bash
# Ejecutar script de diagnóstico
./fix-cors-settings.sh

# Verificar que ambos servidores estén corriendo
# Frontend en :5173, Backend en :8090

# Verificar configuración CORS en server/index.js
```

#### **Error: "JWT token invalid"**
```javascript
// Limpiar localStorage si hay tokens corruptos
localStorage.removeItem('token');
localStorage.removeItem('user');

// Verificar que JWT_SECRET sea el mismo en desarrollo y token
```

#### **Errores de timezone en reservas**
```bash
# Ejecutar script de corrección
cd server
npm run fix-timezone-display

# Verificar zona horaria del servidor
timedatectl status

# En desarrollo, usar UTC para consistencia
export TZ=UTC
```

### Problemas de producción

#### **Error 502 Bad Gateway (Nginx)**
```bash
# Verificar que PM2 esté corriendo
pm2 list

# Verificar logs de la aplicación
pm2 logs

# Verificar configuración de Nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### **Base de datos desconectada**
```bash
# Verificar estado de MySQL
sudo systemctl status mysql

# Verificar conexiones activas
mysql -u root -p
SHOW PROCESSLIST;

# Verificar logs de MySQL
sudo tail -f /var/log/mysql/error.log
```

#### **Alto uso de memoria/CPU**
```bash
# Monitorear con PM2
pm2 monit

# Verificar consultas lentas en MySQL
mysql -u root -p
SHOW FULL PROCESSLIST;

# Optimizar base de datos
OPTIMIZE TABLE reservations, users, products;
```

### Problemas específicos de producción encontrados y solucionados

#### **Error: "Incorrect datetime value" en reservas**

**Síntoma:**
```
sqlMessage: "Incorrect datetime value: '2025-07-14T08:00:00.000Z' for column `db_megaverse`.`reservations`.`start_time` at row 1"
```

**Causa:** MySQL/MariaDB en producción es estricto con el formato de fecha y no acepta el formato ISO 8601 con 'Z' y milisegundos.

**Solución aplicada en `server/controllers/reservations.js`:**
```javascript
// En lugar de usar directamente el formato ISO
const startTimeIso = startDate.toISOString();

// Convertir a formato MySQL YYYY-MM-DD HH:MM:SS
const startTimeSql = startDate.toISOString().slice(0, 19).replace('T', ' ');
const endTimeSql = endDate.toISOString().slice(0, 19).replace('T', ' ');

// Usar en la consulta SQL
const [result] = await connection.query(
  `INSERT INTO reservations 
   (user_id, table_id, start_time, end_time, ...) 
   VALUES (?, ?, ?, ?, ...)`,
  [userId, tableId, startTimeSql, endTimeSql, ...]
);
```

#### **Error: "ReferenceError: safeParseDate is not defined"**

**Síntoma:**
```
ReferenceError: safeParseDate is not defined
ReferenceError: approved is not defined
```

**Causa:** Problemas con la importación de módulos ES en Node.js en producción o ámbito de variables incorrecto.

**Solución aplicada:**
1. **Integrar `safeParseDate` directamente en `reservations.js`:**
```javascript
// Eliminar de importaciones y definir localmente
const safeParseDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date;
};
```

2. **Declarar variable `approved` al inicio de la función:**
```javascript
export const createReservation = async (req, res) => {
  try {
    let approved = true; // Declarada al inicio de la función
    
    // ... resto de la lógica ...
    
    // Solo se reasigna el valor, no se redeclara
    if (normalizedValues.allDay && config.requires_approval_for_all_day && req.user.role !== 'admin') {
      approved = false;
    }
  } catch (error) { /* ... */ }
};
```

#### **Error: "ERR_TOO_MANY_REDIRECTS" con Cloudflare**

**Síntoma:** Bucle infinito de redirecciones al acceder al sitio web.

**Causa:** Configuración incorrecta entre Cloudflare, el túnel y Nginx.

**Solución aplicada:**
1. **Configurar SSL Mode en Cloudflare:** Cambiar a "Flexible" temporalmente o "Full (strict)" con certificados válidos.
2. **Asegurar configuración correcta en config.yml del túnel:**
```yaml
ingress:
  # Orden específico: phpMyAdmin primero (más específico)
  - hostname: phpmyadmin.clubmegaverse.com
    service: http://localhost:80
  # Luego aplicación principal
  - hostname: clubmegaverse.com
    service: http://localhost:443
  - hostname: www.clubmegaverse.com
    service: http://localhost:443
  - service: http_status:404
```

#### **Error: Headers "x-powered-by: Express" en la raíz**

**Síntoma:** El backend de Express se muestra en lugar del frontend en la página principal.

**Causa:** Nginx no configurado correctamente como `default_server` o conflicto en las rutas.

**Solución aplicada:**
1. **Asegurar `default_server` en Nginx:**
```nginx
server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name clubmegaverse.com www.clubmegaverse.com;
    # ...
}
```

2. **Verificar que no hay otros archivos en sites-enabled:**
```bash
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### **Problema de zona horaria en validaciones**

**Síntoma:** Reservas válidas rechazadas como "fecha pasada" debido a diferencias de zona horaria.

**Solución aplicada:**
1. **Configurar servidor en UTC:**
```bash
sudo timedatectl set-timezone UTC
sudo reboot
```

2. **Configurar MySQL en UTC:**
```bash
# Editar /etc/mysql/mysql.conf.d/mysqld.cnf
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Añadir en la sección [mysqld]:
[mysqld]
default_time_zone = '+00:00'

# Reiniciar MySQL
sudo systemctl restart mysql

# Verificar configuración
mysql -u root -p
SELECT @@global.time_zone, @@session.time_zone;
```

3. **Verificar compatibilidad de fechas:**
```sql
-- En MySQL, verificar que las fechas se almacenan correctamente
USE db_megaverse;
SELECT 
    id, 
    start_time, 
    end_time,
    CONVERT_TZ(start_time, '+00:00', 'SYSTEM') as start_time_local,
    created_at
FROM reservations 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📋 Apéndices

### Apéndice A: Configuración detallada de Cloudflare

#### **Configuración de DNS en Cloudflare Dashboard**

En `dash.cloudflare.com` > Tu dominio > DNS > Records:

| Tipo | Nombre | Contenido | Proxy | TTL |
|------|--------|-----------|--------|-----|
| CNAME | @ (clubmegaverse.com) | [tunnel-id].cfargotunnel.com | 🟠 Proxied | Auto |
| CNAME | www | clubmegaverse.com | 🟠 Proxied | Auto |
| CNAME | phpmyadmin | clubmegaverse.com | 🟠 Proxied | Auto |

#### **Configuración de SSL/TLS en Cloudflare**

1. **SSL/TLS encryption mode**: Full (strict)
2. **Always Use HTTPS**: ON
3. **HTTP Strict Transport Security (HSTS)**: Habilitado
4. **Minimum TLS Version**: 1.2
5. **Opportunistic Encryption**: ON
6. **TLS 1.3**: ON

#### **Configuración de Security en Cloudflare**

1. **Security Level**: Medium
2. **Bot Fight Mode**: ON
3. **Challenge Passage**: 30 minutos
4. **Browser Integrity Check**: ON

#### **Page Rules recomendadas**

| URL | Configuración |
|-----|--------------|
| `https://clubmegaverse.com/api/*` | Cache Level: Bypass, Security Level: High |
| `https://clubmegaverse.com/uploads/*` | Cache Level: Standard, Edge Cache TTL: 1 month |
| `https://phpmyadmin.clubmegaverse.com/*` | Security Level: High, Always Use HTTPS: ON |

### Apéndice B: Comandos de administración frecuentes

#### **Gestión de PM2**
```bash
# Estado de aplicaciones
pm2 list
pm2 info megaverse-api
pm2 monit

# Logs
pm2 logs megaverse-api
pm2 logs megaverse-api --lines 100
pm2 logs megaverse-api --err

# Reinicio
pm2 restart megaverse-api
pm2 reload megaverse-api  # Zero-downtime reload
pm2 stop megaverse-api
pm2 start megaverse-api

# Configuración
pm2 startup
pm2 save
pm2 dump
pm2 kill  # Mata todos los procesos PM2
```

#### **Gestión de Nginx**
```bash
# Estado y control
sudo systemctl status nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx

# Configuración
sudo nginx -t  # Verificar sintaxis
sudo nginx -T  # Mostrar configuración completa

# Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log | grep "POST\|PUT\|DELETE"
```

#### **Gestión de MySQL**
```bash
# Estado y control
sudo systemctl status mysql
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl restart mysql

# Conexión
mysql -u root -p
mysql -u megaverse_user -pM3g4V3rs3 db_megaverse

# Logs y monitoreo
sudo tail -f /var/log/mysql/error.log
sudo tail -f /var/log/mysql/slow.log

# Comandos útiles en MySQL
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS;
SELECT * FROM information_schema.innodb_trx;
```

#### **Gestión de Cloudflare Tunnel**
```bash
# Estado y control
sudo systemctl status cloudflared
sudo systemctl start cloudflared
sudo systemctl stop cloudflared
sudo systemctl restart cloudflared

# Logs
sudo journalctl -u cloudflared -f
sudo journalctl -u cloudflared --since "1 hour ago"

# Configuración
cloudflared tunnel list
cloudflared tunnel info megaverse-tunnel
sudo cloudflared tunnel validate /etc/cloudflared/config.yml
```

### Apéndice C: Checklist de mantenimiento

#### **Mantenimiento diario**
- [ ] Verificar estado de servicios: `systemctl status nginx mysql cloudflared && pm2 list`
- [ ] Revisar logs de errores: `pm2 logs megaverse-api --err --lines 50`
- [ ] Comprobar espacio en disco: `df -h`
- [ ] Verificar memoria: `free -h`
- [ ] Comprobar accesibilidad web: `curl -I https://clubmegaverse.com`

#### **Mantenimiento semanal**
- [ ] Actualizar sistema: `sudo apt update && sudo apt upgrade`
- [ ] Verificar certificados SSL: `sudo certbot certificates`
- [ ] Limpiar logs antiguos: `sudo journalctl --vacuum-time=7d`
- [ ] Verificar backup automático
- [ ] Revisar logs de Nginx: `sudo logrotate -f /etc/logrotate.d/nginx`
- [ ] Optimizar base de datos: `OPTIMIZE TABLE reservations, users, products;`

#### **Mantenimiento mensual**
- [ ] Renovar certificados SSL: `sudo certbot renew --dry-run`
- [ ] Actualizar dependencias de Node.js: `npm audit && npm audit fix`
- [ ] Verificar configuración de seguridad de Cloudflare
- [ ] Revisar y rotar logs de aplicación
- [ ] Crear backup completo del sistema
- [ ] Revisar métricas de rendimiento

### Apéndice D: Estructura de la base de datos

#### **Tablas principales**

```sql
-- Usuarios
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Mesas
CREATE TABLE tables (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INT DEFAULT 4,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservas
CREATE TABLE reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    table_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration_hours DECIMAL(4,2),
    num_members INT DEFAULT 1,
    num_guests INT DEFAULT 0,
    all_day BOOLEAN DEFAULT FALSE,
    reason TEXT,
    approved BOOLEAN DEFAULT TRUE,
    status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (table_id) REFERENCES tables(id),
    INDEX idx_reservations_date_table (start_time, table_id),
    INDEX idx_reservations_user (user_id),
    INDEX idx_reservations_status (status)
);

-- Productos
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_active (active),
    INDEX idx_products_category (category)
);

-- Consumos
CREATE TABLE consumptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_consumations_user_date (user_id, consumed_at),
    INDEX idx_consumptions_product (product_id)
);

-- Blog
CREATE TABLE blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    excerpt TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    featured_image VARCHAR(255),
    status ENUM('draft', 'published') DEFAULT 'draft',
    author_id INT NOT NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_blog_status_published (status, published_at),
    INDEX idx_blog_slug (slug)
);

-- Configuración de reservas
CREATE TABLE reservation_config (
    id INT PRIMARY KEY DEFAULT 1,
    max_hours_per_reservation INT DEFAULT 4,
    max_reservations_per_user_per_day INT DEFAULT 1,
    min_hours_in_advance INT DEFAULT 0,
    allowed_start_time TIME DEFAULT '08:00:00',
    allowed_end_time TIME DEFAULT '22:00:00',
    requires_approval_for_all_day BOOLEAN DEFAULT TRUE,
    allow_consecutive_reservations BOOLEAN DEFAULT TRUE,
    min_time_between_reservations INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Apéndice E: Endpoints de API

#### **Autenticación (`/api/auth`)**
- `POST /register` - Registro de usuarios
- `POST /login` - Inicio de sesión
- `POST /logout` - Cerrar sesión
- `GET /me` - Obtener usuario actual
- `PUT /profile` - Actualizar perfil

#### **Usuarios (`/api/users`)**
- `GET /` - Listar usuarios (admin)
- `GET /:id` - Obtener usuario específico
- `PUT /:id` - Actualizar usuario
- `DELETE /:id` - Eliminar usuario (admin)

#### **Reservas (`/api/reservations`)**
- `GET /` - Listar todas las reservas
- `GET /:id` - Obtener reserva específica
- `POST /` - Crear nueva reserva
- `PUT /:id` - Actualizar reserva
- `DELETE /:id` - Eliminar reserva
- `PATCH /:id/status` - Cambiar estado de reserva
- `POST /:id/approve` - Aprobar reserva (admin)
- `POST /:id/reject` - Rechazar reserva (admin)

#### **Productos (`/api/products`)**
- `GET /` - Listar productos
- `GET /:id` - Obtener producto específico
- `POST /` - Crear producto (admin)
- `PUT /:id` - Actualizar producto (admin)
- `DELETE /:id` - Eliminar producto (admin)

#### **Consumos (`/api/consumptions`)**
- `GET /` - Listar consumos del usuario
- `POST /` - Registrar nuevo consumo
- `GET /stats` - Estadísticas de consumos

#### **Blog (`/api/blog`)**
- `GET /` - Listar artículos publicados
- `GET /:slug` - Obtener artículo por slug
- `POST /` - Crear artículo (admin)
- `PUT /:id` - Actualizar artículo (admin)
- `DELETE /:id` - Eliminar artículo (admin)

#### **RSS (`/api/rss`)**
- `GET /` - Feed RSS del blog
- `GET /xml` - Feed RSS en formato XML

#### **Configuración (`/api/config`)**
- `GET /reservations` - Obtener configuración de reservas
- `PUT /reservations` - Actualizar configuración (admin)

### Apéndice F: Variables de entorno completas

#### **Backend (.env.production)**
```env
# Entorno
NODE_ENV=production

# Servidor
PORT=3001
HOST=localhost

# Base de datos
DB_HOST=localhost
DB_USER=megaverse_user
DB_PASSWORD=M3g4V3rs3
DB_NAME=db_megaverse
DB_PORT=3306

# Autenticación
JWT_SECRET=2af1af5bd8c15a2c17b6673ee8501033c2b737bbbdba14e291acf7b9bc01d9c8
JWT_EXPIRES_IN=24h

# URLs
SITE_URL=https://clubmegaverse.com
API_URL=https://clubmegaverse.com/api

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email (si se implementa)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@clubmegaverse.com
SMTP_PASSWORD=tu_password_smtp

# Cloudflare (si se necesita API)
CLOUDFLARE_API_TOKEN=tu_token_cloudflare
CLOUDFLARE_ZONE_ID=tu_zone_id

# Debug
DEBUG=false
LOG_LEVEL=info
```

#### **Frontend (.env.production)**
```env
# API
VITE_API_URL=https://clubmegaverse.com/api

# Aplicación
VITE_APP_NAME=MegaVerse
VITE_APP_VERSION=1.0.0

# URLs
VITE_SITE_URL=https://clubmegaverse.com

# Configuración de build
VITE_BUILD_MODE=production
```

---

## 🛠️ Problemas comunes y soluciones

### Problemas de instalación

#### **Error: "Cannot connect to MySQL"**
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en .env
# Crear usuario si no existe:
mysql -u root -p
CREATE USER 'tu_usuario'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON db_megaverse.* TO 'tu_usuario'@'localhost';
FLUSH PRIVILEGES;
```

#### **Error: "Port 8090 already in use"**
```bash
# Encontrar proceso usando el puerto
sudo lsof -i :8090

# Matar proceso si es necesario
sudo kill -9 PID_DEL_PROCESO

# O cambiar puerto en server/.env
PORT=8091
```

#### **Error: "npm install fails"**
```bash
# Limpiar caché de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Si persiste, verificar versión de Node
node --version  # Debe ser >= 16
```

### Problemas de desarrollo

#### **CORS errors en desarrollo**
```bash
# Ejecutar script de diagnóstico
./fix-cors-settings.sh

# Verificar que ambos servidores estén corriendo
# Frontend en :5173, Backend en :8090

# Verificar configuración CORS en server/index.js
```

#### **Error: "JWT token invalid"**
```javascript
// Limpiar localStorage si hay tokens corruptos
localStorage.removeItem('token');
localStorage.removeItem('user');

// Verificar que JWT_SECRET sea el mismo en desarrollo y token
```

#### **Errores de timezone en reservas**
```bash
# Ejecutar script de corrección
cd server
npm run fix-timezone-display

# Verificar zona horaria del servidor
timedatectl status

# En desarrollo, usar UTC para consistencia
export TZ=UTC
```

### Problemas de producción

#### **Error 502 Bad Gateway (Nginx)**
```bash
# Verificar que PM2 esté corriendo
pm2 list

# Verificar logs de la aplicación
pm2 logs

# Verificar configuración de Nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### **Base de datos desconectada**
```bash
# Verificar estado de MySQL
sudo systemctl status mysql

# Verificar conexiones activas
mysql -u root -p
SHOW PROCESSLIST;

# Verificar logs de MySQL
sudo tail -f /var/log/mysql/error.log
```

#### **Alto uso de memoria/CPU**
```bash
# Monitorear con PM2
pm2 monit

# Verificar consultas lentas en MySQL
mysql -u root -p
SHOW FULL PROCESSLIST;

# Optimizar base de datos
OPTIMIZE TABLE reservations, users, products;
```

### Problemas específicos de producción encontrados y solucionados

#### **Error: "Incorrect datetime value" en reservas**

**Síntoma:**
```
sqlMessage: "Incorrect datetime value: '2025-07-14T08:00:00.000Z' for column `db_megaverse`.`reservations`.`start_time` at row 1"
```

**Causa:** MySQL/MariaDB en producción es estricto con el formato de fecha y no acepta el formato ISO 8601 con 'Z' y milisegundos.

**Solución aplicada en `server/controllers/reservations.js`:**
```javascript
// En lugar de usar directamente el formato ISO
const startTimeIso = startDate.toISOString();

// Convertir a formato MySQL YYYY-MM-DD HH:MM:SS
const startTimeSql = startDate.toISOString().slice(0, 19).replace('T', ' ');
const endTimeSql = endDate.toISOString().slice(0, 19).replace('T', ' ');

// Usar en la consulta SQL
const [result] = await connection.query(
  `INSERT INTO reservations 
   (user_id, table_id, start_time, end_time, ...) 
   VALUES (?, ?, ?, ?, ...)`,
  [userId, tableId, startTimeSql, endTimeSql, ...]
);
```

#### **Error: "ReferenceError: safeParseDate is not defined"**

**Síntoma:**
```
ReferenceError: safeParseDate is not defined
ReferenceError: approved is not defined
```

**Causa:** Problemas con la importación de módulos ES en Node.js en producción o ámbito de variables incorrecto.

**Solución aplicada:**
1. **Integrar `safeParseDate` directamente en `reservations.js`:**
```javascript
// Eliminar de importaciones y definir localmente
const safeParseDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date;
};
```

2. **Declarar variable `approved` al inicio de la función:**
```javascript
export const createReservation = async (req, res) => {
  try {
    let approved = true; // Declarada al inicio de la función
    
    // ... resto de la lógica ...
    
    // Solo se reasigna el valor, no se redeclara
    if (normalizedValues.allDay && config.requires_approval_for_all_day && req.user.role !== 'admin') {
      approved = false;
    }
  } catch (error) { /* ... */ }
};
```

#### **Error: "ERR_TOO_MANY_REDIRECTS" con Cloudflare**

**Síntoma:** Bucle infinito de redirecciones al acceder al sitio web.

**Causa:** Configuración incorrecta entre Cloudflare, el túnel y Nginx.

**Solución aplicada:**
1. **Configurar SSL Mode en Cloudflare:** Cambiar a "Flexible" temporalmente o "Full (strict)" con certificados válidos.
2. **Asegurar configuración correcta en config.yml del túnel:**
```yaml
ingress:
  # Orden específico: phpMyAdmin primero (más específico)
  - hostname: phpmyadmin.clubmegaverse.com
    service: http://localhost:80
  # Luego aplicación principal
  - hostname: clubmegaverse.com
    service: http://localhost:443
  - hostname: www.clubmegaverse.com
    service: http://localhost:443
  - service: http_status:404
```

#### **Error: Headers "x-powered-by: Express" en la raíz**

**Síntoma:** El backend de Express se muestra en lugar del frontend en la página principal.

**Causa:** Nginx no configurado correctamente como `default_server` o conflicto en las rutas.

**Solución aplicada:**
1. **Asegurar `default_server` en Nginx:**
```nginx
server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name clubmegaverse.com www.clubmegaverse.com;
    # ...
}
```

2. **Verificar que no hay otros archivos en sites-enabled:**
```bash
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### **Problema de zona horaria en validaciones**

**Síntoma:** Reservas válidas rechazadas como "fecha pasada" debido a diferencias de zona horaria.

**Solución aplicada:**
1. **Configurar servidor en UTC:**
```bash
sudo timedatectl set-timezone UTC
sudo reboot
```

2. **Configurar MySQL en UTC:**
```bash
# Editar /etc/mysql/mysql.conf.d/mysqld.cnf
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Añadir en la sección [mysqld]:
[mysqld]
default_time_zone = '+00:00'

# Reiniciar MySQL
sudo systemctl restart mysql

# Verificar configuración
mysql -u root -p
SELECT @@global.time_zone, @@session.time_zone;
```

3. **Verificar compatibilidad de fechas:**
```sql
-- En MySQL, verificar que las fechas se almacenan correctamente
USE db_megaverse;
SELECT 
    id, 
    start_time, 
    end_time,
    CONVERT_TZ(start_time, '+00:00', 'SYSTEM') as start_time_local,
    created_at
FROM reservations 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📋 Apéndices

### Apéndice A: Configuración detallada de Cloudflare

#### **Configuración de DNS en Cloudflare Dashboard**

En `dash.cloudflare.com` > Tu dominio > DNS > Records:

| Tipo | Nombre | Contenido | Proxy | TTL |
|------|--------|-----------|--------|-----|
| CNAME | @ (clubmegaverse.com) | [tunnel-id].cfargotunnel.com | 🟠 Proxied | Auto |
| CNAME | www | clubmegaverse.com | 🟠 Proxied | Auto |
| CNAME | phpmyadmin | clubmegaverse.com | 🟠 Proxied | Auto |

#### **Configuración de SSL/TLS en Cloudflare**

1. **SSL/TLS encryption mode**: Full (strict)
2. **Always Use HTTPS**: ON
3. **HTTP Strict Transport Security (HSTS)**: Habilitado
4. **Minimum TLS Version**: 1.2
5. **Opportunistic Encryption**: ON
6. **TLS 1.3**: ON

#### **Configuración de Security en Cloudflare**

1. **Security Level**: Medium
2. **Bot Fight Mode**: ON
3. **Challenge Passage**: 30 minutos
4. **Browser Integrity Check**: ON

#### **Page Rules recomendadas**

| URL | Configuración |
|-----|--------------|
| `https://clubmegaverse.com/api/*` | Cache Level: Bypass, Security Level: High |
| `https://clubmegaverse.com/uploads/*` | Cache Level: Standard, Edge Cache TTL: 1 month |
| `https://phpmyadmin.clubmegaverse.com/*` | Security Level: High, Always Use HTTPS: ON |

### Apéndice B: Comandos de administración frecuentes

#### **Gestión de PM2**
```bash
# Estado de aplicaciones
pm2 list
pm2 info megaverse-api
pm2 monit

# Logs
pm2 logs megaverse-api
pm2 logs megaverse-api --lines 100
pm2 logs megaverse-api --err

# Reinicio
pm2 restart megaverse-api
pm2 reload megaverse-api  # Zero-downtime reload
pm2 stop megaverse-api
pm2 start megaverse-api

# Configuración
pm2 startup
pm2 save
pm2 dump
pm2 kill  # Mata todos los procesos PM2
```

#### **Gestión de Nginx**
```bash
# Estado y control
sudo systemctl status nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx

# Configuración
sudo nginx -t  # Verificar sintaxis
sudo nginx -T  # Mostrar configuración completa

# Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log | grep "POST\|PUT\|DELETE"
```

#### **Gestión de MySQL**
```bash
# Estado y control
sudo systemctl status mysql
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl restart mysql

# Conexión
mysql -u root -p
mysql -u megaverse_user -pM3g4V3rs3 db_megaverse

# Logs y monitoreo
sudo tail -f /var/log/mysql/error.log
sudo tail -f /var/log/mysql/slow.log

# Comandos útiles en MySQL
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS;
SELECT * FROM information_schema.innodb_trx;
```

#### **Gestión de Cloudflare Tunnel**
```bash
# Estado y control
sudo systemctl status cloudflared
sudo systemctl start cloudflared
sudo systemctl stop cloudflared
sudo systemctl restart cloudflared

# Logs
sudo journalctl -u cloudflared -f
sudo journalctl -u cloudflared --since "1 hour ago"

# Configuración
cloudflared tunnel list
cloudflared tunnel info megaverse-tunnel
sudo cloudflared tunnel validate /etc/cloudflared/config.yml
```

### Apéndice C: Checklist de mantenimiento

#### **Mantenimiento diario**
- [ ] Verificar estado de servicios: `systemctl status nginx mysql cloudflared && pm2 list`
- [ ] Revisar logs de errores: `pm2 logs megaverse-api --err --lines 50`
- [ ] Comprobar espacio en disco: `df -h`
- [ ] Verificar memoria: `free -h`
- [ ] Comprobar accesibilidad web: `curl -I https://clubmegaverse.com`

#### **Mantenimiento semanal**
- [ ] Actualizar sistema: `sudo apt update && sudo apt upgrade`
- [ ] Verificar certificados SSL: `sudo certbot certificates`
- [ ] Limpiar logs antiguos: `sudo journalctl --vacuum-time=7d`
- [ ] Verificar backup automático
- [ ] Revisar logs de Nginx: `sudo logrotate -f /etc/logrotate.d/nginx`
- [ ] Optimizar base de datos: `OPTIMIZE TABLE reservations, users, products;`

#### **Mantenimiento mensual**
- [ ] Renovar certificados SSL: `sudo certbot renew --dry-run`
- [ ] Actualizar dependencias de Node.js: `npm audit && npm audit fix`
- [ ] Verificar configuración de seguridad de Cloudflare
- [ ] Revisar y rotar logs de aplicación
- [ ] Crear backup completo del sistema
- [ ] Revisar métricas de rendimiento

### Apéndice D: Estructura de la base de datos

#### **Tablas principales**

```sql
-- Usuarios
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Mesas
CREATE TABLE tables (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INT DEFAULT 4,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservas
CREATE TABLE reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    table_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration_hours DECIMAL(4,2),
    num_members INT DEFAULT 1,
    num_guests INT DEFAULT 0,
    all_day BOOLEAN DEFAULT FALSE,
    reason TEXT,
    approved BOOLEAN DEFAULT TRUE,
    status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (table_id) REFERENCES tables(id),
    INDEX idx_reservations_date_table (start_time, table_id),
    INDEX idx_reservations_user (user_id),
    INDEX idx_reservations_status (status)
);

-- Productos
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_active (active),
    INDEX idx_products_category (category)
);

-- Consumos
CREATE TABLE consumptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_consumations_user_date (user_id, consumed_at),
    INDEX idx_consumptions_product (product_id)
);

-- Blog
CREATE TABLE blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    excerpt TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    featured_image VARCHAR(255),
    status ENUM('draft', 'published') DEFAULT 'draft',
    author_id INT NOT NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_blog_status_published (status, published_at),
    INDEX idx_blog_slug (slug)
);

-- Configuración de reservas
CREATE TABLE reservation_config (
    id INT PRIMARY KEY DEFAULT 1,
    max_hours_per_reservation INT DEFAULT 4,
    max_reservations_per_user_per_day INT DEFAULT 1,
    min_hours_in_advance INT DEFAULT 0,
    allowed_start_time TIME DEFAULT '08:00:00',
    allowed_end_time TIME DEFAULT '22:00:00',
    requires_approval_for_all_day BOOLEAN DEFAULT TRUE,
    allow_consecutive_reservations BOOLEAN DEFAULT TRUE,
    min_time_between_reservations INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Apéndice E: Endpoints de API

#### **Autenticación (`/api/auth`)**
- `POST /register` - Registro de usuarios
- `POST /login` - Inicio de sesión
- `POST /logout` - Cerrar sesión
- `GET /me` - Obtener usuario actual
- `PUT /profile` - Actualizar perfil

#### **Usuarios (`/api/users`)**
- `GET /` - Listar usuarios (admin)
- `GET /:id` - Obtener usuario específico
- `PUT /:id` - Actualizar usuario
- `DELETE /:id` - Eliminar usuario (admin)

#### **Reservas (`/api/reservations`)**
- `GET /` - Listar todas las reservas
- `GET /:id` - Obtener reserva específica
- `POST /` - Crear nueva reserva
- `PUT /:id` - Actualizar reserva
- `DELETE /:id` - Eliminar reserva
- `PATCH /:id/status` - Cambiar estado de reserva
- `POST /:id/approve` - Aprobar reserva (admin)
- `POST /:id/reject` - Rechazar reserva (admin)

#### **Productos