/** PM2 — API + WhatsApp 24/7 en el VPS. Uso: pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: 'motobrain-api',
      cwd: __dirname,
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      max_restarts: 15,
      min_uptime: '10s',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
