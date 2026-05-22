#!/bin/bash
# Instala la API como servicio permanente (PM2 + arranque al reiniciar el VPS).
# Ejecutar UNA VEZ desde la raíz del proyecto, con .env ya configurado:
#   cd /opt/motobrain && sudo bash scripts/vps-install-service.sh

set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "ERROR: Crea .env antes (DATABASE_URL, JWT_SECRET, ENABLE_WHATSAPP=true, etc.)"
  exit 1
fi

# CHROME_PATH automático si falta
if ! grep -q '^CHROME_PATH=' .env 2>/dev/null; then
  for p in /usr/bin/chromium-browser /usr/bin/chromium /snap/bin/chromium; do
    if [ -x "$p" ]; then
      echo "CHROME_PATH=$p" >> .env
      echo "==> Añadido CHROME_PATH=$p a .env"
      break
    fi
  done
fi

if ! grep -q '^ENABLE_WHATSAPP=true' .env; then
  echo "AVISO: ENABLE_WHATSAPP=true no está en .env — WhatsApp no arrancará."
fi

echo "==> Build..."
npm ci
npm run build
npx prisma migrate deploy

echo "==> PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

pm2 delete motobrain-api 2>/dev/null || true
if [ ! -f ecosystem.config.cjs ]; then
  echo "ERROR: Falta ecosystem.config.cjs en la raíz del proyecto."
  exit 1
fi
pm2 start ecosystem.config.cjs
pm2 save

# Arranque automático cuando el VPS se reinicia
RUN_USER="${SUDO_USER:-$USER}"
if [ "$RUN_USER" = "root" ] || [ -z "$RUN_USER" ]; then
  RUN_USER="root"
  HOME_DIR="/root"
else
  HOME_DIR=$(eval echo "~$RUN_USER")
fi

env PATH="$PATH:$(npm prefix -g 2>/dev/null || echo /usr/bin)" \
  pm2 startup systemd -u "$RUN_USER" --hp "$HOME_DIR" 2>/dev/null | tee /tmp/pm2-startup.txt || true

if grep -q 'sudo env' /tmp/pm2-startup.txt 2>/dev/null; then
  echo ""
  echo "==> Ejecuta este comando (copiado de pm2 startup) y luego: pm2 save"
  grep 'sudo env' /tmp/pm2-startup.txt
fi

pm2 save

echo ""
echo "=== Servicio activo 24/7 ==="
pm2 status
echo ""
echo "  Ver logs:    pm2 logs motobrain-api"
echo "  Reiniciar:   pm2 restart motobrain-api"
echo "  Tras git pull: cd $APP_DIR && npm run build && pm2 restart motobrain-api"
echo ""
curl -sf "http://127.0.0.1:${PORT:-4000}/api/v1/health" && echo " — health OK" || echo " — espera unos segundos y prueba: curl http://127.0.0.1:4000/api/v1/health"
