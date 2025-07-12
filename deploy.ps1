# Script de despliegue automatizado para MEGAVERSE (PowerShell)
# Uso: .\deploy.ps1 -Server "tu-servidor.com" -User "tu-usuario"

param(
    [string]$Server = "tu-servidor.com",
    [string]$User = "tu-usuario",
    [string]$RemotePath = "/var/www/vhosts/megaverse.com"
)

Write-Host "🚀 Iniciando despliegue de MEGAVERSE a $Server..." -ForegroundColor Green

# Verificar que Git está disponible
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

# Verificar rama actual
$branch = git branch --show-current
Write-Host "📍 Rama actual: $branch" -ForegroundColor Yellow

if ($branch -ne "main" -and $branch -ne "master") {
    $response = Read-Host "⚠️  No estás en la rama main/master. ¿Continuar? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Despliegue cancelado" -ForegroundColor Red
        exit 1
    }
}

# Verificar cambios sin commit
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  Hay cambios sin commit:" -ForegroundColor Yellow
    git status --short
    $response = Read-Host "¿Continuar de todos modos? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Despliegue cancelado" -ForegroundColor Red
        exit 1
    }
}

# Construir frontend
Write-Host "📦 Construyendo frontend..." -ForegroundColor Blue
npm run build

# Verificar que el build fue exitoso
if (-not (Test-Path "dist")) {
    Write-Host "❌ Error: No se pudo construir el frontend" -ForegroundColor Red
    exit 1
}

# Mostrar información de archivos
$frontendSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$backendSize = (Get-ChildItem -Path "server" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "📋 Archivos a desplegar:" -ForegroundColor Cyan
Write-Host "   Frontend: $([math]::Round($frontendSize, 2)) MB" -ForegroundColor White
Write-Host "   Backend: $([math]::Round($backendSize, 2)) MB" -ForegroundColor White

$response = Read-Host "🤔 ¿Continuar con el despliegue? (y/N)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "❌ Despliegue cancelado" -ForegroundColor Red
    exit 1
}

# Comandos para ejecutar via SSH (requiere que tengas SSH configurado)
Write-Host "📤 Para completar el despliegue, ejecuta estos comandos en tu servidor:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Subir archivos (usando SCP, FTP, o File Manager de Plesk):" -ForegroundColor Cyan
Write-Host "   - Sube el contenido de ./dist/ a $RemotePath/httpdocs/" -ForegroundColor White
Write-Host "   - Sube el contenido de ./server/ a $RemotePath/api/" -ForegroundColor White
Write-Host "   - Sube ./.htaccess a $RemotePath/httpdocs/" -ForegroundColor White
Write-Host ""
Write-Host "2. En el servidor, ejecuta:" -ForegroundColor Cyan
Write-Host "   cd $RemotePath/api" -ForegroundColor White
Write-Host "   npm install --production" -ForegroundColor White
Write-Host "   pm2 restart megaverse-api" -ForegroundColor White
Write-Host ""
Write-Host "3. Verificar el despliegue:" -ForegroundColor Cyan
Write-Host "   Frontend: https://$Server" -ForegroundColor White
Write-Host "   API: https://$Server/api/health" -ForegroundColor White
Write-Host "   RSS: https://$Server/api/rss/blog" -ForegroundColor White

Write-Host ""
Write-Host "✅ Archivos preparados para despliegue!" -ForegroundColor Green
