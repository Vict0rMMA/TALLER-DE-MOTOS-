# Vercel + VPS (sin ngrok)

## Cómo funciona

```
Navegador (HTTPS taller-mts.vercel.app)
    → /api/backend/*  (función en Vercel)
    → http://185.166.212.43/api/v1/*  (tu VPS, puerto 80)
```

No uses ngrok. Solo necesitas **Vercel** + **VPS** bien configurados.

---

## 1. Vercel (una vez)

Proyecto **motobrain-web** → Settings:

- **Root Directory:** `motobrain-web`
- **Environment Variables** (Production):

| Variable | Valor |
|----------|--------|
| `BACKEND_URL` | `http://185.166.212.43` |
| `NEXT_PUBLIC_API_URL` | `http://185.166.212.43/api/v1` |

**Borra** variables viejas con `:4000` si existen.

Guarda y **Redeploy**.

Comprueba: https://taller-mts.vercel.app/api/status  
Debe mostrar `"vpsReachable": true`.

---

## 2. VPS (una vez)

```bash
ssh root@185.166.212.43
cd /opt/motobrain
bash scripts/vps-firewall.sh
```

En Clouding → panel del servidor → **Red** → permite **TCP 80** entrante.

`.env` del VPS:

```env
PORT=80
ENABLE_WHATSAPP=true
CHROME_PATH=/usr/bin/chromium-browser
PUBLIC_APP_URL=https://taller-mts.vercel.app
EXTRA_ORIGINS=https://taller-mts.vercel.app
SUPABASE_SERVICE_KEY=eyJ...   # service_role, no sb_secret
```

```bash
git pull
npm run build
pm2 restart motobrain-api --update-env
curl -s http://127.0.0.1/api/v1/health
```

---

## 3. Subir código (tu PC)

```powershell
git add -A
git commit -m "Vercel proxy estable sin ngrok"
git push
```

---

## Si el login sigue en timeout

1. Abre https://taller-mts.vercel.app/api/status  
2. Si `vpsReachable: false` → problema de **firewall Clouding** o API caída (`pm2 status`).  
3. Si `badPort: true` → corrige `BACKEND_URL` en Vercel (sin `:4000`).
