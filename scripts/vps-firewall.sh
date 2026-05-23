#!/bin/bash
# Abre puertos para Vercel → API (sin ngrok). Ejecutar en el VPS como root.
set -e
ufw allow OpenSSH
ufw allow 80/tcp comment 'MotoBrain API'
ufw --force enable
ufw status
echo "Prueba: curl -s http://127.0.0.1/api/v1/health"
