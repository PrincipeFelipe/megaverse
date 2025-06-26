#!/bin/bash

# Este script inicializa el proyecto MegaVerse

echo "Inicializando el proyecto Megaverse..."

# Crear la base de datos
echo "Creando la base de datos..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS db_megaverse;"
echo "Base de datos creada o ya existía."

# Instalar dependencias del servidor
echo "Instalando dependencias del servidor..."
cd server
npm install
echo "Dependencias del servidor instaladas."

# Inicializar la base de datos
echo "Inicializando la base de datos..."
node scripts/initDb.js
echo "Base de datos inicializada."

# Volver al directorio raíz
cd ..

# Iniciar el servidor en segundo plano
echo "Iniciando el servidor en segundo plano..."
cd server
npm run dev &
echo "Servidor iniciado en puerto 8090."

cd ..
echo "Proyecto inicializado correctamente."
echo "Usuario admin: admin@megaverse.com"
echo "Contraseña: admin123"

echo "Puedes ejecutar 'cd ../.. && npm run dev' para iniciar el cliente frontend."
