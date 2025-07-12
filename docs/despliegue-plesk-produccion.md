# 🚀 Guía de Despliegue a Producción con Plesk

Este documento proporciona instrucciones detalladas para desplegar el proyecto MEGAVERSE en un servidor con panel Plesk.

El código fuente del proyecto está disponible en: https://github.com/PrincipeFelipe/megaverse

## 📋 Prerrequisitos

### En tu servidor Plesk necesitas:
- **Node.js** (versión 18 o superior)
- **MySQL** (base de datos)
- **PM2** (para gestión de procesos Node.js)
- **Dominio configurado** en Plesk

### En tu proyecto local:
- Código listo y probado
- Variables de entorno configuradas
- Base de datos preparada

## 🗂️ Estructura del Proyecto

Tu proyecto tiene dos partes principales:
```
├── /                    # Frontend (React + Vite)
├── server/              # Backend (Node.js + Express)
├── docs/               # Documentación
└── uploads/            # Archivos subidos
```

## 🔧 Paso 1: Preparar el Frontend para Producción

### 1.1 Configurar variables de entorno para producción

Crea un archivo `.env.production` en la raíz del proyecto:

```env
VITE_API_URL=https://tudominio.com/api
VITE_SITE_URL=https://tudominio.com
```

### 1.2 Crear script de construcción

Añade estos scripts a tu `package.json` principal:

```json
{
  "scripts": {
    "build:prod": "vite build --mode production",
    "preview:prod": "vite preview"
  }
}
```

### 1.3 Construir el frontend

```bash
npm run build:prod
```

Esto generará la carpeta `dist/` con los archivos estáticos.

## 🔧 Paso 2: Preparar el Backend para Producción

### 2.1 Configurar variables de entorno del servidor

Crea `server/.env.production`:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_NAME=db_megaverse
SITE_URL=https://tudominio.com
```

### 2.2 Optimizar package.json del servidor

Asegúrate de que `server/package.json` tenga:

```json
{
  "scripts": {
    "start": "node index.js",
    "start:prod": "NODE_ENV=production node index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 📤 Paso 3: Subir Archivos a Plesk

### 3.1 Estructura de directorios en Plesk

```
/httpdocs/               # ✅ Público - Frontend (contenido de dist/)
/api/                    # ⚠️ Semi-público - Backend (contenido de server/)
/private/                # 🔒 Privado - Archivos sensibles
├── .env.production      # Variables de entorno del backend
├── backups/             # Backups de base de datos
├── logs/                # Logs privados de la aplicación
└── keys/                # Certificados SSL y claves privadas
```

**¿Qué va en cada directorio?**

- **`/httpdocs/`**: Archivos estáticos del frontend (HTML, CSS, JS compilado)
- **`/api/`**: Código del backend Node.js y archivos subidos por usuarios
- **`/private/`**: Todo lo que debe estar fuera del acceso web público

**⚠️ Importante**: La carpeta `/private/` está **fuera del directorio web**, por lo que es inaccesible desde internet.

### 3.2 Subir frontend

1. **Construye el frontend** localmente:
   ```bash
   npm run build:prod
   ```

2. **Sube el contenido de `dist/`** a `/httpdocs/` en Plesk
   - Puedes usar el File Manager de Plesk
   - O FTP/SFTP
   - O Git si tienes configurado

### 3.3 Subir backend

1. **Sube toda la carpeta `server/`** a `/api/` en Plesk
2. **No subas** `node_modules/` (se instalará en el servidor)

## 🔧 Paso 4: Configurar Node.js en Plesk

### 4.1 Verificar/Instalar Node.js

**⚠️ Importante**: Primero verifica si Node.js está instalado:

```bash
node --version
npm --version
```

**Si obtienes "command not found", instala Node.js:**

**Opción A: Desde Panel de Plesk (Recomendado)**
1. Ve a **"Extensiones"** → **"Catálogo de extensiones"**
2. Busca e instala **"Node.js"**
3. Ve a **"Node.js"** en tu dominio y habilítalo

**Opción B: Via SSH (CentOS/RHEL/AlmaLinux)**

**Para CentOS 8+ / RHEL 8+ / AlmaLinux:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

**Para CentOS 7 (glibc < 2.28):**
```bash
# Opción 1: Node.js 16 (compatible con CentOS 7)
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# Opción 2: Usar NVM (recomendado para CentOS 7)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 16
nvm use 16
nvm alias default 16

# Opción 3: Desde EPEL (versión más antigua)
sudo yum install -y epel-release
sudo yum install -y nodejs npm
```

**Opción C: Via SSH (Ubuntu/Debian)**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 4.2 Crear aplicación Node.js en Plesk

1. Ve a **"Node.js"** en el panel de Plesk
2. Haz clic en **"Habilitar Node.js"**
3. Configura:
   - **Directorio de la aplicación**: `/api`
   - **Archivo de inicio**: `index.js`
   - **Versión de Node.js**: 18.x o superior

### 4.3 Instalar dependencias

En el terminal de Plesk o via SSH:

```bash
cd /var/www/vhosts/tudominio.com/api
npm install --production
```

**Si obtienes error "npm: command not found":**
- Cierra y vuelve a abrir el terminal/SSH
- O ejecuta: `source ~/.bashrc`
- Verifica: `which npm` y `npm --version`

### 4.4 Configurar variables de entorno

**Opción A: Variables de entorno de Plesk (Recomendado)**

En Plesk, ve a Node.js → Variables de entorno y añade:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=tu_jwt_secret_super_seguro
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_NAME=db_megaverse
SITE_URL=https://tudominio.com
```

**Opción B: Archivo .env en /private/ (Alternativa)**

1. Sube `server/.env.production` a `/private/.env.production`
2. En tu `server/index.js`, carga las variables así:

```javascript
// Al inicio del archivo
require('dotenv').config({ 
  path: '../private/.env.production' 
});
```

**Opción C: Enlace simbólico**

```bash
cd /var/www/vhosts/tudominio.com/api
ln -s ../private/.env.production .env
```

## 🗄️ Paso 5: Configurar Base de Datos

### 5.1 Crear base de datos en Plesk

1. Ve a **"Bases de datos"** en Plesk
2. Crea una nueva base de datos MySQL
3. Anota las credenciales

### 5.2 Importar esquema de base de datos

**Opción A: Via línea de comandos (Recomendado)**

```bash
# Subir el archivo db_megaverse.sql al servidor
# Luego conectar por SSH y ejecutar:

mysql -u tu_usuario -p
CREATE DATABASE db_megaverse CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
exit

mysql -u tu_usuario -p db_megaverse < /ruta/al/archivo/db_megaverse.sql
```

**Opción B: Via phpMyAdmin desde Plesk**

1. Ve a **"Bases de datos"** en Plesk → **"phpMyAdmin"**
2. Selecciona la base de datos `db_megaverse`
3. Ve a la pestaña **"Importar"**
4. **⚠️ Importante**: Si obtienes errores de formato:
   - Asegúrate de que cada sentencia SQL termine con `;`
   - Los comentarios deben usar `--` (no `----`)
   - Si el archivo es muy grande, divídelo en archivos más pequeños

**Opción C: Crear las tablas manualmente**

Si persisten los errores, puedes crear las tablas principales manualmente:

```sql
-- Ejecutar una por una en phpMyAdmin

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `avatar_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Continuar con las demás tablas según sea necesario
```

### 5.3 Actualizar permisos de directorios

```bash
cd /var/www/vhosts/tudominio.com/api
mkdir -p uploads/avatars uploads/blog uploads/documents
chmod 755 uploads/
chmod 755 uploads/avatars uploads/blog uploads/documents
```

## 🔧 Paso 6: Configurar Proxy Reverso

### 6.1 Configurar Apache/Nginx para API

En Plesk, ve a **"Configuración de Apache & Nginx"** y añade:

**Para Apache (.htaccess en httpdocs/):**

```apache
RewriteEngine On

# Redirigir /api/ al backend Node.js
RewriteRule ^api/(.*)$ http://localhost:3000/$1 [P,L]

# Todas las demás rutas van al frontend (SPA)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]
```

**Para Nginx:**

```nginx
location /api/ {
    proxy_pass http://localhost:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

## 🔧 Paso 7: Configurar PM2 (Recomendado)

### 7.1 Instalar PM2

```bash
npm install -g pm2
```

### 7.2 Crear archivo de configuración PM2

Crea `api/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'megaverse-api',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 7.3 Iniciar con PM2

```bash
cd /var/www/vhosts/tudominio.com/api
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔧 Paso 8: Configurar HTTPS

### 8.1 SSL en Plesk

1. Ve a **"SSL/TLS Certificates"** en Plesk
2. Activa **"Let's Encrypt"** o sube tu certificado
3. Marca **"Redirect from HTTP to HTTPS"**

### 8.2 Actualizar variables de entorno

Asegúrate de que `SITE_URL` use `https://`

## 🔧 Paso 9: Scripts de Automatización

### 9.1 Script de despliegue (desde Local)

Crea `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Desplegando MEGAVERSE..."

# Construir frontend
echo "📦 Construyendo frontend..."
npm run build:prod

# Subir archivos (ajusta las rutas)
echo "📤 Subiendo archivos..."
rsync -avz --delete dist/ usuario@servidor:/var/www/vhosts/tudominio.com/httpdocs/
rsync -avz --delete server/ usuario@servidor:/var/www/vhosts/tudominio.com/api/

# Instalar dependencias en servidor
echo "📦 Instalando dependencias..."
ssh usuario@servidor "cd /var/www/vhosts/tudominio.com/api && npm install --production"

# Reiniciar aplicación
echo "🔄 Reiniciando aplicación..."
ssh usuario@servidor "pm2 restart megaverse-api"

echo "✅ Despliegue completado!"
```

### 9.2 Script de despliegue desde GitHub

Para desplegar directamente desde el repositorio GitHub, crea `deploy-git.sh`:

```bash
#!/bin/bash

echo "🚀 Desplegando MEGAVERSE desde GitHub..."

# Directorio base en Plesk
BASE_DIR="/var/www/vhosts/tudominio.com"
REPO_URL="https://github.com/PrincipeFelipe/megaverse.git"
BRANCH="main" # o master, según corresponda

# Clonar/actualizar desde GitHub
echo "📂 Obteniendo código desde GitHub..."
if [ ! -d "$BASE_DIR/repo" ]; then
  # Primer despliegue
  git clone --branch $BRANCH $REPO_URL $BASE_DIR/repo
else
  # Actualizar repo existente
  cd $BASE_DIR/repo
  git fetch origin
  git reset --hard origin/$BRANCH
fi

# Construir frontend
echo "🏗️ Construyendo frontend..."
cd $BASE_DIR/repo
npm ci
npm run build:prod

# Copiar archivos
echo "📋 Desplegando archivos..."
rm -rf $BASE_DIR/httpdocs/*
cp -r dist/* $BASE_DIR/httpdocs/
cp -r server/* $BASE_DIR/api/

# Instalar dependencias backend
cd $BASE_DIR/api
npm install --production

# Reiniciar la aplicación
echo "🔄 Reiniciando aplicación..."
pm2 restart megaverse-api

echo "✅ Despliegue desde GitHub completado!"
```

### 9.2 Script de backup

Crea `backup.sh`:

```bash
#!/bin/bash

echo "💾 Creando backup..."

# Backup de base de datos
mysqldump -u usuario -p db_megaverse > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup de uploads
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/vhosts/tudominio.com/api/uploads/

echo "✅ Backup completado!"
```

## 🔍 Paso 10: Verificación y Monitoreo

### 10.1 Verificar el despliegue

1. **Frontend**: `https://tudominio.com`
2. **API Health**: `https://tudominio.com/api/health`
3. **RSS Feed**: `https://tudominio.com/api/rss/blog`

### 10.2 Logs y monitoreo

```bash
# Ver logs de PM2
pm2 logs megaverse-api

# Ver status
pm2 status

# Monitoreo en tiempo real
pm2 monit
```

### 10.3 Comandos útiles

```bash
# Reiniciar aplicación
pm2 restart megaverse-api

# Ver logs en tiempo real
pm2 logs megaverse-api --lines 100

# Reload sin downtime
pm2 reload megaverse-api
```

## 🚨 Troubleshooting

### Problemas comunes:

1. **Error 500**: Revisa logs de PM2 y variables de entorno
2. **CORS Issues**: Verifica SITE_URL en variables de entorno
3. **Base de datos**: Confirma credenciales y conexión
4. **Archivos estáticos**: Verifica permisos de uploads/
5. **SSL**: Asegúrate de que todas las URLs usen HTTPS

### Comandos de diagnóstico:

```bash
# Verificar status de Node.js
pm2 status

# Verificar conexión a BD
mysql -u usuario -p -e "SHOW DATABASES;"

# Verificar logs del servidor web
tail -f /var/log/nginx/error.log  # o Apache
```

## 📋 Checklist Final

- [ ] Frontend construido y subido a /httpdocs/
- [ ] Backend subido a /api/ con dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Base de datos creada e importada
- [ ] Permisos de uploads/ configurados
- [ ] Proxy reverso configurado (/api → Node.js)
- [ ] PM2 configurado y funcionando
- [ ] HTTPS activado
- [ ] DNS apuntando al servidor
- [ ] Verificación de todas las URLs

¡Tu aplicación MEGAVERSE debería estar ahora en producción! 🎉
