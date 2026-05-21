/**
 * PM2 — API + WhatsApp 24/7 en el VPS.
 * Instalación: bash scripts/vps-install-service.sh
 */
module.exports = {
  apps: [
    {
      name: 'motobrain-api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 50,
      min_uptime: '10s',
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
