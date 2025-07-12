module.exports = {
  apps: [{
    name: 'megaverse-api',
    script: 'index.js',
    // === MODIFICA ESTAS LÍNEAS ===
    instances: 1, // Asegúrate de que solo haya 1 instancia
    exec_mode: "fork", // ¡Esto es crucial! Cambia a modo fork para un solo proceso
    // =============================
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    interpreter: "/usr/bin/node",
    interpreter_args: "--require=dotenv/config --experimental-modules --es-module-specifier-resolution=node",
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '../private/logs/app-err.log',
    out_file: '../private/logs/app-out.log'
  }]
};
