# MotoBrain en Clouding.io (VPS) + Vercel

Servidor **taller-motos** · IP `185.166.212.43` · Ubuntu 22.04

## Arquitectura

```
taller-mts.vercel.app  ──proxy /backend──►  http://185.166.212.43/api/v1   (PORT=80 en el VPS)
        │                                              │
        │                                              ├── WhatsApp (Chrome)
        │                                              └── Fotos → Supabase Storage
        └── PostgreSQL (Supabase)
```

---

## WhatsApp se queda en "Iniciando bot…"

`pm2 logs` **no está colgado**: solo espera líneas nuevas. En un VPS de **0.5 GB RAM** Chrome puede tardar **2-5 minutos** la primera vez.

### Diagnóstico (copia en el VPS)

```bash
pm2 delete motobrian 2>/dev/null; pm2 save
free -h
which chromium-browser || which chromium
curl -s http://127.0.0.1/api/v1/whatsapp/status | head -c 500
```

Si `free` muestra poca RAM y **Swap 0**, ejecuta:

```bash
cd /opt/motobrain
bash scripts/vps-setup.sh
```

Confirma Chrome en `.env`:

```bash
grep CHROME_PATH /opt/motobrain/.env
# Debe ser: CHROME_PATH=/usr/bin/chromium-browser
```

Reinicia y mira logs **sin quedarte esperando** (solo últimas líneas):

```bash
pm2 restart motobrain-api --update-env
sleep 90
pm2 logs motobrain-api --lines 20 --nostream
curl -s http://127.0.0.1/api/v1/whatsapp/status
```

Debes ver `"hasQr": true` o `"isReady": true`. Si `"chromePath": null`, falta Chromium.

### Si sigue sin QR tras 5 min

Sube el servidor en Clouding a **1 GB RAM** mínimo (0.5 GB es muy justo para WhatsApp + API).

---

## 1. Firewall en Clouding

En el panel **Red** del servidor, abre:

| Puerto | Uso |
|--------|-----|
| 22 | SSH |
| 80 | API MotoBrain (PORT=80 en .env) |
| 80 / 443 | nginx (cuando tengas dominio HTTPS) |

Por SSH:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw enable
ufw status
```

---

## 2. Instalar la API (una vez)

```bash
ssh root@185.166.212.43
apt-get update && apt-get install -y git
git clone https://github.com/Vict0rMMA/TALLER-DE-MOTOS-.git /opt/motobrain
cd /opt/motobrain
bash scripts/vps-setup.sh
```

---

## 3. Archivo `.env` en el VPS (`/opt/motobrain/.env`)

Copia desde tu PC (mismas claves de Supabase y JWT):

```env
NODE_ENV=production
PORT=80

DATABASE_URL="postgresql://...pooler...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...:5432/postgres?sslmode=require"
JWT_SECRET="tu-secreto-largo"

ADMIN_EMAIL="admin@realestate.com"
ADMIN_PASSWORD="Admin123*"

PUBLIC_APP_URL="https://taller-mts.vercel.app"
EXTRA_ORIGINS="https://taller-mts.vercel.app"

ENABLE_WHATSAPP=true
CHROME_PATH=/usr/bin/chromium-browser

SUPABASE_URL="https://TU_PROYECTO.supabase.co"
SUPABASE_SERVICE_KEY="eyJ... service_role ..."
```

> La clave debe ser **service_role** (JWT que empieza por `eyJ`), no la clave anon del front.

---

## 4. Bucket de fotos (en tu PC, una vez)

```bash
cd proyecto-propiedades
node scripts/setup-supabase-storage.mjs
```

Crea el bucket público `service-photos`.

---

## 5. Arrancar la API

```bash
cd /opt/motobrain
npm ci
npm run build
npx prisma migrate deploy
bash scripts/vps-install-service.sh
pm2 logs motobrain-api --lines 40
```

Prueba en el VPS:

```bash
curl http://127.0.0.1/api/v1/health
curl http://127.0.0.1/api/v1/whatsapp/status
```

---

## 6. Vercel (panel web)

Proyecto **motobrain-web** → Settings → Environment Variables:

| Variable | Valor |
|----------|--------|
| `BACKEND_URL` | `http://185.166.212.43` |
| `NEXT_PUBLIC_API_URL` | `http://185.166.212.43/api/v1` |

El front en HTTPS usará el proxy `/backend` automáticamente (sin mixed content).

**Redeploy** el proyecto en Vercel después de guardar.

---

## 7. WhatsApp — escanear QR

1. Entra a https://taller-mts.vercel.app → **Configuración** → **WhatsApp**
2. Debe aparecer el QR (viene del VPS, no de Vercel)
3. WhatsApp → Dispositivos vinculados → Escanear
4. Cuando diga **Conectado**, prueba **Enviar actualización** en un servicio

Si no hay QR:

```bash
pm2 logs motobrain-api
which chromium-browser
```

Con **0.5 GB RAM** el servidor va justo; si Chrome se cae, en Clouding sube a **1–2 GB RAM** o confirma que `vps-setup.sh` creó **swap**.

---

## 8. DNS (opcional pero recomendado)

Apunta `api.tudominio.com` → `185.166.212.43`, nginx + Let's Encrypt (ver `DEPLOY-VPS.md`).

Luego en Vercel:

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1
NEXT_PUBLIC_API_USE_PROXY=false
BACKEND_URL=https://api.tudominio.com
```

---

## 9. Cloudflare WARP en tu PC

Si en el PC tienes **Cloudflare WARP** con “internet inestable”, puede fallar SSH o el panel de Clouding. Para configurar el servidor: **desconecta WARP** un momento o usa solo el móvil/otra red.

---

## Checklist rápido

- [ ] Puerto **4000** abierto en Clouding
- [ ] `pm2 status` → motobrain-api online
- [ ] `curl` health OK en el VPS
- [ ] Bucket `service-photos` creado en Supabase
- [ ] `SUPABASE_*` en `.env` del VPS
- [ ] `BACKEND_URL` en Vercel + redeploy
- [ ] QR WhatsApp escaneado → `isReady: true` en `/whatsapp/status`
