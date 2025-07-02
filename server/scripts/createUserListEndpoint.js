import fs from 'fs';
import path from 'path';

// Ruta al archivo de rutas de usuarios
const usersRouterPath = path.resolve('./routes/users.js');

// Verificar si el archivo existe
if (!fs.existsSync(usersRouterPath)) {
  console.error('El archivo de rutas de usuarios no existe en', usersRouterPath);
  process.exit(1);
}

// Leer el archivo
let content = fs.readFileSync(usersRouterPath, 'utf8');

// Verificar si ya existe la ruta
if (content.includes('/list-for-selection')) {
  console.log('La ruta /list-for-selection ya existe en el archivo.');
  process.exit(0);
}

// Agregar la nueva ruta después de router.get('/', isAdmin, userController.getAllUsers);
content = content.replace(
  'router.get(\'/\', isAdmin, userController.getAllUsers);',
  'router.get(\'/\', isAdmin, userController.getAllUsers);\nrouter.get(\'/list-for-selection\', userController.getUsersForSelection);'
);

// Escribir el archivo actualizado
fs.writeFileSync(usersRouterPath, content, 'utf8');

console.log('Se ha agregado la ruta /list-for-selection correctamente.');
