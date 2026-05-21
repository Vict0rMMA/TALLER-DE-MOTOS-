#!/bin/bash
# MotoBrain — preparación inicial en Ubuntu 22.04 (VPS)
# Ejecutar como root o con sudo: bash scripts/vps-setup.sh

set -e

echo "==> Actualizando paquetes..."
apt-get update -y
apt-get upgrade -y

echo "==> Swap 2GB (recomendado con 1GB RAM + Puppeteer)..."
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Dependencias Node + Chromium..."
apt-get install -y curl git build-essential \
  chromium-browser \
  ca-certificates fonts-liberation \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 \
  libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libxcomposite1 libxdamage1 \
  libxrandr2 libxss1 libxtst6 xdg-utils

if ! command -v node >/dev/null 2>&1; then
  echo "==> Instalando Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Instalando PM2..."
  npm install -g pm2
fi

CHROME=""
for p in /usr/bin/chromium-browser /usr/bin/chromium /snap/bin/chromium; do
  if [ -x "$p" ]; then CHROME="$p"; break; fi
done

echo ""
echo "=== Listo ==="
echo "Chrome/Chromium: ${CHROME:-no encontrado — define CHROME_PATH en .env}"
echo "Node: $(node -v)"
echo ""
echo "Siguiente:"
echo "  1. Clona el repo en /opt/motobrain (o tu carpeta)"
echo "  2. Copia .env con DATABASE_URL, JWT_SECRET, ENABLE_WHATSAPP=true"
echo "  3. Si Chrome existe: echo CHROME_PATH=$CHROME >> .env"
echo "  4. npm ci && npm run build && npx prisma migrate deploy"
echo "  5. pm2 start ecosystem.config.cjs && pm2 save && pm2 startup"
echo "  6. Configura nginx + HTTPS (ver docs/DEPLOY-VPS.md)"
echo "  7. En Vercel: NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1"
