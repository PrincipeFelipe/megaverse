@echo off
echo ========================================
echo   REINICIANDO SERVIDOR BACKEND
echo ========================================

echo.
echo 1. Deteniendo procesos de Node.js...
taskkill /f /im node.exe 2>nul

echo.
echo 2. Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo 3. Iniciando servidor backend...
echo.
node index.js

pause
