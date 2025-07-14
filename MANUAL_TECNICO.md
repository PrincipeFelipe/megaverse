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
- Servidor: VPS/Cloud (Debian/Ubuntu recomendado)
- Proxy reverso: Nginx
- Gestor de procesos: PM2
- Base de datos: MySQL 8.0+

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

1. **Preparar el servidor:**
```bash
# Instalar dependencias del sistema
sudo apt update
sudo apt install nodejs npm mysql-server nginx

# Instalar PM2 globalmente
sudo npm install -g pm2
```

2. **Configurar base de datos:**
```bash
sudo mysql_secure_installation
mysql -u root -p

CREATE DATABASE db_megaverse;
CREATE USER 'megaverse_user'@'localhost' IDENTIFIED BY 'password_seguro';
GRANT ALL PRIVILEGES ON db_megaverse.* TO 'megaverse_user'@'localhost';
FLUSH PRIVILEGES;
```

3. **Clonar y configurar aplicación:**
```bash
cd /var/www
sudo git clone https://github.com/tu-usuario/megaverse.git
sudo chown -R www-data:www-data megaverse
cd megaverse

# Backend
cd server
npm ci --production
cp .env.production .env
# Editar .env con configuraciones de producción
npm run init-db

# Frontend
cd ..
npm ci
npm run build
```

4. **Configurar PM2:**
```bash
# Crear ecosystem.config.js si no existe
pm2 start server/ecosystem.config.js
pm2 save
pm2 startup
```

5. **Configurar Nginx:**
```nginx
# /etc/nginx/sites-available/megaverse
server {
    listen 80;
    server_name tu-dominio.com;
    
    # Frontend (archivos estáticos)
    location / {
        root /var/www/megaverse/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Uploads
    location /uploads {
        alias /var/www/megaverse/server/uploads;
    }
}
```

6. **SSL con Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### Variables de entorno de producción

**Backend (.env.production):**
```env
NODE_ENV=production
DB_HOST=localhost
DB_USER=megaverse_user
DB_PASSWORD=password_muy_seguro
DB_DATABASE=db_megaverse
JWT_SECRET=clave_super_secreta_diferente_a_desarrollo
PORT=8090
SITE_URL=https://tu-dominio.com
```

**Frontend (.env.production):**
```env
VITE_API_URL=https://tu-dominio.com/api
```

### Monitoreo y logs

```bash
# Ver logs de PM2
pm2 logs

# Monitoreo en tiempo real
pm2 monit

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs de MySQL
sudo tail -f /var/log/mysql/error.log
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
OPTIMIZE TABLE reservations, products, users;
```

### Scripts de diagnóstico útiles

#### **Verificar salud del sistema**
```bash
# Crear script check-health.sh
#!/bin/bash
echo "=== Verificación de salud del sistema ==="
echo "Frontend (puerto 5173): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)"
echo "Backend (puerto 8090): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8090/api)"
echo "MySQL: $(systemctl is-active mysql)"
echo "Espacio en disco: $(df -h / | tail -1 | awk '{print $5}')"
echo "Memoria RAM: $(free -h | grep Mem | awk '{print $3"/"$2}')"
```

#### **Backup automatizado**
```bash
# Script backup-db.sh
#!/bin/bash
BACKUP_DIR="/backups/megaverse"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u root -p db_megaverse > "$BACKUP_DIR/backup_$DATE.sql"
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" server/uploads/

# Mantener solo últimos 7 días
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete
```

---

## 📞 Contacto y soporte

### Equipo de desarrollo

- **Desarrollador Principal**: [Tu nombre]
  - Email: desarrollo@megaverse.com
  - GitHub: [@tu-usuario](https://github.com/tu-usuario)

### Canales de soporte

#### **Para desarrolladores**
- **GitHub Issues**: [Repositorio principal](https://github.com/tu-usuario/megaverse/issues)
- **Pull Requests**: Para contribuciones de código
- **Discussions**: Para preguntas generales y propuestas

#### **Para usuarios finales**
- **Email de soporte**: soporte@megaverse.com
- **Manual de usuario**: Disponible en `/docs/manual-usuario.pdf`
- **FAQ**: [Wiki del proyecto](https://github.com/tu-usuario/megaverse/wiki)

### Documentación adicional

- **API Documentation**: `/docs/api.md`
- **Database Schema**: `/docs/database-schema.md`
- **Deployment Guide**: `/docs/despliegue-plesk-produccion.md`
- **Troubleshooting**: `/docs/solucion-problemas-cors.md`

### Contribuir al proyecto

1. **Fork del repositorio**
2. **Crear rama feature** según convenciones
3. **Implementar cambios** con tests
4. **Documentar cambios** si afectan APIs
5. **Crear Pull Request** con descripción detallada

### Reportar bugs

Incluir en el reporte:
- **Versión** de la aplicación
- **Entorno** (desarrollo/producción)
- **Pasos para reproducir** el error
- **Logs relevantes** (frontend y backend)
- **Comportamiento esperado** vs actual

### Roadmap y mejoras futuras

- **Sistema de notificaciones push**
- **App móvil nativa** (React Native)
- **Integración con sistemas de pago** (Stripe/PayPal)
- **Reportes avanzados** con gráficos
- **API pública** para integraciones externas
- **Sistema de plugins** para extensibilidad

---

**Versión del manual**: 1.0  
**Última actualización**: Julio 2025  
**Compatibilidad**: MegaVerse v1.0.0+

---

*Este manual técnico es un documento vivo que se actualiza con cada versión significativa de la aplicación. Para sugerencias de mejora de la documentación, por favor abre un issue en el repositorio.*
