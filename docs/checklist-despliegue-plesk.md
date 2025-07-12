# 📋 Checklist de Despliegue MEGAVERSE en Plesk

Este documento presenta la lista de verificación para el despliegue del proyecto MEGAVERSE en un servidor con panel Plesk.

El código fuente del proyecto está disponible en: https://github.com/PrincipeFelipe/megaverse

## ✅ Preparación Local

- [✅] **Código actualizado y probado**
  - [✅] Todas las funcionalidades funcionan en desarrollo
  - [✅] Blog público accesible sin autenticación
  - [✅] RSS feed funcionando correctamente
  - [✅] SweetAlert funcionando en panel de administración

- [ ] **Variables de entorno configuradas**
  - [ ] `.env.production` creado con tu dominio
  - [ ] `server/.env.production` configurado
  - [ ] JWT_SECRET cambiado por uno seguro

- [ ] **Build preparado**
  - [ ] `npm run build` ejecutado exitosamente
  - [ ] Carpeta `dist/` generada correctamente

## ✅ Configuración del Servidor Plesk

### 🔧 Panel de Control Plesk

- [ ] **Dominio configurado**
  - [ ] Dominio apuntando al servidor
  - [ ] SSL/HTTPS configurado (Let's Encrypt o certificado propio)
  - [ ] DNS propagado correctamente

- [ ] **Node.js habilitado**
  - [ ] Node.js activado en el panel de Plesk
  - [ ] Versión 18.x o superior seleccionada
  - [ ] Directorio de aplicación: `/api`
  - [ ] Archivo de inicio: `index.js`

### 🗄️ Base de Datos

- [ ] **MySQL configurada**
  - [ ] Base de datos `db_megaverse` creada
  - [ ] Usuario de BD con permisos completos
  - [ ] Esquema/datos importados (si migrando)
  - [ ] Conexión probada

### 📁 Estructura de Archivos

- [ ] **Directorios creados**
  ```
  /httpdocs/              ← Frontend (contenido de dist/)
  /api/                   ← Backend (contenido de server/)
  /api/uploads/           ← Archivos subidos
  /api/uploads/avatars/   ← Avatares de usuarios
  /api/uploads/blog/      ← Imágenes del blog
  /api/uploads/documents/ ← Documentos
  /api/logs/              ← Logs de PM2
  ```

- [ ] **Permisos configurados**
  - [ ] `chmod 755` en directorios uploads/
  - [ ] Propietario correcto de archivos

## ✅ Despliegue de Archivos

### 📤 Frontend

- [ ] **Archivos subidos**
  - [ ] Contenido de `dist/` → `/httpdocs/`
  - [ ] `.htaccess` → `/httpdocs/.htaccess`
  - [ ] Archivos estáticos accesibles

### 📤 Backend

- [ ] **Aplicación Node.js**
  - [ ] Contenido de `server/` → `/api/`
  - [ ] `ecosystem.config.js` en `/api/`
  - [ ] `.env.production` → `.env` en `/api/`

- [ ] **Dependencias instaladas**
  - [ ] `npm install --production` ejecutado
  - [ ] Todas las dependencias instaladas correctamente

## ✅ Configuración de Servicios

### ⚙️ Variables de Entorno en Plesk

```
NODE_ENV=production
PORT=3000
JWT_SECRET=tu_jwt_secret_super_seguro
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_NAME=db_megaverse
SITE_URL=https://tudominio.com
```

### 🔄 PM2 (Gestor de Procesos)

- [ ] **PM2 instalado**
  - [ ] `npm install -g pm2`
  - [ ] PM2 configurado para autostart

- [ ] **Aplicación iniciada**
  - [ ] `pm2 start ecosystem.config.js`
  - [ ] `pm2 save`
  - [ ] `pm2 startup` configurado

### 🌐 Proxy Reverso

- [ ] **Apache/Nginx configurado**
  - [ ] `/api/*` → `http://localhost:3000/*`
  - [ ] SPA routing configurado
  - [ ] Headers de seguridad añadidos

## ✅ Verificación del Despliegue

### 🔍 Tests Básicos

- [ ] **Frontend**
  - [ ] `https://tudominio.com` carga correctamente
  - [ ] React Router funciona (navegación interna)
  - [ ] Estilos CSS aplicados correctamente

- [ ] **API**
  - [ ] `https://tudominio.com/api/health` responde 200
  - [ ] Login de usuarios funciona
  - [ ] Endpoints de autenticación operativos

- [ ] **Blog Público**
  - [ ] `https://tudominio.com/blog` accesible sin login
  - [ ] Lista de posts carga correctamente
  - [ ] Posts individuales accesibles

- [ ] **RSS Feed**
  - [ ] `https://tudominio.com/api/rss/blog` genera XML válido
  - [ ] Contiene posts publicados
  - [ ] XML bien formado

### 🛠️ Tests Avanzados

- [ ] **Funcionalidades del Dashboard**
  - [ ] Login/logout funciona
  - [ ] Panel de administración accesible
  - [ ] CRUD de posts del blog operativo

- [ ] **Subida de Archivos**
  - [ ] Avatares se suben correctamente
  - [ ] Imágenes del blog funcionan
  - [ ] Permisos de archivos correctos

- [ ] **Automatización**
  - [ ] RSS feed accesible para Make
  - [ ] Headers CORS configurados
  - [ ] Cache funcionando
  
- [ ] **Integración con GitHub**
  - [ ] Repositorio actualizado: https://github.com/PrincipeFelipe/megaverse
  - [ ] Scripts de despliegue configurados (si aplica)
  - [ ] Webhook para CI/CD (opcional)

## ✅ Monitoreo y Mantenimiento

### 📊 Logs y Debugging

- [ ] **Logs configurados**
  - [ ] PM2 logs accesibles: `pm2 logs megaverse-api`
  - [ ] Logs de errores separados
  - [ ] Rotación de logs configurada

### 🔧 Comandos Útiles

```bash
# Status de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs megaverse-api --lines 100

# Reiniciar aplicación
pm2 restart megaverse-api

# Monitoreo
pm2 monit
```

### 📋 Backup

- [ ] **Estrategia de backup**
  - [ ] Base de datos respaldada
  - [ ] Archivos uploads respaldados
  - [ ] Configuración respaldada
  - [ ] Script de backup automatizado

## 🚨 Troubleshooting

### Problemas Comunes

- [ ] **Error 500 API**
  - [ ] Verificar logs PM2
  - [ ] Comprobar variables de entorno
  - [ ] Verificar conexión BD

- [ ] **Frontend no carga**
  - [ ] Verificar .htaccess
  - [ ] Comprobar proxy reverso
  - [ ] Revisar paths de archivos estáticos

- [ ] **CORS Errors**
  - [ ] Verificar SITE_URL en .env
  - [ ] Comprobar configuración CORS
  - [ ] Verificar headers de respuesta

## 🎉 Despliegue Completado

- [ ] **Verificación final**
  - [ ] Todos los tests pasados
  - [ ] Monitoreo configurado
  - [ ] Backup configurado
  - [ ] Documentación actualizada

- [ ] **Comunicación**
  - [ ] Equipo notificado del despliegue
  - [ ] URLs de producción compartidas
  - [ ] Procedimientos de emergencia documentados

---

**URLs de Producción:**
- 🌐 Frontend: https://tudominio.com
- 🔌 API: https://tudominio.com/api/health
- 📱 Blog: https://tudominio.com/blog
- 📡 RSS: https://tudominio.com/api/rss/blog
- 👤 Admin: https://tudominio.com/admin

¡MEGAVERSE listo en producción! 🚀
