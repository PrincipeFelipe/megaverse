#!/bin/bash

# Script de backup para MEGAVERSE
# Uso: ./backup.sh [servidor] [usuario]

SERVER=${1:-"tu-servidor.com"}
USER=${2:-"tu-usuario"}
REMOTE_PATH="/var/www/vhosts/megaverse.com"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Iniciando backup de MEGAVERSE desde $SERVER..."

# Crear directorio local de backups
mkdir -p $BACKUP_DIR

# Backup de base de datos
echo "🗄️  Haciendo backup de base de datos..."
ssh $USER@$SERVER "
    mysqldump -u \$DB_USER -p\$DB_PASSWORD db_megaverse > /tmp/db_backup_$DATE.sql
"

# Descargar backup de BD
scp $USER@$SERVER:/tmp/db_backup_$DATE.sql $BACKUP_DIR/

# Backup de uploads
echo "📁 Haciendo backup de archivos subidos..."
ssh $USER@$SERVER "
    cd $REMOTE_PATH/api
    tar -czf /tmp/uploads_backup_$DATE.tar.gz uploads/
"

# Descargar backup de uploads
scp $USER@$SERVER:/tmp/uploads_backup_$DATE.tar.gz $BACKUP_DIR/

# Backup de configuración
echo "⚙️  Haciendo backup de configuración..."
scp $USER@$SERVER:$REMOTE_PATH/api/.env $BACKUP_DIR/env_backup_$DATE

# Limpiar archivos temporales en servidor
ssh $USER@$SERVER "
    rm -f /tmp/db_backup_$DATE.sql
    rm -f /tmp/uploads_backup_$DATE.tar.gz
"

# Comprimir todo
echo "📦 Comprimiendo backup..."
cd $BACKUP_DIR
tar -czf megaverse_backup_$DATE.tar.gz db_backup_$DATE.sql uploads_backup_$DATE.tar.gz env_backup_$DATE
rm db_backup_$DATE.sql uploads_backup_$DATE.tar.gz env_backup_$DATE

echo "✅ Backup completado: $BACKUP_DIR/megaverse_backup_$DATE.tar.gz"

# Limpiar backups antiguos (mantener últimos 10)
ls -t megaverse_backup_*.tar.gz | tail -n +11 | xargs -r rm

echo "📋 Backups disponibles:"
ls -lh megaverse_backup_*.tar.gz
