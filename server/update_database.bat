@echo off
echo Ejecutando actualización de la base de datos...
cd /d "d:\00 - DISEÑO\06 - Varios\Asociación\web\01 - Proyecto1\server"
node scripts/apply_db_update.js
pause
