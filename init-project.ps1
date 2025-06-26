# Inicialización del proyecto MegaVerse

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
    Write-Host "Error: No se pudo encontrar MySQL en las rutas de XAMPP habituales." -ForegroundColor Red
    Write-Host "Por favor, ingresa la ruta completa a mysql.exe:" -ForegroundColor Yellow
    $mysqlPath = Read-Host
    
    if (-not (Test-Path $mysqlPath)) {
        Write-Host "Error: La ruta proporcionada no es válida." -ForegroundColor Red
        exit 1
    }
}

# Crear la base de datos
Write-Host "Creando la base de datos..." -ForegroundColor Green
& $mysqlPath -u root -e "CREATE DATABASE IF NOT EXISTS db_megaverse;"
Write-Host "Base de datos creada o ya existía." -ForegroundColor Green

# Instalar dependencias del servidor
Write-Host "Instalando dependencias del servidor..." -ForegroundColor Green
Set-Location -Path .\server
npm install
Write-Host "Dependencias del servidor instaladas." -ForegroundColor Green

# Inicializar la base de datos
Write-Host "Inicializando la base de datos..." -ForegroundColor Green
node .\scripts\initDb.js
Write-Host "Base de datos inicializada." -ForegroundColor Green

# Volver al directorio raíz
Set-Location -Path ..

# Iniciar el servidor
Write-Host "Iniciando el servidor..." -ForegroundColor Green
Start-Process -FilePath "pwsh.exe" -ArgumentList "-Command cd $pwd\server; npm run dev"
Write-Host "Servidor iniciado en puerto 8090." -ForegroundColor Green

Write-Host "Proyecto inicializado correctamente." -ForegroundColor Green
Write-Host "Usuario admin: admin@megaverse.com" -ForegroundColor Cyan
Write-Host "Contraseña: admin123" -ForegroundColor Cyan

Write-Host "Puedes ejecutar 'npm run dev' para iniciar el cliente frontend." -ForegroundColor Yellow
