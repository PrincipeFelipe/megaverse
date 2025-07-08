@echo off
echo Deteniendo procesos de Node.js...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Iniciando servidor backend...
cd /d "%~dp0"
node index.js
