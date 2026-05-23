#!/bin/bash
# Ejecutar EN EL VPS (una sola vez después de git pull):
#   cd /opt/motobrain && sudo bash scripts/vps-fix-all.sh
set -e
cd "$(dirname "$0")/.."
echo "==> Firewall puerto 80..."
ufw allow OpenSSH 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw --force enable 2>/dev/null || true
echo "==> Dependencias, Prisma y build..."
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
echo "==> PM2..."
pm2 delete motobrain-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
echo "==> Health..."
sleep 2
curl -sf "http://127.0.0.1:${PORT:-80}/api/v1/health" && echo ""
pm2 status
echo "Listo. En Vercel: BACKEND_URL=http://$(curl -4 -s ifconfig.me 2>/dev/null || echo TU_IP) (sin :4000)"
