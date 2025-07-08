# Script para reiniciar el servidor backend
# Ejecutar desde PowerShell en el directorio del servidor

# Detener procesos existentes de Node.js
Write-Host "Deteniendo procesos de Node.js..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Esperar un momento
Start-Sleep -Seconds 2

# Cambiar al directorio del servidor
Set-Location "d:\00 - DISEÑO\06 - Varios\Asociación\web\01 - Proyecto1\server"

# Iniciar el servidor
Write-Host "Iniciando servidor backend..."
node index.js
