# API + WhatsApp en VPS (Ubuntu)

Tu VPS **taller-motos** (Ubuntu 22.04, 1 GB RAM) es el lugar correcto para el bot. El panel puede seguir en **Vercel**; solo cambia la URL de la API.

## Siempre activo (sin `npm run dev`)

Configuras el servidor **una sola vez**. Después:

- La API corre sola con **PM2** (reinicio si se cae).
- Al **reiniciar el VPS**, PM2 vuelve a levantar la API.
- Si **WhatsApp se desconecta**, el bot intenta reconectar solo (~15 s).

No necesitas tener tu PC encendido ni ejecutar comandos cada día.

```bash
# Una vez en el VPS (con .env listo):
cd /opt/motobrain
bash scripts/vps-setup.sh          # Node, Chromium, swap
bash scripts/vps-install-service.sh  # build + PM2 + arranque al boot
```

Comandos útiles (solo si actualizas o revisas):

| Acción | Comando |
|--------|---------|
| Ver estado | `pm2 status` |
| Ver logs | `pm2 logs motobrain-api` |
| Tras `git pull` | `npm run build && pm2 restart motobrain-api` |

## Arquitectura

```
[Vercel]  motobrain-web  ──HTTPS──►  [VPS] API :4000 + WhatsApp + Puppeteer
                                         │
                                         └── PostgreSQL (Supabase)
```

> **Importante:** El front en Vercel usa `https://`. La API en el VPS debe exponerse con **HTTPS** (nginx + Let's Encrypt). Si usas solo `http://IP:4000`, el navegador bloqueará las peticiones (contenido mixto).

---

## 1. Conectar por SSH

Desde el panel del proveedor abre **Consola** o usa SSH con la IP y tu clave:

```bash
ssh root@TU_IP_DEL_VPS
```

---

## 2. Preparar el servidor (una vez)

```bash
apt-get install -y git
git clone https://github.com/TU_USUARIO/proyecto-propiedades.git /opt/motobrain
cd /opt/motobrain
bash scripts/vps-setup.sh
```

---

## 3. Variables de entorno

```bash
cd /opt/motobrain
nano .env
```

Copia las mismas variables que en Vercel (Supabase), más:

```env
NODE_ENV=production
PORT=4000

DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...:5432/postgres?sslmode=require"
JWT_SECRET="tu-secreto"

PUBLIC_APP_URL="https://taller-mts.vercel.app"
EXTRA_ORIGINS="https://taller-mts.vercel.app"

ENABLE_WHATSAPP=true
CHROME_PATH=/usr/bin/chromium-browser
```

Comprueba la ruta de Chrome:

```bash
which chromium-browser || which chromium
```

---

## 4. Build y migraciones

```bash
cd /opt/motobrain
npm ci
npm run build
npx prisma migrate deploy
```

---

## 5. Servicio permanente (PM2)

```bash
cd /opt/motobrain
bash scripts/vps-install-service.sh
```

Si `pm2 startup` imprime un comando con `sudo env`, ejecútalo una vez y luego `pm2 save`.

Deberías ver en los logs: `[WhatsApp] Iniciando bot...`

```bash
pm2 logs motobrain-api --lines 30
```

Prueba local en el VPS:

```bash
curl http://127.0.0.1:4000/api/v1/health
```

---

## 6. HTTPS con nginx (obligatorio para Vercel)

Apunta un subdominio al VPS, por ejemplo `api.tudominio.com` → IP del VPS.

```bash
apt-get install -y nginx certbot python3-certbot-nginx
```

`/etc/nginx/sites-available/motobrain`:

```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/motobrain /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.tudominio.com
ufw allow 80
ufw allow 443
ufw allow OpenSSH
ufw enable
```

---

## 7. Vercel (solo el front)

En el proyecto **motobrain-web** en Vercel → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1
```

En el proyecto **API en Vercel** (si aún existe):

- Quita `ENABLE_WHATSAPP=true` o desactiva ese deploy.
- O deja de usar esa URL y usa solo el VPS.

Redeploy del front en Vercel.

---

## 8. Escanear el QR

1. Entra a `https://taller-mts.vercel.app` → **Configuración** → **WhatsApp**.
2. Debe aparecer el QR (ya no el aviso de Vercel).
3. Escanea con WhatsApp → Dispositivos vinculados.

La sesión queda en `/opt/motobrain/.wwebjs_auth/` — no borres esa carpeta al actualizar.

---

## Actualizar la API

```bash
cd /opt/motobrain
git pull
npm ci
npm run build
npx prisma migrate deploy
pm2 restart motobrain-api
```

---

## Problemas frecuentes

| Síntoma | Solución |
|--------|----------|
| QR no aparece | `pm2 logs` — error de Chrome → revisa `CHROME_PATH` |
| `Killed` / reinicios | Poca RAM → confirma swap (`free -h`) |
| Front no conecta | API debe ser **https**; revisa CORS y `PUBLIC_APP_URL` |
| QR en Vercel pero no en VPS | `NEXT_PUBLIC_API_URL` sigue apuntando a Vercel API |

---

## Sin dominio (solo prueba)

Puedes probar el QR entrando por túnel temporal:

```bash
# en el VPS, con la API corriendo
npx localtunnel --port 4000
```

Usa la URL `https://....loca.lt` en `NEXT_PUBLIC_API_URL` (solo pruebas; no es estable para producción).
