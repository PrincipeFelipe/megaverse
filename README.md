# MegaVerse - Aplicación para gestión de asociaciones

## Descripción
MegaVerse es una aplicación web para la gestión de mesas de juego, reservas y productos de una asociación. Permite a los usuarios:

- Registrarse e iniciar sesión
- Reservar mesas para juegos
- Ver productos disponibles
- Realizar consumos
- Administrar el inventario (rol administrador)
- Gestionar usuarios (rol administrador)

## Requisitos previos
- Node.js (v14+)
- MySQL (v8+)

## Documentación

- [Solución para problemas de zonas horarias en reservas](./docs/timezone-fix.md)
- [Implementación de react-big-calendar](./docs/react-big-calendar.md)

## Configuración inicial

### Base de datos
La aplicación utiliza MySQL con una base de datos llamada `db_megaverse`. La base de datos se creará automáticamente si no existe cuando ejecutes los scripts de inicialización.

### Variables de entorno
El backend utiliza las siguientes variables de entorno (archivo `.env` en la carpeta `server`):
- DB_HOST: Host de la base de datos (por defecto: localhost)
- DB_USER: Usuario de la base de datos (por defecto: root)
- DB_PASSWORD: Contraseña de la base de datos
- DB_DATABASE: Nombre de la base de datos (db_megaverse)
- JWT_SECRET: Clave secreta para generar tokens JWT
- PORT: Puerto donde se ejecutará el servidor (por defecto: 8090)

El frontend utiliza:
- VITE_API_URL: URL de la API del backend (por defecto: http://localhost:8090/api)

## Inicio rápido

### Para usuarios de XAMPP en Windows

Si estás usando XAMPP como servidor de MySQL:

1. Asegúrate de que el servicio MySQL de XAMPP esté iniciado
2. Ejecuta el script de inicio:

```powershell
.\start.ps1
```

El script detectará automáticamente la ubicación de MySQL en tu instalación de XAMPP. Si no puede encontrarla, te pedirá que ingreses la ruta manualmente (generalmente es `C:\xampp\mysql\bin\mysql.exe`).

### Para otros sistemas

Para iniciar la aplicación completa con un solo comando, utiliza:

```bash
# En Windows PowerShell (sin XAMPP):
.\start.ps1

# En Linux/macOS:
chmod +x ./start.sh
./start.sh
```

Este script realizará automáticamente:
1. Creará la base de datos si no existe
2. Instalará todas las dependencias
3. Inicializará la base de datos con datos de ejemplo
4. Iniciará el servidor backend y el cliente frontend

## Instalación manual
Si prefieres iniciar la aplicación paso a paso:

1. Crear la base de datos:
```sql
CREATE DATABASE db_megaverse;
```

2. Instalar dependencias del servidor:
```bash
cd server
npm install
```

3. Inicializar la base de datos:
```bash
node scripts/initDb.js
```

4. Iniciar el servidor:
```bash
npm run dev
```

5. En otra terminal, instalar dependencias del cliente e iniciarlo:
```bash
cd ..
npm install
npm run dev
```

## Credenciales de administrador por defecto
- Email: admin@megaverse.com
- Contraseña: admin123

## Funcionalidades implementadas

### Usuarios
- Registro de usuarios
- Inicio de sesión
- Perfil de usuario con saldo
- Roles de usuario (admin y usuario normal)

### Reservas
- Ver disponibilidad de mesas
- Crear reservas en horarios disponibles
- Cancelar reservas propias
- Vista de calendario de reservas

### Productos
- Catálogo de productos
- Compra de productos (reduce saldo y stock)
- Gestión del inventario (admin)

### Administración
- Panel de administración para gestionar usuarios
- Creación y edición de productos
- Gestión de mesas de juego
- Control de reservas

## Estructura de base de datos
La aplicación utiliza las siguientes tablas:

1. `users`: Almacena los datos de los usuarios
2. `products`: Catálogo de productos disponibles
3. `tables`: Mesas disponibles para reservar
4. `reservations`: Reservas de mesas
5. `consumptions`: Registro de consumos de productos

## Tecnologías utilizadas
- Frontend: React, TypeScript, Tailwind CSS, Framer Motion
- Backend: Node.js, Express, JWT
- Base de datos: MySQL

## Estructura del proyecto
- `/server`: Código del backend (API)
  - `/config`: Configuración de base de datos
  - `/controllers`: Lógica de negocio
  - `/middleware`: Middleware de autenticación
  - `/routes`: Rutas de la API
  - `/scripts`: Scripts de inicialización
- `/src`: Código del frontend
  - `/components`: Componentes reutilizables
  - `/contexts`: Contextos de React
  - `/pages`: Páginas de la aplicación
  - `/services`: Servicios para comunicación con la API
  - `/types`: Definiciones de tipos TypeScript

## Próximas mejoras
- Implementación de notificaciones
- Sistema de pagos online
- Estadísticas de uso
- Modo oscuro/claro
