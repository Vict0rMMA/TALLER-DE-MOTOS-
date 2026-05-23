/** PM2 — API + WhatsApp 24/7 en el VPS. Uso: pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: 'motobrain-api',
      cwd: __dirname,
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 15,
      min_uptime: '10s',
      watch: false,
      max_memory_restart: '750M',
      env: {
        NODE_ENV: 'production',
        /** Límite heap Node; Chrome va aparte pero evita que Node se coma la RAM. */
        NODE_OPTIONS: '--max-old-space-size=384',
        WHATSAPP_LAZY_START: 'true',
      },
    },
  ],
};
