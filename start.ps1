# Script de inicio para el proyecto Megaverse

$ErrorActionPreference = "Stop"

# Colores para la salida en PowerShell
function Write-ColorOutput($ForegroundColor) {
    # Guardar los colores actuales
    $fc = $host.UI.RawUI.ForegroundColor
    
    # Establecer los nuevos colores
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    
    # Devolver la función escribir (para ser pasada a Write-Output)
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    
    # Restaurar los colores originales
    $host.UI.RawUI.ForegroundColor = $fc
}

# Detectar la ruta de instalación de XAMPP
$xamppPaths = @(
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\Program Files\xampp\mysql\bin\mysql.exe",
    "D:\xampp\mysql\bin\mysql.exe"
)

$mysqlPath = $null
foreach ($path in $xamppPaths) {
    if (Test-Path $path) {
        $mysqlPath = $path
        break
    }
}

if ($null -eq $mysqlPath) {
    Write-ColorOutput Red "Error: No se pudo encontrar MySQL en las rutas de XAMPP habituales."
    Write-ColorOutput Yellow "Por favor, ingresa la ruta completa a mysql.exe:"
    $mysqlPath = Read-Host
    
    if (-not (Test-Path $mysqlPath)) {
        Write-ColorOutput Red "Error: La ruta proporcionada no es válida."
        exit 1
    }
}

try {
    Write-ColorOutput Green "Inicializando el proyecto Megaverse..."
    
    # 1. Crear la base de datos si no existe
    Write-ColorOutput Yellow "Creando la base de datos db_megaverse si no existe..."
    & $mysqlPath -u root -e "CREATE DATABASE IF NOT EXISTS db_megaverse;"
    Write-ColorOutput Green "Base de datos db_megaverse disponible."
    
    # 2. Instalar dependencias del servidor
    Write-ColorOutput Yellow "Instalando dependencias del backend..."
    Set-Location -Path server
    npm install
    Write-ColorOutput Green "Dependencias del servidor instaladas."
      # 3. Actualizar el archivo .env para usar la ruta de MySQL detectada
    Write-ColorOutput Yellow "Actualizando configuración en .env..."
    $envPath = Join-Path -Path $pwd -ChildPath ".env"
    $envContent = @"
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=db_megaverse
JWT_SECRET=megaverse_jwt_secret_key
JWT_EXPIRES_IN=7d
PORT=8080
MYSQL_PATH=$mysqlPath
"@
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    
    # 4. Actualizar el archivo de configuración de la base de datos para usar la ruta de MySQL
    $databaseConfigPath = Join-Path -Path $pwd -ChildPath "scripts\initDb.js"
    $dbContent = Get-Content -Path $databaseConfigPath -Raw
    $updatedDbContent = $dbContent -replace "^import mysql from 'mysql2/promise';", "import mysql from 'mysql2/promise';"
    Set-Content -Path $databaseConfigPath -Value $updatedDbContent -Encoding UTF8
    
    # 5. Inicializar la base de datos
    Write-ColorOutput Yellow "Inicializando las tablas y datos de la base de datos..."
    $env:MYSQL_PATH = $mysqlPath
    node scripts/initDb.js
    Write-ColorOutput Green "Base de datos inicializada correctamente."
    
    # 4. Iniciar el servidor en una nueva ventana
    Write-ColorOutput Yellow "Iniciando el servidor backend..."
    Start-Process -FilePath "pwsh.exe" -ArgumentList "-Command cd '$pwd'; npm run dev"
    Write-ColorOutput Green "Servidor iniciado en http://localhost:8090"
    
    # 5. Volver al directorio raíz e instalar dependencias del frontend si es necesario
    Set-Location -Path ..
    if (-not (Test-Path -Path "node_modules")) {
        Write-ColorOutput Yellow "Instalando dependencias del frontend..."
        npm install
        Write-ColorOutput Green "Dependencias del frontend instaladas."
    }
    
    # 6. Iniciar el frontend en una nueva ventana
    Write-ColorOutput Yellow "Iniciando la aplicación frontend..."
    Start-Process -FilePath "pwsh.exe" -ArgumentList "-Command cd '$pwd'; npm run dev"
    
    Write-ColorOutput Green "¡Proyecto inicializado correctamente!"
    Write-ColorOutput Yellow "Usuario admin: admin@megaverse.com"
    Write-ColorOutput Yellow "Contraseña: admin123"
    Write-ColorOutput Green "La aplicación estará disponible en http://localhost:5173"
}
catch {
    Write-ColorOutput Red "Error: $_"
    exit 1
}
