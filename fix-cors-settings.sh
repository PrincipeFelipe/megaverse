#!/bin/bash
# fix-cors-settings.sh - Script para solucionar problemas de CORS en Megaverse
# Uso: bash fix-cors-settings.sh [frontend_url] [backend_url]
# Ejemplo: bash fix-cors-settings.sh https://clubmegaverse.com http://localhost:3000

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

# Registro
LOG_FILE="cors-fix-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo -e "${BLUE}=== Herramienta de diagnóstico y solución de problemas CORS para Megaverse ===${NC}"
echo "Fecha: $(date)"
echo "Registrando en: $LOG_FILE"
echo ""

# Valores predeterminados
FRONTEND_URL=${1:-"https://clubmegaverse.com"}
BACKEND_URL=${2:-"http://localhost:3000"}
NGINX_CONFIG="/etc/nginx/sites-available/megaverse"
NGINX_ENABLED="/etc/nginx/sites-enabled/megaverse"
API_DIR="/var/www/megaverse/backend"
ENV_FILE="/var/www/megaverse/repo/.env.production"

# Comprobar si se está ejecutando como root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}⚠️ Aviso: No estás ejecutando este script como root.${NC}"
  echo -e "${YELLOW}Algunas comprobaciones y correcciones pueden fallar.${NC}"
  echo -e "${YELLOW}Considera ejecutar con: sudo bash $0${NC}"
  echo ""
fi

# Función de comprobación
function check_step() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1${NC}"
  else
    echo -e "${RED}✗ $1${NC}"
    echo -e "${YELLOW}  Solución sugerida: $2${NC}"
  fi
}

echo -e "${BLUE}=== Comprobando la configuración del frontend ===${NC}"

# Verificar configuración .env
if [ -f "$ENV_FILE" ]; then
  echo "Verificando $ENV_FILE..."
  API_URL=$(grep "VITE_API_URL" "$ENV_FILE" | cut -d= -f2)
  SITE_URL=$(grep "VITE_SITE_URL" "$ENV_FILE" | cut -d= -f2)
  
  echo "API_URL configurada: $API_URL"
  echo "SITE_URL configurada: $SITE_URL"
  
  # Comprobar si las URLs son correctas
  if [[ "$API_URL" == *"$FRONTEND_URL"* ]]; then
    echo -e "${GREEN}✓ API_URL correcta${NC}"
  else
    echo -e "${RED}✗ API_URL incorrecta${NC}"
    echo -e "${YELLOW}  Sugerencia: Actualiza VITE_API_URL=$FRONTEND_URL/api en $ENV_FILE${NC}"
  fi
else
  echo -e "${RED}✗ Archivo .env.production no encontrado${NC}"
  echo -e "${YELLOW}  Sugerencia: Crea el archivo $ENV_FILE con las variables necesarias${NC}"
fi

echo ""
echo -e "${BLUE}=== Comprobando la configuración de Nginx ===${NC}"

# Verificar configuración de Nginx
if [ -f "$NGINX_CONFIG" ]; then
  echo "Analizando configuración de Nginx..."
  
  # Comprobar si existe la configuración de CORS
  if grep -q "Access-Control-Allow-Origin" "$NGINX_CONFIG"; then
    echo -e "${GREEN}✓ Encabezados CORS configurados en Nginx${NC}"
    
    # Comprobar si los orígenes son correctos
    CORS_ORIGIN=$(grep "Access-Control-Allow-Origin" "$NGINX_CONFIG" | head -1 | awk '{print $2}' | tr -d "';")
    echo "Origin configurado: $CORS_ORIGIN"
    
    if [[ "$CORS_ORIGIN" == "*" ]]; then
      echo -e "${YELLOW}⚠️ Aviso: CORS está configurado con wildcard (*) - Considere restringirlo por seguridad${NC}"
    elif [[ "$CORS_ORIGIN" != *"$FRONTEND_URL"* && "$CORS_ORIGIN" != "*" ]]; then
      echo -e "${RED}✗ Origen CORS no coincide con la URL del frontend${NC}"
      echo -e "${YELLOW}  Sugerencia: Actualiza Access-Control-Allow-Origin para incluir $FRONTEND_URL${NC}"
    fi
  else
    echo -e "${RED}✗ No se encontraron encabezados CORS en Nginx${NC}"
    echo -e "${YELLOW}  Sugerencia: Añade los encabezados CORS en la sección location /api/ en $NGINX_CONFIG${NC}"
    
    # Ofrecer arreglar la configuración
    read -p "¿Deseas añadir automáticamente la configuración CORS a Nginx? (s/n): " ADD_CORS
    if [[ "$ADD_CORS" == "s" || "$ADD_CORS" == "S" ]]; then
      # Crear respaldo
      cp "$NGINX_CONFIG" "${NGINX_CONFIG}.bak"
      check_step "Crear respaldo de configuración Nginx" "Crea una copia manualmente: cp $NGINX_CONFIG ${NGINX_CONFIG}.bak"
      
      # Buscar la sección location /api/
      if grep -q "location /api/" "$NGINX_CONFIG"; then
        # Agregar la configuración CORS
        sed -i "/location \/api\// {
          :a
          n
          /}/!ba
          i\\
    # Configuración CORS\\
    add_header 'Access-Control-Allow-Origin' '$FRONTEND_URL' always;\\
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;\\
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;\\
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;\\
\\
    # Manejar las solicitudes OPTIONS (preflight)\\
    if (\$request_method = 'OPTIONS') {\\
        add_header 'Access-Control-Allow-Origin' '$FRONTEND_URL' always;\\
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;\\
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;\\
        add_header 'Access-Control-Max-Age' 1728000 always;\\
        add_header 'Content-Type' 'text/plain; charset=utf-8' always;\\
        add_header 'Content-Length' 0 always;\\
        return 204;\\
    }
        }" "$NGINX_CONFIG"
        
        check_step "Añadir configuración CORS a Nginx" "Edita manualmente $NGINX_CONFIG e incluye los encabezados CORS"
      else
        echo -e "${RED}✗ No se encontró la sección 'location /api/' en la configuración de Nginx${NC}"
        echo -e "${YELLOW}  Solución sugerida: Edita manualmente $NGINX_CONFIG y añade la configuración CORS${NC}"
      fi
    fi
  fi
  
  # Verificar que el archivo de configuración está habilitado
  if [ -f "$NGINX_ENABLED" ] || [ -L "$NGINX_ENABLED" ]; then
    echo -e "${GREEN}✓ Configuración de Nginx está habilitada${NC}"
  else
    echo -e "${RED}✗ Configuración de Nginx no está habilitada${NC}"
    echo -e "${YELLOW}  Sugerencia: Habilita la configuración con: sudo ln -s $NGINX_CONFIG $NGINX_ENABLED${NC}"
  fi
  
  # Verificar sintaxis de la configuración
  nginx -t
  check_step "Sintaxis de configuración de Nginx" "Revisa y corrige los errores de sintaxis en $NGINX_CONFIG"
  
else
  echo -e "${RED}✗ No se encontró el archivo de configuración de Nginx${NC}"
  echo -e "${YELLOW}  Sugerencia: Crea el archivo de configuración en $NGINX_CONFIG${NC}"
fi

echo ""
echo -e "${BLUE}=== Comprobando la configuración del backend ===${NC}"

# Verificar configuración CORS en la API
if [ -d "$API_DIR" ]; then
  echo "Analizando configuración de la API..."
  
  # Comprobar si el paquete cors está instalado
  if [ -f "$API_DIR/package.json" ] && grep -q '"cors"' "$API_DIR/package.json"; then
    echo -e "${GREEN}✓ Paquete cors instalado${NC}"
    
    # Buscar implementación de CORS en archivos principales
    if grep -r -l --include="*.js" --include="*.cjs" "cors(" "$API_DIR" | head -1; then
      echo -e "${GREEN}✓ Implementación de CORS encontrada en la API${NC}"
    else
      echo -e "${YELLOW}⚠️ No se encontró implementación de CORS en archivos JavaScript${NC}"
      echo -e "${YELLOW}  Sugerencia: Verifica la implementación de CORS en tu API${NC}"
    fi
  else
    echo -e "${RED}✗ Paquete cors no instalado en la API${NC}"
    echo -e "${YELLOW}  Sugerencia: Instala cors con: cd $API_DIR && npm install cors${NC}"
    
    # Ofrecer instalar cors
    read -p "¿Deseas instalar el paquete cors ahora? (s/n): " INSTALL_CORS
    if [[ "$INSTALL_CORS" == "s" || "$INSTALL_CORS" == "S" ]]; then
      cd "$API_DIR" && npm install cors
      check_step "Instalar paquete cors" "Instala manualmente: cd $API_DIR && npm install cors"
    fi
  fi
else
  echo -e "${RED}✗ Directorio de la API no encontrado${NC}"
  echo -e "${YELLOW}  Sugerencia: Verifica la ruta del directorio de la API${NC}"
fi

echo ""
echo -e "${BLUE}=== Probando configuración CORS ===${NC}"

# Verificar si curl está instalado
if command -v curl &> /dev/null; then
  echo "Realizando prueba con curl..."
  echo "Probando solicitud OPTIONS a $FRONTEND_URL/api/auth/login..."
  
  curl -s -I -X OPTIONS "$FRONTEND_URL/api/auth/login" -H "Origin: $FRONTEND_URL" | grep -i "access-control"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ El servidor está respondiendo con encabezados CORS${NC}"
  else
    echo -e "${RED}✗ No se encontraron encabezados CORS en la respuesta${NC}"
    echo -e "${YELLOW}  Sugerencia: Verifica que Nginx esté correctamente configurado y reinicia el servicio${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ curl no está instalado, no se puede realizar la prueba${NC}"
  echo -e "${YELLOW}  Sugerencia: Instala curl con: sudo apt install curl${NC}"
fi

echo ""
echo -e "${BLUE}=== Acciones recomendadas ===${NC}"

# Recopilar recomendaciones basadas en los resultados
recommendations=()

if [ -f "$NGINX_CONFIG" ] && (! grep -q "Access-Control-Allow-Origin" "$NGINX_CONFIG"); then
  recommendations+=("Configurar encabezados CORS en Nginx y reiniciar el servicio")
fi

if [ -d "$API_DIR" ] && [ -f "$API_DIR/package.json" ] && (! grep -q '"cors"' "$API_DIR/package.json"); then
  recommendations+=("Instalar y configurar el paquete cors en la API")
fi

if [ -f "$ENV_FILE" ] && ! grep -q "VITE_API_URL=$FRONTEND_URL/api" "$ENV_FILE"; then
  recommendations+=("Actualizar las variables de entorno en $ENV_FILE")
fi

# Mostrar recomendaciones
if [ ${#recommendations[@]} -eq 0 ]; then
  echo -e "${GREEN}✓ No se detectaron problemas críticos en la configuración CORS${NC}"
  echo "Si aún experimentas problemas, verifica:"
  echo "  - Que la API esté correctamente implementando CORS"
  echo "  - Que no haya redirecciones que pierdan los encabezados CORS"
  echo "  - Que no haya problemas con las credenciales (cookies/auth tokens)"
else
  echo -e "${YELLOW}Se recomienda realizar las siguientes acciones:${NC}"
  for i in "${!recommendations[@]}"; do
    echo -e "${YELLOW}$(($i+1)). ${recommendations[$i]}${NC}"
  done
fi

echo ""
echo -e "${BLUE}=== Resumen ===${NC}"
echo "Los resultados completos se han guardado en: $LOG_FILE"
echo "Consulta docs/solucion-problemas-cors.md para más información sobre CORS"

# Ofrecer reiniciar Nginx si se han hecho cambios
if [[ "$ADD_CORS" == "s" || "$ADD_CORS" == "S" ]]; then
  echo ""
  read -p "¿Deseas reiniciar Nginx para aplicar los cambios? (s/n): " RESTART_NGINX
  if [[ "$RESTART_NGINX" == "s" || "$RESTART_NGINX" == "S" ]]; then
    systemctl restart nginx
    check_step "Reiniciar Nginx" "Reinicia manualmente: sudo systemctl restart nginx"
  fi
fi

echo ""
echo -e "${GREEN}¡Análisis completado!${NC}"
