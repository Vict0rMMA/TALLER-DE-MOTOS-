#!/bin/bash
# Optimiza un VPS pequeño para API + WhatsApp (Clouding 0.5–1 GB).
# Uso: cd /opt/motobrain && sudo bash scripts/vps-optimize-memory.sh
set -e
cd "$(dirname "$0")/.."

echo "==> 1/4 Swap 2 GB + Chromium..."
bash scripts/vps-setup.sh

echo "==> 2/4 Variables de ahorro de RAM en .env..."
touch .env
set_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${val}|" .env
  else
    echo "${key}=${val}" >> .env
  fi
}
set_env ENABLE_WHATSAPP true
set_env WHATSAPP_LAZY_START true
set_env PORT 80

for p in /usr/bin/chromium-browser /usr/bin/chromium; do
  if [ -x "$p" ]; then set_env CHROME_PATH "$p"; break; fi
done

echo "==> 3/4 Limpiar cachés pesados..."
rm -rf .wwebjs_cache 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

echo "==> 4/4 Build y PM2 con límites de memoria..."
npm run build
pm2 delete motobrain-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "=== Memoria ==="
free -h
echo ""
echo "WHATSAPP_LAZY_START=true → Chrome solo al abrir Configuración → WhatsApp."
echo "Luego: pm2 logs motobrain-api --lines 20 --nostream"
echo "Si Swap sigue en 0, reinicia el VPS una vez."
