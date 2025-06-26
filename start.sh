#!/bin/bash

# Colores para salida de terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sin color

echo -e "${GREEN}Inicializando el proyecto Megaverse...${NC}"

# Detectar si estamos en Windows (XAMPP) o en un sistema Unix
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Estamos en Windows
    # Buscar en las rutas típicas de XAMPP
    XAMPP_PATHS=(
        "C:/xampp/mysql/bin/mysql.exe"
        "C:/Program Files/xampp/mysql/bin/mysql.exe"
        "D:/xampp/mysql/bin/mysql.exe"
    )
    
    MYSQL_PATH=""
    for path in "${XAMPP_PATHS[@]}"; do
        if [ -f "$path" ]; then
            MYSQL_PATH="$path"
            break
        fi
    done
    
    if [ -z "$MYSQL_PATH" ]; then
        echo -e "${RED}Error: No se pudo encontrar MySQL en las rutas de XAMPP habituales.${NC}"
        echo -e "${YELLOW}Por favor, ingresa la ruta completa a mysql.exe:${NC}"
        read MYSQL_PATH
        
        if [ ! -f "$MYSQL_PATH" ]; then
            echo -e "${RED}Error: La ruta proporcionada no es válida.${NC}"
            exit 1
        fi
    fi
    
    # Comprobar si la base de datos existe
    echo -e "${YELLOW}Creando la base de datos db_megaverse si no existe...${NC}"
    "$MYSQL_PATH" -u root -e "CREATE DATABASE IF NOT EXISTS db_megaverse;"
else
    # Estamos en un sistema Unix (Linux/macOS)
    # Comprobar si el comando mysql está disponible
    if ! command -v mysql &> /dev/null; then
        echo -e "${RED}Error: El comando 'mysql' no está disponible.${NC}"
        echo -e "${YELLOW}Por favor, instala MySQL o MariaDB antes de continuar.${NC}"
        exit 1
    fi
    
    MYSQL_PATH="mysql"
    
    # Comprobar si la base de datos existe
    echo -e "${YELLOW}Creando la base de datos db_megaverse si no existe...${NC}"
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS db_megaverse;"
fi

echo -e "${GREEN}Base de datos db_megaverse disponible.${NC}"

# Instalar dependencias del servidor
echo -e "${YELLOW}Instalando dependencias del backend...${NC}"
cd server
npm install
echo -e "${GREEN}Dependencias del servidor instaladas.${NC}"

# Inicializar la base de datos
echo -e "${YELLOW}Inicializando las tablas y datos de la base de datos...${NC}"
node scripts/initDb.js
echo -e "${GREEN}Base de datos inicializada correctamente.${NC}"

# Iniciar el servidor
echo -e "${YELLOW}Iniciando el servidor backend...${NC}"
npm run dev &
echo -e "${GREEN}Servidor iniciado en http://localhost:8090${NC}"

# Volver al directorio raíz
cd ..

# Instalar dependencias del frontend si no están instaladas
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Instalando dependencias del frontend...${NC}"
  npm install
  echo -e "${GREEN}Dependencias del frontend instaladas.${NC}"
fi

# Iniciar el frontend
echo -e "${YELLOW}Iniciando la aplicación frontend...${NC}"
npm run dev &
echo -e "${GREEN}Frontend iniciado en http://localhost:5173${NC}"

echo -e "${GREEN}¡Proyecto inicializado correctamente!${NC}"
echo -e "${YELLOW}Usuario admin: admin@megaverse.com${NC}"
echo -e "${YELLOW}Contraseña: admin123${NC}"
echo -e "${GREEN}La aplicación está disponible en http://localhost:5173${NC}"
