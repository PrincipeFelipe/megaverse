# Solución de problemas CORS en Megaverse

Este documento proporciona instrucciones detalladas para resolver problemas de CORS (Cross-Origin Resource Sharing) en la aplicación Megaverse.

## ¿Qué es CORS?

CORS (Intercambio de Recursos de Origen Cruzado) es un mecanismo de seguridad implementado por los navegadores que bloquea las solicitudes HTTP realizadas desde un origen (dominio, puerto o protocolo) a otro origen diferente.

## Síntomas de problemas CORS

Los errores típicos en la consola del navegador incluyen:

```
Solicitud desde otro origen bloqueada: la política de mismo origen impide leer el recurso remoto en https://api.example.com/endpoint. (Razón: falta el encabezado CORS 'Access-Control-Allow-Origin').
```

```
Solicitud de origen cruzado bloqueada: La misma política de origen no permite la lectura de recursos remotos en https://api.example.com/endpoint.
```

## Soluciones

### 1. Configuración en el servidor Nginx

El enfoque más robusto es configurar los encabezados CORS en Nginx:

```nginx
location /api/ {
    proxy_pass http://localhost:3000/;
    # Configuración proxy estándar...
    
    # Configuración CORS
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

    # Manejar las solicitudes OPTIONS (preflight)
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Max-Age' 1728000 always;
        add_header 'Content-Type' 'text/plain; charset=utf-8' always;
        add_header 'Content-Length' 0 always;
        return 204;
    }
}
```

> **NOTA**: Reemplaza `*` con los dominios específicos en producción (por ejemplo, `https://clubmegaverse.com`)

### 2. Configuración en la API de Node.js

Si aún experimentas problemas o necesitas una configuración más específica:

1. Instala el paquete CORS:

```bash
npm install cors
```

2. Configura CORS en tu aplicación Express:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Configuración básica
app.use(cors());

// O configuración avanzada
const corsOptions = {
  origin: [
    'https://clubmegaverse.com',
    'http://localhost:5173' // Para desarrollo
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Si necesitas enviar cookies
};

app.use(cors(corsOptions));
```

Para aplicaciones que usan ESM (módulos ES):

```javascript
import express from 'express';
import cors from 'cors';
const app = express();

app.use(cors({
  origin: 'https://clubmegaverse.com',
  // otras opciones...
}));
```

### 3. Soluciones para problemas específicos

#### Credenciales (cookies/auth)

Si necesitas enviar cookies o credenciales:

1. En el servidor:
```javascript
app.use(cors({
  origin: 'https://clubmegaverse.com',
  credentials: true
}));
```

2. En el cliente (fetch):
```javascript
fetch('https://api.clubmegaverse.com/endpoint', {
  credentials: 'include'
});
```

3. En Axios:
```javascript
axios.get('https://api.clubmegaverse.com/endpoint', {
  withCredentials: true
});
```

#### Problemas con encabezados personalizados

Si utilizas encabezados personalizados, asegúrate de incluirlos en la lista de `Access-Control-Allow-Headers`.

### 4. Verificación y pruebas

Para verificar si los encabezados CORS se están enviando correctamente:

```bash
curl -I -X OPTIONS https://clubmegaverse.com/api/auth/login -H "Origin: https://clubmegaverse.com"
```

La respuesta debería incluir:
```
Access-Control-Allow-Origin: https://clubmegaverse.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
...
```

## Consideraciones de seguridad

- En producción, **nunca** uses `Access-Control-Allow-Origin: *` para APIs que manejan datos sensibles o autenticación
- Especifica siempre los orígenes exactos permitidos
- Limita los métodos y encabezados a los que realmente necesitas
- Considera usar un tiempo razonable para `Access-Control-Max-Age` para reducir las solicitudes preflight

## Problemas comunes y soluciones

1. **Problema**: CORS funciona en desarrollo pero no en producción
   **Solución**: Verifica la configuración de Nginx y asegúrate de que las URLs en los archivos .env coincidan con el dominio de producción

2. **Problema**: Las solicitudes GET funcionan, pero POST/PUT/DELETE fallan
   **Solución**: Asegúrate de manejar correctamente las solicitudes OPTIONS (preflight)

3. **Problema**: Error de CORS incluso con la configuración correcta
   **Solución**: Comprueba si hay redirecciones que puedan estar perdiendo los encabezados CORS

4. **Problema**: Las cookies no se envían
   **Solución**: Configura `credentials: true` en el servidor y `withCredentials: true` en el cliente

## Recursos adicionales

- [MDN: Intercambio de Recursos de Origen Cruzado (CORS)](https://developer.mozilla.org/es/docs/Web/HTTP/CORS)
- [Documentación de cors en npm](https://www.npmjs.com/package/cors)
- [Configuración CORS en Nginx](https://enable-cors.org/server_nginx.html)
