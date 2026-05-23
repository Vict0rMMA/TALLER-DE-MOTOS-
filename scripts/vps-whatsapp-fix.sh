#!/bin/bash
# Repara WhatsApp / QR en VPS pequeño (Clouding 0.5–1 GB RAM).
# Uso: cd /opt/motobrain && sudo bash scripts/vps-whatsapp-fix.sh
set -e
cd "$(dirname "$0")/.."

echo "==> Swap + Chromium (si falta)..."
bash scripts/vps-setup.sh

echo "==> Matar Chrome colgado..."
pkill -f chromium-browser 2>/dev/null || true
pkill -f chromium 2>/dev/null || true
pkill -f chrome 2>/dev/null || true
sleep 2

if ! grep -q '^ENABLE_WHATSAPP=true' .env 2>/dev/null; then
  echo "ENABLE_WHATSAPP=true" >> .env
fi

CHROME=""
for p in /usr/bin/chromium-browser /usr/bin/chromium /snap/bin/chromium; do
  if [ -x "$p" ]; then CHROME="$p"; break; fi
done
if [ -n "$CHROME" ]; then
  if grep -q '^CHROME_PATH=' .env; then
    sed -i "s|^CHROME_PATH=.*|CHROME_PATH=$CHROME|" .env
  else
    echo "CHROME_PATH=$CHROME" >> .env
  fi
  echo "CHROME_PATH=$CHROME"
fi

echo "==> Limpiar sesión WhatsApp (QR nuevo)..."
rm -rf .wwebjs_auth .wwebjs_cache 2>/dev/null || true

echo "==> Rebuild y reinicio API..."
npx prisma generate
npm run build
pm2 restart motobrain-api --update-env

echo ""
echo "Espera 2-5 minutos y revisa Configuración → WhatsApp en el panel."
echo "Logs: pm2 logs motobrain-api --lines 40 --nostream"
free -h
