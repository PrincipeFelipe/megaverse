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
