#!/bin/bash

# Script de despliegue automatizado para MEGAVERSE
# Uso: ./deploy.sh [servidor] [usuario]

set -e  # Detener en caso de error

# Configuración (ajustar según tu servidor)
SERVER=${1:-"tu-servidor.com"}
USER=${2:-"tu-usuario"}
REMOTE_PATH="/var/www/vhosts/megaverse.com"

echo "🚀 Iniciando despliegue de MEGAVERSE a $SERVER..."

# Verificar que estamos en la rama correcta
BRANCH=$(git branch --show-current)
echo "📍 Rama actual: $BRANCH"

if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    read -p "⚠️  No estás en la rama main/master. ¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Despliegue cancelado"
        exit 1
    fi
fi

# Verificar que no hay cambios sin commit
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  Hay cambios sin commit:"
    git status --short
    read -p "¿Continuar de todos modos? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Despliegue cancelado"
        exit 1
    fi
fi

# Construir frontend
echo "📦 Construyendo frontend..."
npm run build

# Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    echo "❌ Error: No se pudo construir el frontend"
    exit 1
fi

echo "📋 Archivos a desplegar:"
echo "   Frontend: $(du -sh dist | cut -f1)"
echo "   Backend: $(du -sh server | cut -f1)"

read -p "🤔 ¿Continuar con el despliegue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Despliegue cancelado"
    exit 1
fi

# Crear backup antes del despliegue
echo "💾 Creando backup remoto..."
ssh $USER@$SERVER "
    cd $REMOTE_PATH
    if [ -d httpdocs ]; then
        tar -czf backup_frontend_\$(date +%Y%m%d_%H%M%S).tar.gz httpdocs/
    fi
    if [ -d api ]; then
        tar -czf backup_api_\$(date +%Y%m%d_%H%M%S).tar.gz api/
    fi
    # Mantener solo los últimos 5 backups
    ls -t backup_*.tar.gz | tail -n +6 | xargs -r rm
"

# Subir frontend
echo "📤 Subiendo frontend..."
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.env*' \
    dist/ $USER@$SERVER:$REMOTE_PATH/httpdocs/

# Subir backend
echo "📤 Subiendo backend..."
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='logs' \
    --exclude='uploads' \
    server/ $USER@$SERVER:$REMOTE_PATH/api/

# Subir archivo .htaccess
echo "📤 Subiendo configuración..."
scp .htaccess $USER@$SERVER:$REMOTE_PATH/httpdocs/

# Ejecutar comandos en el servidor
echo "🔧 Configurando servidor..."
ssh $USER@$SERVER "
    cd $REMOTE_PATH/api
    
    # Crear directorios necesarios
    mkdir -p logs uploads/avatars uploads/blog uploads/documents
    
    # Instalar/actualizar dependencias
    echo '📦 Instalando dependencias...'
    npm install --production
    
    # Verificar que PM2 esté instalado
    if ! command -v pm2 &> /dev/null; then
        echo '⚠️  PM2 no está instalado. Instalando...'
        npm install -g pm2
    fi
    
    # Reiniciar aplicación con PM2
    echo '🔄 Reiniciando aplicación...'
    if pm2 list | grep -q megaverse-api; then
        pm2 restart megaverse-api
    else
        pm2 start ecosystem.config.js
        pm2 save
    fi
    
    # Verificar estado
    pm2 status megaverse-api
"

# Verificar el despliegue
echo "🔍 Verificando despliegue..."

# Verificar frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$SERVER/ || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend: OK (HTTP $FRONTEND_STATUS)"
else
    echo "❌ Frontend: Error (HTTP $FRONTEND_STATUS)"
fi

# Verificar API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$SERVER/api/health || echo "000")
if [ "$API_STATUS" = "200" ]; then
    echo "✅ API: OK (HTTP $API_STATUS)"
else
    echo "❌ API: Error (HTTP $API_STATUS)"
fi

# Verificar RSS
RSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$SERVER/api/rss/blog || echo "000")
if [ "$RSS_STATUS" = "200" ]; then
    echo "✅ RSS: OK (HTTP $RSS_STATUS)"
else
    echo "⚠️  RSS: Error (HTTP $RSS_STATUS)"
fi

echo ""
echo "🎉 Despliegue completado!"
echo "🌐 Frontend: https://$SERVER"
echo "🔌 API: https://$SERVER/api/health"
echo "📡 RSS: https://$SERVER/api/rss/blog"
echo ""
echo "📊 Para ver logs: ssh $USER@$SERVER 'pm2 logs megaverse-api'"
echo "🔧 Para reiniciar: ssh $USER@$SERVER 'pm2 restart megaverse-api'"
