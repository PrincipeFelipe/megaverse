# 🚀 Manual de Despliegue en Servidor Debian 12

Este documento proporciona instrucciones paso a paso para desplegar el proyecto MEGAVERSE en un servidor Debian 12.

El código fuente del proyecto está disponible en: https://github.com/PrincipeFelipe/megaverse

## 📋 Requisitos previos

- Servidor Debian 12 con acceso root o sudo
- Dominio configurado para apuntar al servidor
- Cliente SSH para conectarse al servidor
- Archivos del proyecto listos para producción

## 🗂️ Estructura del proyecto en producción

```
/var/www/megaverse/
├── frontend/             # Archivos compilados del frontend
├── backend/              # Código del backend y API
│   ├── uploads/          # Archivos subidos por usuarios
│   │   ├── avatars/      # Imágenes de perfil
│   │   ├── blog/         # Imágenes del blog
│   │   └── documents/    # Documentos adjuntos
│   └── ecosystem.config.js  # Configuración de PM2
└── private/              # Archivos privados fuera de acceso web
    ├── .env.production   # Variables de entorno
    ├── backups/          # Copias de seguridad
    └── logs/             # Registros de la aplicación
```

## 🔧 Paso 1: Preparar el servidor

### 1.1 Actualizar el sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Instalar dependencias básicas

```bash
sudo apt install -y curl wget git unzip build-essential nginx
```

## 🔧 Paso 2: Instalar Node.js

### 2.1 Instalar Node.js desde repositorios oficiales

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2.2 Verificar la instalación

```bash
node --version  # Debería mostrar v18.x.x
npm --version   # Debería mostrar 9.x.x o superior
```

### 2.3 Instalar PM2 globalmente

```bash
sudo npm install -g pm2
```

## 🔧 Paso 3: Instalar MariaDB (Reemplazo de MySQL en Debian)

### 3.1 Instalar MariaDB Server

```bash
sudo apt install -y mariadb-server
```

### 3.2 Configurar seguridad de MariaDB

```bash
sudo mysql_secure_installation
```

> ℹ️ **Nota**: MariaDB es un fork de MySQL que es totalmente compatible y es el servidor de base de datos predeterminado en Debian 12.

Responde a las preguntas:
- Configurar validación de contraseñas: N (opcional)
- Establecer contraseña de root: Y
- Eliminar usuarios anónimos: Y
- Desactivar login remoto de root: Y
- Eliminar base de datos test: Y
- Recargar privilegios: Y

### 3.3 Crear base de datos y usuario

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE db_megaverse CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER 'megaverse_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON db_megaverse.* TO 'megaverse_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 🔧 Paso 4: Preparar estructura de directorios

### 4.1 Crear directorios principales

```bash
sudo mkdir -p /var/www/megaverse
sudo mkdir -p /var/www/megaverse/frontend
sudo mkdir -p /var/www/megaverse/backend
sudo mkdir -p /var/www/megaverse/private
sudo mkdir -p /var/www/megaverse/private/backups
sudo mkdir -p /var/www/megaverse/private/logs
sudo mkdir -p /var/www/megaverse/backend/uploads/avatars
sudo mkdir -p /var/www/megaverse/backend/uploads/blog
sudo mkdir -p /var/www/megaverse/backend/uploads/documents
```

### 4.2 Establecer permisos adecuados

```bash
sudo chown -R $USER:www-data /var/www/megaverse
sudo chmod -R 755 /var/www/megaverse
sudo chmod -R 775 /var/www/megaverse/backend/uploads
```

## 🔧 Paso 5: Desplegar el frontend

### 5.1 Preparar el frontend en tu máquina local

Asegúrate de que tu archivo `.env.production` tenga la configuración correcta:

```env
VITE_API_URL=https://tudominio.com/api
VITE_SITE_URL=https://tudominio.com
```

Construye la aplicación:

```bash
npm run build:prod
```

### 5.2 Subir archivos compilados al servidor

#### Opción A: Transferencia directa

Usa SCP, SFTP o rsync para subir los archivos:

```bash
# Usando SCP:
scp -r dist/* usuario@tuservidor:/var/www/megaverse/frontend/

# Usando rsync (alternativa recomendada):
rsync -avz --delete dist/ usuario@tuservidor:/var/www/megaverse/frontend/
```

#### Opción B: Desde GitHub con CI/CD

Si usas GitHub Actions u otro sistema CI/CD:

1. Configura GitHub Actions para construir tu frontend en cada push a la rama principal.
2. Crea un archivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [ main ]  # O la rama que uses

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build frontend
        run: npm run build:prod
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          source: "dist/"
          target: "/var/www/megaverse/frontend"
          strip_components: 1
```

3. Configura los secretos en tu repositorio GitHub:
   - `HOST`: La dirección IP o dominio de tu servidor
   - `USERNAME`: Usuario SSH
   - `SSH_KEY`: Clave SSH privada

## 🔧 Paso 6: Desplegar el backend

### 6.1 Subir el código del backend

#### Opción A: Usando SCP/RSYNC (desde local)

```bash
# Usando SCP:
scp -r server/* usuario@tuservidor:/var/www/megaverse/backend/

# Usando rsync:
rsync -avz --delete --exclude='node_modules' server/ usuario@tuservidor:/var/www/megaverse/backend/
```

#### Opción B: Desde GitHub (recomendado para control de versiones)

Si tienes tu proyecto en GitHub, puedes clonarlo directamente en el servidor:

```bash
# En el servidor
cd /var/www/megaverse
git clone https://github.com/PrincipeFelipe/megaverse.git temp
cd temp

# Si tu frontend y backend están en el mismo repositorio
cp -r server/* ../backend/
cp -r dist/* ../frontend/   # Si ya tienes el frontend compilado en el repo

# O si solo quieres el backend
cp -r server/* ../backend/

# Limpiar
cd ..
rm -rf temp
```

Para actualizaciones futuras:

```bash
# En el servidor
cd /var/www/megaverse/backend
git pull origin main  # o master, o la rama que uses
npm install --production
pm2 reload megaverse-api
```

### 6.2 Instalar dependencias del backend

```bash
cd /var/www/megaverse/backend
npm install --production
```

### 6.3 Crear archivo de variables de entorno

```bash
nano /var/www/megaverse/private/.env.production
```

Añade el siguiente contenido:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=tu_clave_jwt_super_segura
DB_HOST=localhost
DB_USER=megaverse_user
DB_PASSWORD=tu_contraseña_segura
DB_NAME=db_megaverse
SITE_URL=https://tudominio.com
```

> ⚠️ **Importante**: Genera una clave JWT segura con:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 6.4 Crear enlace simbólico al archivo .env

```bash
cd /var/www/megaverse/backend
ln -s ../private/.env.production .env
```

### 6.5 Configurar PM2

Crea el archivo `ecosystem.config.js` en el directorio del backend:

```bash
nano /var/www/megaverse/backend/ecosystem.config.js
```

Con este contenido:

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
    },
    error_file: '../private/logs/app-err.log',
    out_file: '../private/logs/app-out.log'
  }]
};
```

### 6.6 Iniciar la aplicación con PM2

```bash
cd /var/www/megaverse/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Sigue las instrucciones que muestra el comando `pm2 startup` para configurar el inicio automático.

## 🔧 Paso 7: Importar la base de datos

### 7.1 Corregir problemas de timestamp en el SQL

Las versiones antiguas de MySQL/MariaDB solo permiten una columna TIMESTAMP con valor DEFAULT CURRENT_TIMESTAMP. Aunque MariaDB reciente ya no tiene esta limitación, es buena práctica hacer este ajuste para mayor compatibilidad:

```bash
# Solución rápida - cambia una columna a DATETIME
sed -i 's/`created_at` timestamp NULL DEFAULT current_timestamp()/`created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP/g' db_megaverse.sql
```

### 7.2 Subir el archivo SQL al servidor

```bash
scp db_megaverse.sql usuario@tuservidor:/tmp/
```

### 7.3 Importar la base de datos

```bash
mysql -u megaverse_user -p db_megaverse < /tmp/db_megaverse.sql
```

## 🔧 Paso 8: Configurar Nginx como proxy reverso

### 8.1 Crear configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/megaverse
```

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    
    # Redirección a HTTPS (Añadir después de configurar SSL)
    # return 301 https://$host$request_uri;

    # Configuración para HTTP (Comentar después de configurar SSL)
    location / {
        root /var/www/megaverse/frontend;
        try_files $uri $uri/ /index.html;
    }

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

    # Servir archivos subidos directamente
    location /uploads/ {
        alias /var/www/megaverse/backend/uploads/;
    }
    
    # Configuración adicional para cachear archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/megaverse/frontend;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 8.2 Activar el sitio en Nginx

```bash
sudo ln -s /etc/nginx/sites-available/megaverse /etc/nginx/sites-enabled/
sudo nginx -t  # Verificar sintaxis
sudo systemctl restart nginx
```

## 🔧 Paso 9: Configurar SSL con Certbot

### 9.1 Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Obtener certificado SSL

```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Sigue las instrucciones y selecciona la opción para redireccionar automáticamente HTTP a HTTPS.

## 🔧 Paso 10: Scripts de mantenimiento

### 10.1 Script de backup

Crea `/var/www/megaverse/private/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/www/megaverse/private/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Creando backup..."

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup de base de datos
mysqldump -u megaverse_user -p'tu_contraseña_segura' db_megaverse > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /var/www/megaverse/backend/uploads/

# Limpiar backups antiguos (mantener solo los últimos 7)
ls -t $BACKUP_DIR/db_backup_*.sql | tail -n +8 | xargs rm -f 2>/dev/null
ls -t $BACKUP_DIR/uploads_backup_*.tar.gz | tail -n +8 | xargs rm -f 2>/dev/null

echo "✅ Backup completado en $BACKUP_DIR"
echo "📁 Archivos de backup:"
ls -lh $BACKUP_DIR | grep "$DATE"
```

### 10.2 Scripts de despliegue

#### 10.2.1 Script de despliegue manual

Crea `/var/www/megaverse/private/deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Desplegando actualizaciones..."

# Directorio base
BASE_DIR="/var/www/megaverse"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Crear un backup rápido antes de actualizar
echo "📦 Creando backup de seguridad..."
mysqldump -u megaverse_user -p'tu_contraseña_segura' db_megaverse > $BASE_DIR/private/backups/pre_deploy_$TIMESTAMP.sql

# Actualizar código (suponiendo que usas rsync desde una máquina de desarrollo)
# Esta parte se ejecutaría desde tu máquina local, no en este script
echo "📂 Recibiendo archivos nuevos..."

# Actualizar backend (si los archivos ya están en el servidor)
cd $BASE_DIR/backend

# Instalar dependencias
echo "📚 Instalando dependencias..."
npm install --production

# Reiniciar la aplicación
echo "🔄 Reiniciando servicios..."
pm2 reload megaverse-api

# Verificar estado
echo "🔍 Verificando estado del servicio..."
pm2 status megaverse-api

echo "✅ Despliegue completado!"
echo "📅 Fecha: $(date)"
```

#### 10.2.2 Script de despliegue desde GitHub

Si tu código está en GitHub, crea `/var/www/megaverse/private/deploy-git.sh`:

```bash
#!/bin/bash

echo "🚀 Desplegando desde GitHub..."

# Directorio base
BASE_DIR="/var/www/megaverse"
REPO_URL="https://github.com/PrincipeFelipe/megaverse.git"
BRANCH="main" # o master, según corresponda
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Crear un backup rápido antes de actualizar
echo "📦 Creando backup de seguridad..."
mysqldump -u megaverse_user -p'tu_contraseña_segura' db_megaverse > $BASE_DIR/private/backups/pre_deploy_$TIMESTAMP.sql

# Clonar/actualizar desde GitHub
echo "📂 Obteniendo código desde GitHub..."
if [ ! -d "$BASE_DIR/repo" ]; then
  # Primer despliegue, clonar el repositorio
  git clone --branch $BRANCH $REPO_URL $BASE_DIR/repo
else
  # Actualizar el repositorio existente
  cd $BASE_DIR/repo
  git fetch origin
  git reset --hard origin/$BRANCH
fi

# Construir frontend
echo "🏗️ Construyendo frontend..."
cd $BASE_DIR/repo
npm ci
npm run build:prod

# Copiar frontend compilado
echo "📋 Copiando frontend..."
rm -rf $BASE_DIR/frontend/*
cp -r dist/* $BASE_DIR/frontend/

# Actualizar backend
echo "📋 Copiando backend..."
cp -r server/* $BASE_DIR/backend/

# Instalar dependencias del backend
echo "📚 Instalando dependencias del backend..."
cd $BASE_DIR/backend
npm install --production

# Reiniciar la aplicación
echo "🔄 Reiniciando servicios..."
pm2 reload megaverse-api

# Verificar estado
echo "🔍 Verificando estado del servicio..."
pm2 status megaverse-api

# Ejecutar verificación de despliegue
$BASE_DIR/private/verify-deployment.sh

echo "✅ Despliegue desde GitHub completado!"
echo "📅 Fecha: $(date)"
```

### 10.3 Configurar permisos y automatización

```bash
sudo chmod +x /var/www/megaverse/private/backup.sh
sudo chmod +x /var/www/megaverse/private/deploy.sh
sudo chmod +x /var/www/megaverse/private/deploy-git.sh

# Programar backup diario a las 2 AM
echo "0 2 * * * /var/www/megaverse/private/backup.sh >> /var/www/megaverse/private/logs/backup.log 2>&1" | sudo crontab -
```

### 10.4 Configurar webhook para despliegue automático (opcional)

Si quieres que tu aplicación se actualice automáticamente cuando haces push a GitHub:

1. Instala dependencias:
```bash
sudo apt install -y nodejs npm
sudo npm install -g webhook
```

2. Crea un archivo de configuración en `/var/www/megaverse/private/hooks.json`:
```json
[
  {
    "id": "deploy-megaverse",
    "execute-command": "/var/www/megaverse/private/deploy-git.sh",
    "command-working-directory": "/var/www/megaverse",
    "response-message": "Desplegando aplicación...",
    "trigger-rule": {
      "match": {
        "type": "payload-hash-sha1",
        "secret": "tu_secreto_super_seguro",
        "parameter": {
          "source": "header",
          "name": "X-Hub-Signature"
        }
      }
    }
  }
]
```

3. Configura el servicio para el webhook:
```bash
nano /etc/systemd/system/webhook.service
```

Contenido:
```
[Unit]
Description=GitHub webhook
After=network.target

[Service]
ExecStart=/usr/bin/webhook -hooks /var/www/megaverse/private/hooks.json -hotreload -port 9000
Restart=always
User=www-data
Group=www-data
Environment=PATH=/usr/bin:/usr/local/bin
WorkingDirectory=/var/www/megaverse

[Install]
WantedBy=multi-user.target
```

4. Inicia y habilita el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl start webhook
sudo systemctl enable webhook
```

5. Actualiza la configuración de Nginx para permitir el webhook:
```nginx
location /hooks/ {
    proxy_pass http://localhost:9000/hooks/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

6. Configura el webhook en GitHub:
   - Ve a tu repositorio → Settings → Webhooks → Add webhook
   - Payload URL: `https://tudominio.com/hooks/deploy-megaverse`
   - Content type: `application/json`
   - Secret: el mismo secreto que usaste en `hooks.json`
   - Eventos: selecciona "Just the push event"

## 🔧 Paso 11: Script de verificación de despliegue

Crea `/var/www/megaverse/private/verify-deployment.sh`:

```bash
#!/bin/bash

echo "🔍 Verificando despliegue de MEGAVERSE..."
DOMAIN="https://tudominio.com"

# Verificar frontend
echo -n "📱 Frontend: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN)
if [ $HTTP_CODE -eq 200 ]; then
  echo "✅ OK ($HTTP_CODE)"
else
  echo "❌ ERROR ($HTTP_CODE)"
fi

# Verificar API
echo -n "🔌 API Health: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/api/health)
if [ $HTTP_CODE -eq 200 ]; then
  echo "✅ OK ($HTTP_CODE)"
else
  echo "❌ ERROR ($HTTP_CODE)"
fi

# Verificar RSS Feed
echo -n "📡 RSS Feed: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/api/rss/blog)
if [ $HTTP_CODE -eq 200 ]; then
  echo "✅ OK ($HTTP_CODE)"
else
  echo "❌ ERROR ($HTTP_CODE)"
fi

# Verificar servicios del sistema
echo -n "🚀 Node.js: "
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "✅ OK ($NODE_VERSION)"
else
  echo "❌ NO INSTALADO"
fi

echo -n "📊 PM2: "
if command -v pm2 &> /dev/null; then
  PM2_STATUS=$(pm2 status megaverse-api | grep -c "online")
  if [ $PM2_STATUS -ge 1 ]; then
    echo "✅ OK (Procesos activos: $PM2_STATUS)"
  else
    echo "⚠️ INACTIVO"
  fi
else
  echo "❌ NO INSTALADO"
fi

echo -n "🗄️ MariaDB: "
if mysqladmin -u megaverse_user -p'tu_contraseña_segura' ping &>/dev/null; then
  echo "✅ OK"
else
  echo "❌ ERROR"
fi

echo -n "🌐 Nginx: "
if systemctl is-active --quiet nginx; then
  echo "✅ OK"
else
  echo "❌ INACTIVO"
fi

echo -n "🔒 SSL: "
SSL_EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect ${DOMAIN#https://}:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
if [ ! -z "$SSL_EXPIRY" ]; then
  echo "✅ OK (Expira: $SSL_EXPIRY)"
else
  echo "❌ ERROR o No configurado"
fi

echo "✅ Verificación completa!"
```

```bash
sudo chmod +x /var/www/megaverse/private/verify-deployment.sh
```

## 🔍 Paso 12: Verificación y monitoreo

### 12.1 Verificar el estado del servicio

```bash
pm2 status
pm2 logs megaverse-api
```

### 12.2 Monitoreo del servidor

```bash
sudo apt install -y htop
htop
```

### 12.3 Verificar los endpoints principales

```bash
# Ejecutar el script de verificación
/var/www/megaverse/private/verify-deployment.sh
```

## 🔧 Paso 13: Configurar SEO y Rendimiento

### 13.1 Configurar Gzip en Nginx

Edita `/etc/nginx/nginx.conf`:

```bash
sudo nano /etc/nginx/nginx.conf
```

Añade o descomenta estas líneas dentro del bloque `http`:

```nginx
gzip on;
gzip_disable "msie6";
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_buffers 16 8k;
gzip_http_version 1.1;
gzip_min_length 256;
gzip_types
  application/atom+xml
  application/javascript
  application/json
  application/ld+json
  application/manifest+json
  application/rss+xml
  application/vnd.geo+json
  application/vnd.ms-fontobject
  application/x-font-ttf
  application/x-web-app-manifest+json
  application/xhtml+xml
  application/xml
  font/opentype
  image/bmp
  image/svg+xml
  image/x-icon
  text/cache-manifest
  text/css
  text/plain
  text/vcard
  text/vnd.rim.location.xloc
  text/vtt
  text/x-component
  text/x-cross-domain-policy;
```

### 13.2 Configurar robots.txt

Crea `/var/www/megaverse/frontend/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://tudominio.com/sitemap.xml

Disallow: /admin/
Disallow: /api/
```

### 13.3 Configurar sitemap.xml (opcional)

Si tu aplicación genera dinámicamente un sitemap, asegúrate de que esté accesible en `/sitemap.xml`.

## 🚨 Troubleshooting

### Error 502 Bad Gateway

```bash
# Verificar si la API está corriendo
pm2 status
pm2 logs megaverse-api

# Verificar la configuración de Nginx
sudo nginx -t
sudo journalctl -u nginx
```

### Error de conexión a MariaDB

```bash
# Verificar estado de MariaDB
sudo systemctl status mariadb

# Verificar acceso a la base de datos
mysql -u megaverse_user -p -e "SHOW DATABASES;"

# Verificar permisos
sudo ls -la /var/lib/mysql/db_megaverse/
```

### Problemas con permisos de archivos

```bash
# Reconfigurar permisos
sudo chown -R $USER:www-data /var/www/megaverse
sudo chmod -R 755 /var/www/megaverse
sudo chmod -R 775 /var/www/megaverse/backend/uploads
```

### Certificado SSL expirado o no válido

```bash
# Renovar certificado manualmente
sudo certbot renew

# Verificar estado
sudo certbot certificates
```

### PM2 no inicia automáticamente tras reinicio

```bash
# Reconfigurar inicio automático
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

## 📋 Checklist final

- [ ] Servidor actualizado
- [ ] Node.js y PM2 instalados
- [ ] MariaDB configurado y base de datos importada
- [ ] Frontend desplegado
- [ ] Backend desplegado y corriendo con PM2
- [ ] Variables de entorno configuradas
- [ ] Nginx configurado como proxy inverso
- [ ] SSL configurado con Certbot
- [ ] Scripts de backup y despliegue creados
- [ ] Configuración de GitHub y/o webhook (si aplica)
- [ ] Permisos de directorios configurados correctamente
- [ ] Verificados los endpoints principales
- [ ] Configuración de Gzip y optimización de rendimiento
- [ ] Crontab configurado para backups automáticos
- [ ] Script de verificación de despliegue funcionando

¡Tu aplicación MEGAVERSE debería estar ahora funcionando en producción! 🎉
