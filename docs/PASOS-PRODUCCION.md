# MotoBrain — pasos para que funcionen fotos y WhatsApp

Sigue **en orden**. Si saltas un paso, suele seguir fallando.

---

## Paso 1 — Teléfono del cliente (WhatsApp)

1. Entra a **Clientes** y abre al cliente de esa orden.
2. El teléfono debe ser **10 dígitos de Colombia**, solo números, ejemplo: `3001234567`.
3. Ese mismo número debe tener **WhatsApp activo** (no fijo ni incompleto).

---

## Paso 2 — Subir el código a GitHub (tu PC)

En la carpeta del proyecto (`proyecto-propiedades`):

```powershell
cd C:\Users\victo\Downloads\proyecto-propiedades
git add -A
git status
git commit -m "Fix fotos WhatsApp y mensajes de error"
git push origin main
```

(Si `git push` falla, arregla eso antes de seguir.)

---

## Paso 3 — Actualizar el VPS (servidor)

Conéctate por SSH:

```bash
ssh root@185.166.212.43
cd /opt/motobrain
git pull
```

### 3.1 Revisar el `.env`

```bash
nano /opt/motobrain/.env
```

Debe tener **exactamente** algo así (ajusta solo tus claves reales):

```env
NODE_ENV=production
PORT=80

DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://...?sslmode=require"
JWT_SECRET="tu-secreto"

ADMIN_EMAIL="admin@realestate.com"
ADMIN_PASSWORD="Admin123*"

PUBLIC_APP_URL="https://taller-mts.vercel.app"
EXTRA_ORIGINS="https://taller-mts.vercel.app"

ENABLE_WHATSAPP=true
CHROME_PATH=/usr/bin/chromium-browser

SUPABASE_URL="https://vicfspxmlfioyjpvyilu.supabase.co"
SUPABASE_SERVICE_KEY="eyJ...."
```

**Importante:**

| Variable | Qué poner |
|----------|-----------|
| `PORT` | `80` (como lo tienes ahora) |
| `SUPABASE_SERVICE_KEY` | Clave **service_role** de Supabase (empieza por `eyJ`), **no** `sb_secret_...` |

La service_role la copias en:  
**Supabase → Project Settings → API → service_role (secret) → Reveal**

Guarda el archivo: `Ctrl+O`, Enter, `Ctrl+X`.

### 3.2 Comprobar y arrancar

```bash
cd /opt/motobrain
npm run check:env
npm run setup:storage
npm ci
npm run build
npx prisma migrate deploy
pm2 restart motobrain-api --update-env
pm2 save
```

### 3.3 Probar en el servidor

```bash
curl -s http://127.0.0.1/api/v1/health
pm2 logs motobrain-api --lines 30 --nostream
```

Debe salir `{"ok":true,...}`.

---

## Paso 4 — Vercel (página web)

1. Entra a [vercel.com](https://vercel.com) → proyecto **motobrain-web** (o el que apunta a `taller-mts.vercel.app`).
2. **Settings → Environment Variables** y pon:

| Nombre | Valor |
|--------|--------|
| `BACKEND_URL` | `http://185.166.212.43` |
| `NEXT_PUBLIC_API_URL` | `http://185.166.212.43/api/v1` |

**Sin** `:4000` si en el VPS usas `PORT=80`.

3. **Deployments → Redeploy** (último deployment → ⋮ → Redeploy).

Espera a que termine el build (2–5 min).

---

## Paso 5 — Conectar WhatsApp otra vez

1. Abre https://taller-mts.vercel.app
2. **Configuración → WhatsApp**
3. Si no dice **Conectado**:
   - Pulsa **Reiniciar** o espera el QR
   - En el celular: WhatsApp → **Dispositivos vinculados** → **Vincular**
   - Escanea el QR
4. Cuando diga **Conectado y activo**, sigue al paso 6.

Si el QR no aparece en 3–5 minutos, en el VPS:

```bash
pm2 logs motobrain-api --lines 50 --nostream
free -h
```

Con **0.5 GB RAM** a veces Chrome no arranca; ejecuta `bash scripts/vps-setup.sh` para swap o sube RAM en Clouding.

---

## Paso 6 — Probar en un servicio

1. **Servicios** → abre la orden (ej. Frenos).
2. **Enviar actualización** (WhatsApp).
3. Si falla:
   - Mira el toast (debe decir el motivo, no solo “No se pudo…”).
   - Baja en la misma página a **Últimas notificaciones** → en rojo verás `errorMsg`.

### Si la foto sigue con HTTP 502

- Prueba con una foto **pequeña** (captura de pantalla).
- Confirma en el VPS que `SUPABASE_SERVICE_KEY` es `eyJ...` y `npm run setup:storage` dijo OK.

---

## Resumen rápido (checklist)

- [ ] Teléfono cliente: 10 dígitos + WhatsApp activo  
- [ ] `git push` desde tu PC  
- [ ] VPS: `git pull` + `.env` con `eyJ` + `pm2 restart`  
- [ ] Vercel: `BACKEND_URL` sin `:4000` + **Redeploy**  
- [ ] Configuración → WhatsApp **Conectado**  
- [ ] Probar envío y leer error en “Últimas notificaciones”  

---

## Si aún falla

Copia y envía:

1. Texto rojo bajo **Últimas notificaciones** en el servicio.  
2. Salida de: `pm2 logs motobrain-api --lines 20 --nostream` (en el VPS).  
3. Resultado de: `npm run check:env` (en el VPS).
