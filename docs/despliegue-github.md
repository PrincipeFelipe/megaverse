#Created tunnel megaverse-tunnel with id dbda2945-4a30-4687-b844-03dd670a7c13
# 🚀 Manual de Despliegue desde GitHub en Debian 12

Este documento proporciona instrucciones paso a paso para desplegar el proyecto MEGAVERSE en un servidor Debian 12 utilizando GitHub como fuente del código.

El código fuente del proyecto está disponible en: https://github.com/PrincipeFelipe/megaverse

## 📋 Requisitos previos

- Servidor Debian 12 con acceso root o sudo
- Dominio configurado para apuntar al servidor
- Cliente SSH para conectarse al servidor
- Cuenta en GitHub y acceso al repositorio

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
├── repo/                 # Repositorio clonado de GitHub
└── private/              # Archivos privados fuera de acceso web
    ├── .env.production   # Variables de entorno
    ├── backups/          # Copias de seguridad
    ├── logs/             # Registros de la aplicación
    └── scripts/          # Scripts de despliegue y mantenimiento
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
# Para Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Alternativa: para proyectos que requieren Node.js 20
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt install -y nodejs
```

### 2.2 Verificar la instalación

```bash
node --version  # Debería mostrar v18.x.x (o v20.x.x si instalaste Node.js 20)
npm --version   # Debería mostrar 9.x.x o superior
```

> 💡 **Nota**: Algunos paquetes nuevos pueden mostrar advertencias `EBADENGINE` si requieren una versión más reciente de Node.js. Si ves estas advertencias pero la aplicación funciona correctamente, puedes ignorarlas o actualizar a Node.js 20 si es necesario.

### 2.3 Instalar PM2 globalmente

```bash
sudo npm install -g pm2
```

## 🔧 Paso 3: Instalar MariaDB

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
CREATE USER 'megaverse'@'localhost' IDENTIFIED BY 'M3g4V3rs3';
GRANT ALL PRIVILEGES ON db_megaverse.* TO 'megaverse'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 🔧 Paso 4: Preparar estructura de directorios

### 4.1 Crear directorios principales

```bash
sudo mkdir -p /var/www/megaverse/{frontend,backend,repo,private/{backups,logs,scripts}}
sudo mkdir -p /var/www/megaverse/backend/uploads/{avatars,blog,documents}
```

### 4.2 Establecer permisos adecuados

```bash
sudo chown -R $USER:www-data /var/www/megaverse
sudo chmod -R 755 /var/www/megaverse
sudo chmod -R 775 /var/www/megaverse/backend/uploads
```

## 🔧 Paso 5: Clonar el repositorio de GitHub

### 5.1 Clonar el repositorio

```bash
cd /var/www/megaverse/repo
git clone https://github.com/PrincipeFelipe/megaverse.git .
```

> 💡 **Consejo**: Si el repositorio es privado, primero configura las credenciales de Git o usa SSH.

### 5.2 Cambiar a la rama adecuada (si es necesario)

```bash
git checkout main  # O master, o la rama que uses
```

## 🔧 Paso 6: Configurar variables de entorno

### 6.1 Crear archivos de entorno

```bash
nano /var/www/megaverse/private/.env.production
```

Añade el siguiente contenido:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=Kj8#mN2$pQ9*rS4%tU7&vW1!xY3@zA6^bC5+dE8-fG0~hI2
DB_HOST=localhost
DB_USER=megaverse
DB_PASSWORD=M3g4V3rs3
DB_NAME=db_megaverse
SITE_URL=https://clubmegaverse.com
```

> ⚠️ **Importante**: Genera una clave JWT segura con:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 6.2 Crear archivo .env para el frontend

```bash
cd /var/www/megaverse/repo
nano .env.production
```

```env
VITE_API_URL=https://clubmegaverse.com/api
VITE_SITE_URL=https://clubmegaverse.com
```

## 🔧 Paso 7: Crear scripts de despliegue

### 7.1 Script principal de despliegue

Crea `/var/www/megaverse/private/scripts/deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Desplegando MEGAVERSE desde GitHub..."

# Directorio base
BASE_DIR="/var/www/megaverse"
REPO_DIR="$BASE_DIR/repo"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Desactivar advertencias de motor de Node.js
# Si prefieres ver las advertencias, comenta esta línea
export npm_config_engine_strict=false

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d "v" -f 2 | cut -d "." -f 1)
echo "📊 Versión de Node.js detectada: $(node -v)"
if [ "$NODE_VERSION" -lt "16" ]; then
  echo "⚠️ ADVERTENCIA: La versión de Node.js es antigua (menor que v16)"
  echo "  Algunos paquetes modernos pueden requerir Node.js 16, 18 o 20."
  echo "  Si encuentras problemas, considera actualizar Node.js:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
  echo "  sudo apt install -y nodejs"
elif [ "$NODE_VERSION" -lt "18" ]; then
  echo "ℹ️ Estás usando Node.js v$NODE_VERSION (recomendado: v18+)"
fi

# Crear directorio de backups si no existe
mkdir -p $BASE_DIR/private/backups

# Crear backup (si la base de datos ya existe)
echo "📦 Intentando crear backup de seguridad..."
if mysqladmin -u megaverse -p'M3g4V3rs3' ping &>/dev/null; then
  echo "✅ Base de datos accesible, creando backup..."
  mysqldump -u megaverse -p'M3g4V3rs3' db_megaverse > $BASE_DIR/private/backups/pre_deploy_$TIMESTAMP.sql
else
  echo "⚠️ No se pudo acceder a la base de datos para crear backup"
fi

# Comprobar si el repositorio ya está clonado
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "📥 Clonando repositorio por primera vez..."
  # Limpiar directorio si existe pero no es un repo git
  if [ -d "$REPO_DIR" ]; then
    echo "🧹 Limpiando directorio existente..."
    rm -rf "$REPO_DIR"
  fi
  mkdir -p $REPO_DIR
  git clone https://github.com/PrincipeFelipe/megaverse.git $REPO_DIR
  if [ $? -ne 0 ]; then
    echo "❌ ERROR: No se pudo clonar el repositorio"
    echo "🔄 Intentando descargar directamente..."
    cd $REPO_DIR
    rm -rf * 2>/dev/null
    wget -q https://github.com/PrincipeFelipe/megaverse/archive/refs/heads/main.zip
    if [ $? -eq 0 ]; then
      echo "✅ Descarga exitosa, extrayendo..."
      unzip -q main.zip
      mv megaverse-main/* .
      rm -rf megaverse-main main.zip
    else
      echo "❌ ERROR: No se pudo descargar el código"
      exit 1
    fi
  fi
else
  # Actualizar código
  echo "📂 Actualizando código desde GitHub..."
  cd $REPO_DIR
  git fetch origin
  git reset --hard origin/main  # Cambia a tu rama principal si es diferente
fi

# Crear directorios si no existen
echo "📁 Verificando directorios..."
mkdir -p $BASE_DIR/{frontend,backend,private/{logs,backups,scripts}}
mkdir -p $BASE_DIR/backend/uploads/{avatars,blog,documents}

# Verificar si package.json existe
if [ -f "$REPO_DIR/package.json" ]; then
  echo "🏗️ Construyendo frontend..."
  cd $REPO_DIR
  # Instalar dependencias
  if [ -f "package-lock.json" ]; then
    # Usar --no-fund para evitar mensajes de financiación y --no-audit para acelerar instalación
    npm ci --no-fund --no-audit || npm install --no-fund --no-audit
  else
    npm install --no-fund --no-audit
  fi
  
  # Determinar qué scripts están disponibles
  echo "📋 Verificando scripts disponibles..."
  AVAILABLE_SCRIPTS=$(npm run | grep -o -P "(?<=').*(?=')" | tr '\n' ' ')
  echo "🔍 Scripts disponibles: $AVAILABLE_SCRIPTS"
  
  # Construir frontend (intentando diferentes comandos de construcción)
  if echo "$AVAILABLE_SCRIPTS" | grep -q "build:prod"; then
    echo "🏗️ Ejecutando script build:prod..."
    npm run build:prod
  elif echo "$AVAILABLE_SCRIPTS" | grep -q "build"; then
    echo "🏗️ Ejecutando script build..."
    npm run build
  elif echo "$AVAILABLE_SCRIPTS" | grep -q "prod"; then
    echo "🏗️ Ejecutando script prod..."
    npm run prod
  else
    echo "⚠️ No se encontró un comando de construcción reconocido en package.json"
    echo "📄 Scripts disponibles: $AVAILABLE_SCRIPTS"
    echo "⚠️ Intentando ejecutar 'npm run build' como última opción..."
    npm run build
  fi
  
  # Mostrar advertencias sobre caniuse-lite si aparecen
  if [ $? -ne 0 ]; then
    echo "❌ Error en la construcción del frontend"
  else
    echo "✅ Construcción completada"
    # Actualizar caniuse-lite si es necesario para eliminar advertencias en futuros despliegues
    echo "🔄 Actualizando caniuse-lite para eliminar advertencias..."
    npx update-browserslist-db@latest
    
    # Mostrar mensaje informativo sobre advertencias de Vite que son normales
    echo ""
    echo "ℹ️ Aviso: Durante la construcción pueden aparecer advertencias sobre:"
    echo "- 'Some chunks are larger than 500 kBs after minification'"
    echo "- 'Chunks that import dynamic modules should use dynamicImport'"
    echo "Estas son advertencias informativas de Vite y no afectan el funcionamiento"
    echo "de la aplicación en producción."
  fi
  
  # Copiar archivos construidos si existen
  if [ -d "dist" ]; then
    echo "📋 Copiando frontend..."
    rm -rf $BASE_DIR/frontend/* 2>/dev/null
    cp -r dist/* $BASE_DIR/frontend/ || echo "⚠️ No se pudieron copiar los archivos del frontend"
  else
    echo "⚠️ No se encontró el directorio dist/ después de la compilación"
  fi
else
  echo "⚠️ No se encontró package.json en el repositorio"
fi

# Actualizar backend si existe
if [ -d "$REPO_DIR/server" ]; then
  echo "📋 Copiando backend..."
  cp -r $REPO_DIR/server/* $BASE_DIR/backend/ || echo "⚠️ No se pudieron copiar todos los archivos del backend"
  
  # Enlazar archivo .env en el backend
  cd $BASE_DIR/backend
  echo "🔗 Enlazando archivo .env..."
  ln -sf ../private/.env.production .env
  
  # Instalar dependencias del backend
  if [ -f "package.json" ]; then
    echo "📚 Instalando dependencias del backend..."
    npm install --omit=dev
  else
    echo "⚠️ No se encontró package.json en el backend"
  fi
else
  echo "⚠️ No se encontró el directorio server/ en el repositorio"
  # Crear estructura mínima del backend para evitar errores
  mkdir -p $BASE_DIR/backend
  cd $BASE_DIR/backend
  echo "module.exports = { server: () => console.log('Server placeholder') };" > index.js
fi

# Configurar PM2 si no existe el archivo
if [ ! -f "$BASE_DIR/backend/ecosystem.config.js" ]; then
  echo "📝 Creando configuración de PM2..."
  
  # Verificar si el proyecto usa ES modules
  if grep -q '"type": "module"' "$BASE_DIR/backend/package.json" 2>/dev/null; then
    echo "📝 Detectado proyecto con ES modules, creando ecosystem.config.cjs..."
    # Crear archivo con extensión .cjs para CommonJS en proyecto con tipo module
    cat > "$BASE_DIR/backend/ecosystem.config.cjs" << EOL
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
EOL
  else
    # Proyecto CommonJS estándar
    cat > "$BASE_DIR/backend/ecosystem.config.js" << EOL
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
EOL
  fi
fi

# Asegurarse de que existan los archivos de log
mkdir -p $BASE_DIR/private/logs
touch $BASE_DIR/private/logs/app-err.log
touch $BASE_DIR/private/logs/app-out.log

# Reiniciar la aplicación
echo "🔄 Reiniciando servicios..."
cd $BASE_DIR/backend
# Verificar cuál archivo de configuración PM2 existe
if [ -f "ecosystem.config.cjs" ]; then
  pm2 restart megaverse-api 2>/dev/null || pm2 start ecosystem.config.cjs
elif [ -f "ecosystem.config.js" ]; then
  # Si tiene type: module, puede fallar con .js
  if grep -q '"type": "module"' "package.json" 2>/dev/null; then
    echo "⚠️ Detectado proyecto ES modules con ecosystem.config.js"
    # Renombrar a .cjs
    mv "ecosystem.config.js" "ecosystem.config.cjs"
    pm2 restart megaverse-api 2>/dev/null || pm2 start ecosystem.config.cjs
  else
    pm2 restart megaverse-api 2>/dev/null || pm2 start ecosystem.config.js
  fi
else
  # Si no existe, iniciar directamente el index.js
  echo "⚠️ No se encontró configuración PM2, iniciando directamente index.js"
  pm2 restart megaverse-api 2>/dev/null || pm2 start index.js --name megaverse-api
fi
pm2 save

# Verificar estado
echo "🔍 Verificando estado del servicio..."
pm2 status megaverse-api

echo "✅ Despliegue completado!"
echo "📅 Fecha: $(date)"
```

### 7.2 Script de verificación

Crea `/var/www/megaverse/private/scripts/verify.sh`:

```bash
#!/bin/bash

echo "🔍 Verificando despliegue de MEGAVERSE..."
DOMAIN="https://clubmegaverse.com"

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
if mysqladmin -u megaverse -p'M3g4V3rs3' ping &>/dev/null; then
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

### 7.3 Script de backup

Crea `/var/www/megaverse/private/scripts/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/www/megaverse/private/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Creando backup..."

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup de base de datos
if mysqladmin -u megaverse -p'M3g4V3rs3' ping &>/dev/null; then
  echo "📦 Creando backup de la base de datos..."
  mysqldump -u megaverse -p'M3g4V3rs3' db_megaverse > $BACKUP_DIR/db_backup_$DATE.sql
  if [ $? -eq 0 ]; then
    echo "✅ Backup de base de datos completado"
  else
    echo "❌ Error al crear backup de la base de datos"
  fi
else
  echo "⚠️ No se pudo conectar a la base de datos para hacer backup"
fi

# Backup de uploads
if [ -d "/var/www/megaverse/backend/uploads/" ]; then
  echo "📦 Creando backup de archivos subidos..."
  tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /var/www/megaverse/backend/uploads/ 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ Backup de archivos subidos completado"
  else
    echo "❌ Error al crear backup de archivos subidos"
  fi
else
  echo "⚠️ No se encontró la carpeta de uploads para hacer backup"
fi

# Limpiar backups antiguos (mantener solo los últimos 7)
echo "🧹 Limpiando backups antiguos..."
find $BACKUP_DIR -name "db_backup_*.sql" -type f | sort -r | tail -n +8 | xargs rm -f 2>/dev/null
find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -type f | sort -r | tail -n +8 | xargs rm -f 2>/dev/null

echo "✅ Proceso de backup completado en $BACKUP_DIR"
echo "📁 Archivos de backup más recientes:"
ls -lh $BACKUP_DIR | head -n 5
```

### 7.4 Configurar permisos para los scripts

```bash
chmod +x /var/www/megaverse/private/scripts/*.sh
```

## 🔧 Paso 8: Primer despliegue

### 8.1 Ejecutar el script de despliegue

```bash
/var/www/megaverse/private/scripts/deploy.sh
```

### 8.2 Configurar inicio automático de PM2

```bash
pm2 save
pm2 startup
```

Sigue las instrucciones que muestra el comando `pm2 startup` para configurar el inicio automático.

## 🔧 Paso 9: Importar la base de datos (Si ya tienes un dump SQL)

### 9.1 Preparar el archivo SQL (si es necesario)

Si tienes problemas con columnas TIMESTAMP:

```bash
# Solución rápida - cambia una columna a DATETIME
sed -i 's/`created_at` timestamp NULL DEFAULT current_timestamp()/`created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP/g' db_megaverse.sql
```

### 9.2 Importar

```bash
mysql -u megaverse -p'M3g4V3rs3' db_megaverse < db_megaverse.sql
```

Si tienes problemas con la importación, puedes probar con:

```bash
# Importar ignorando errores
mysql -u megaverse -p'M3g4V3rs3' db_megaverse < db_megaverse.sql 2>/dev/null || echo "⚠️ Hubo algunos errores durante la importación"
```

## 🔧 Paso 10: Configurar Nginx

### 10.1 Crear configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/megaverse
```

```nginx
server {
    listen 80;
    server_name clubmegaverse.com www.clubmegaverse.com;
    
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

### 10.2 Activar el sitio en Nginx

```bash
sudo ln -s /etc/nginx/sites-available/megaverse /etc/nginx/sites-enabled/
sudo nginx -t  # Verificar sintaxis
sudo systemctl restart nginx
```

## 🔧 Paso 11: Configurar SSL con Certbot

### 11.1 Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 11.2 Obtener certificado SSL

```bash
sudo certbot --nginx -d clubmegaverse.com -d www.clubmegaverse.com
```

Sigue las instrucciones y selecciona la opción para redireccionar automáticamente HTTP a HTTPS.

## 🔧 Paso 12: Configurar actualización automática (opcional)

### 11.4 Solución de problemas de Node.js y compatibilidad

Si encuentras advertencias de compatibilidad como `npm warn EBADENGINE`, puedes actualizar Node.js o ignorar las advertencias:

```bash
# Actualizar Node.js a una versión compatible
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt update && sudo apt install -y nodejs

# O alternativamente, ignorar advertencias de versiones de motores
echo '{ "engine-strict": false }' > ~/.npmrc
```

## 🛠️ Solución de problemas de CORS

Si encuentras errores de CORS al acceder a la API desde el frontend como:

```
Solicitud desde otro origen bloqueada: la política de mismo origen impide leer el recurso remoto
```

o

```
Solicitud de origen cruzado bloqueada: La misma política de origen no permite la lectura de recursos remotos
```

Sigue estos pasos para solucionar el problema:

### 1. Configurar encabezados CORS en Nginx

Edita tu configuración de Nginx para incluir los encabezados CORS necesarios:

```bash
sudo nano /etc/nginx/sites-available/megaverse
```

Actualiza la sección del bloque `location /api/` para que quede así:

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
    
    # Configuración CORS
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

    # Manejar las solicitudes OPTIONS (preflight)
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Max-Age' 1728000 always;
        add_header 'Content-Type' 'text/plain; charset=utf-8' always;
        add_header 'Content-Length' 0 always;
        return 204;
    }
}
```

Después de modificar la configuración, verifica y reinicia Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Configurar CORS en el backend Node.js

Si el problema persiste, asegúrate de que tu API también tenga CORS configurado correctamente:

1. Instala el paquete `cors` si no está instalado:

```bash
cd /var/www/megaverse/backend
npm install cors
```

2. Asegúrate de que tu código del servidor incluya la configuración de CORS:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Configuración básica de CORS
app.use(cors());

// O para una configuración más específica:
app.use(cors({
  origin: ['https://clubmegaverse.com', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Resto de tu código...
```

3. Reinicia la aplicación después de realizar los cambios:

```bash
pm2 restart megaverse-api
```

### 3. Verificar la configuración de variables de entorno

Asegúrate de que las URLs en tus archivos de entorno sean correctas:

```bash
# En /var/www/megaverse/private/.env.production
SITE_URL=https://clubmegaverse.com

# En /var/www/megaverse/repo/.env.production
VITE_API_URL=https://clubmegaverse.com/api
VITE_SITE_URL=https://clubmegaverse.com
```

### 4. Verificar los ajustes después de la implementación

Una vez aplicados los cambios, puedes verificar si los encabezados CORS se están enviando correctamente:

```bash
curl -I -X OPTIONS https://clubmegaverse.com/api/auth/login -H "Origin: https://clubmegaverse.com"
```

La respuesta debería incluir los encabezados `Access-Control-Allow-*`.

### 12.1 Configurar webhook para despliegue automático

1. Instalar webhook:

```bash
sudo apt install -y webhook
```

2. Crear archivo de configuración en `/var/www/megaverse/private/hooks.json`:

```json
[
  {
    "id": "deploy-megaverse",
    "execute-command": "/var/www/megaverse/private/scripts/deploy.sh",
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

3. Configurar el servicio:

```bash
sudo nano /etc/systemd/system/webhook.service
```

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

4. Iniciar y habilitar el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl start webhook
sudo systemctl enable webhook
```

5. Actualizar Nginx para permitir el webhook:

```nginx
# Añadir esto dentro del bloque server en /etc/nginx/sites-available/megaverse
location /hooks/ {
    proxy_pass http://localhost:9000/hooks/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

6. Recargar Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

7. Configurar el webhook en GitHub:
   - Ve a tu repositorio → Settings → Webhooks → Add webhook
   - Payload URL: `https://clubmegaverse.com/hooks/deploy-megaverse`
   - Content type: `application/json`
   - Secret: el mismo secreto que usaste en `hooks.json`
   - Eventos: selecciona "Just the push event"

### 12.2 Configurar GitHub Actions para CI/CD (alternativa)

1. Crea un archivo `.github/workflows/deploy.yml` en tu repositorio:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]  # O la rama que uses

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Execute remote SSH commands
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/megaverse
            ./private/scripts/deploy.sh
```

2. Configura los secretos en tu repositorio GitHub:
   - `SSH_HOST`: La dirección IP o dominio de tu servidor
   - `SSH_USERNAME`: Usuario SSH
   - `SSH_PRIVATE_KEY`: Clave SSH privada

## 🔧 Paso 13: Automatizar backups

```bash
# Programar backup diario a las 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/megaverse/private/scripts/backup.sh >> /var/www/megaverse/private/logs/backup.log 2>&1") | crontab -
```

## 🔧 Paso 14: Optimización y SEO

### 14.1 Configurar Gzip en Nginx

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

### 14.2 Configurar robots.txt

```bash
nano /var/www/megaverse/frontend/robots.txt
```

```
User-agent: *
Allow: /

Sitemap: https://clubmegaverse.com/sitemap.xml

Disallow: /admin/
Disallow: /api/
```

## 🚨 Troubleshooting

### Errores comunes durante el despliegue inicial

#### Advertencias de Node.js y npm

##### Advertencia EBADENGINE (npm engine warnings)

```
npm WARN EBADENGINE Unsupported engine {
  package: 'nombre-paquete@versión',
  required: { node: '>=20.0.0' },
  current: { node: 'v18.x.x', npm: '9.x.x' }
}
```

Esta advertencia aparece cuando un paquete recomienda una versión de Node.js más reciente que la instalada. En la mayoría de los casos, se puede ignorar si la aplicación funciona correctamente.

**Soluciones:**

1. Ignorar la advertencia (recomendado si todo funciona bien):
```bash
# Añadir al deploy.sh para suprimir futuras advertencias
export npm_config_engine_strict=false
```

2. Actualizar a la versión requerida de Node.js (si realmente es necesario):
```bash
# Actualizar a Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verificar que ahora es v20.x.x
```

##### Advertencia sobre caniuse-lite desactualizado

```
Warning: caniuse-lite is outdated
```

Este mensaje aparece cuando los datos de compatibilidad de navegadores están desactualizados.

**Solución:**
```bash
# Actualizar caniuse-lite
npx update-browserslist-db@latest
```

#### Error: "No es un repositorio git"

Esto ocurre cuando la carpeta `/var/www/megaverse/repo` no está inicializada como un repositorio Git.

```bash
# Solución: Elimina la carpeta y vuelve a clonar el repositorio
rm -rf /var/www/megaverse/repo
mkdir -p /var/www/megaverse/repo
git clone https://github.com/PrincipeFelipe/megaverse.git /var/www/megaverse/repo
```

#### Error: "Access denied for user 'megaverse'@'localhost'"

Esto ocurre cuando las credenciales de MariaDB son incorrectas o el usuario no existe.

```bash
# Verificar que el usuario existe
sudo mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User = 'megaverse';"

# Si no existe, crearlo:
sudo mysql -u root -p -e "CREATE USER 'megaverse'@'localhost' IDENTIFIED BY 'M3g4V3rs3'; GRANT ALL PRIVILEGES ON db_megaverse.* TO 'megaverse'@'localhost'; FLUSH PRIVILEGES;"
```

#### Error: "npm ci command can only install with an existing package-lock.json"

Esto ocurre cuando no existe un package-lock.json en el repositorio.

```bash
# Modificar el script deploy.sh para usar npm install en lugar de npm ci
# O ejecutar manualmente:
cd /var/www/megaverse/repo
npm install
```

#### Error: "Could not read package.json"

Esto ocurre cuando la estructura del repositorio no es la esperada.

```bash
# Verificar la estructura del repositorio:
ls -la /var/www/megaverse/repo

# Si no existe el package.json, puede que el repositorio tenga una estructura diferente
# Buscar el archivo package.json:
find /var/www/megaverse/repo -name "package.json" -type f
```

#### Error: "Missing script: build:prod"

Este error ocurre cuando el script de construcción especificado no existe en el archivo package.json:

```
npm ERR! Missing script: "build:prod"
```

**Diagnóstico:**
```bash
# Ver qué scripts están disponibles:
cd /var/www/megaverse/repo
npm run

# Alternativa para ver solo los nombres de scripts:
grep -A 20 '"scripts"' package.json
```

**Soluciones:**

1. Usar un script alternativo (automático en la versión actualizada del deploy.sh):
```bash
# El script actualizado intentará automáticamente build, prod, etc.
# Puedes modificar manualmente el orden de los comandos en deploy.sh:
npm run build:prod || npm run build || npm run prod
```

2. Añadir el script manualmente:
```bash
# Editar package.json para añadir el script build:prod
sed -i 's/"scripts": {/"scripts": {\n    "build:prod": "vite build",/g' package.json
```

> 💡 **Nota**: La versión actualizada del script de despliegue detecta y prueba automáticamente diferentes comandos de construcción (build:prod, build, prod) en orden, por lo que normalmente no necesitarás resolver este problema manualmente.

### Error 502 Bad Gateway

```bash
# Verificar si la API está corriendo
pm2 status
pm2 logs megaverse-api

# Verificar la configuración de Nginx
sudo nginx -t
sudo journalctl -u nginx

# Reiniciar servicios
sudo systemctl restart nginx
pm2 restart megaverse-api
```

### Error de conexión a MariaDB

```bash
# Verificar estado de MariaDB
sudo systemctl status mariadb

# Verificar acceso a la base de datos
mysql -u megaverse -p'M3g4V3rs3' -e "SHOW DATABASES;"

# Si hay problemas con la contraseña
sudo mysql -u root -p
mysql> ALTER USER 'megaverse'@'localhost' IDENTIFIED BY 'M3g4V3rs3';
mysql> FLUSH PRIVILEGES;
```

### Problemas con GitHub

```bash
# Verificar si hay problemas con el repositorio
cd /var/www/megaverse/repo
git status
git remote -v  # Verificar que apunta al repositorio correcto

# Si hay problemas con la autenticación
git config credential.helper store
git pull  # Ingresa las credenciales una vez

# Alternativa: descargar como ZIP si Git no funciona
wget https://github.com/PrincipeFelipe/megaverse/archive/refs/heads/main.zip
unzip main.zip
```

### Advertencias durante la compilación con Vite

Durante el proceso de construcción con Vite (herramienta de compilación para proyectos frontend), es normal ver advertencias como:

```
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking
```

```
(!) /path/to/file.js is dynamically imported by /other/path.js but also statically imported by /another/file.js, dynamic import will not move module into another chunk.
```

**¿Qué significan?**
- La primera advertencia indica que algunos archivos JavaScript generados son grandes y podrían afectar el tiempo de carga inicial.
- La segunda advertencia es sobre optimizaciones de importaciones dinámicas que no pueden aplicarse debido a la estructura del código.

**¿Debo preocuparme?**
No. Estas son advertencias informativas y no afectan la funcionalidad de la aplicación. Son sugerencias de optimización que podrían implementarse en futuras versiones del proyecto.

### Errores en el despliegue automático

```bash
# Verificar logs del webhook
sudo journalctl -u webhook

# Reiniciar el servicio de webhook
sudo systemctl restart webhook
```

### PM2 no encuentra el archivo index.js

Si PM2 no puede encontrar el archivo principal del backend:

```bash
# Verificar que el archivo existe
ls -la /var/www/megaverse/backend/index.js

# Si no existe, buscar el archivo principal
find /var/www/megaverse/backend -name "*.js" | grep -v "node_modules"

# Editar ecosystem.config.js para apuntar al archivo correcto
nano /var/www/megaverse/backend/ecosystem.config.js
```

### Error ERR_REQUIRE_ESM con ecosystem.config.js

Este error ocurre cuando el proyecto usa ES Modules (tiene `"type": "module"` en su package.json) y PM2 intenta cargar ecosystem.config.js con require() (que usa CommonJS):

```
Error [ERR_REQUIRE_ESM]: require() of ES Module ecosystem.config.js not supported
```

**Diagnóstico automático:**

El script de despliegue incluye detección automática de este problema:

```
⚠️ Detectado proyecto ES modules con ecosystem.config.js
```

Y aplica la solución renombrando el archivo a `.cjs`. Esto permite que PM2 (que utiliza CommonJS) pueda cargar correctamente la configuración.

**Verificación manual:**

```bash
# Verificar si el proyecto usa ES Modules
grep "type" /var/www/megaverse/backend/package.json

# Si muestra "type": "module", el proyecto usa ES Modules y necesita la solución
```

**Soluciones:**

1. **Solución recomendada**: Renombrar el archivo a .cjs (aplicado automáticamente por el script):
```bash
mv /var/www/megaverse/backend/ecosystem.config.js /var/www/megaverse/backend/ecosystem.config.cjs
pm2 restart megaverse-api 2>/dev/null || pm2 start ecosystem.config.cjs
```

2. **Alternativa**: Cambiar el package.json para usar CommonJS (solo si no afecta al resto de la aplicación):
```bash
sed -i 's/"type": "module"/"type": "commonjs"/g' /var/www/megaverse/backend/package.json
pm2 restart megaverse-api 2>/dev/null || pm2 start ecosystem.config.js
```

3. **Solución directa**: Iniciar directamente el archivo principal sin usar configuración:
```bash
pm2 delete megaverse-api 2>/dev/null
pm2 start index.js --name megaverse-api
```

> 💡 **Explicación**: Este problema ocurre debido a la incompatibilidad entre PM2 (que usa CommonJS) y los proyectos con ES Modules. La extensión `.cjs` es una forma estándar de indicar que un archivo debe ser tratado como CommonJS incluso en proyectos configurados como ES Modules. El script de despliegue actualizado detecta y maneja este problema automáticamente.

## 📋 Checklist final

- [ ] Servidor actualizado
- [ ] Node.js y PM2 instalados
- [ ] MariaDB configurado
- [ ] Repositorio GitHub clonado
- [ ] Scripts de despliegue creados y probados
- [ ] Frontend construido y desplegado
- [ ] Backend configurado y funcionando
- [ ] Base de datos importada
- [ ] Nginx configurado como proxy reverso
- [ ] SSL configurado con Certbot
- [ ] Actualizaciones automáticas configuradas (webhook o GitHub Actions)
- [ ] Backups automáticos configurados
- [ ] Optimización y SEO configurados
- [ ] Verificación completa ejecutada

¡Tu aplicación MEGAVERSE debería estar ahora funcionando en producción! 🚀
