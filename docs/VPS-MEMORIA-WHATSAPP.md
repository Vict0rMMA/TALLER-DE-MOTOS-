# VPS con poca RAM — WhatsApp que funcione

## Qué consume memoria

| Proceso | RAM aprox. |
|---------|------------|
| API Node + Prisma | 150–300 MB |
| Chrome (WhatsApp) | 300–600 MB |
| **Total** | **0,5–1 GB** justo en Clouding 512 MB |

## Solución recomendada (en orden)

### 1. Swap 2 GB (obligatorio)

En el VPS:

```bash
cd /opt/motobrain
sudo bash scripts/vps-optimize-memory.sh
```

### 2. Modo ahorro: WhatsApp solo cuando lo usas

En `.env` del VPS:

```env
ENABLE_WHATSAPP=true
WHATSAPP_LAZY_START=true
CHROME_PATH=/usr/bin/chromium-browser
```

- **Antes:** Chrome arrancaba al encender la API → RAM llena siempre.
- **Ahora:** Chrome arranca cuando entras a **Configuración → WhatsApp** o envías un mensaje.

Para volver al modo antiguo (Chrome 24/7): `WHATSAPP_LAZY_START=false`

### 3. Subir RAM en Clouding (lo más fiable)

Si puedes, pasa de **0,5 GB → 1–2 GB**. WhatsApp + Chrome es mucho más estable.

### 4. VPS solo para MotoBrain

No corras en el mismo servidor: otros bots, bases locales, Docker pesado, o varias apps PM2.

Un solo proceso: `pm2 status` → solo `motobrain-api`.

---

## Uso diario del QR

1. Entra a **Configuración → WhatsApp**.
2. Espera **2–5 min** (primera vez tras reinicio).
3. Escanea el QR.
4. Cuando diga **Conectado**, ya puedes enviar mensajes.

Si falla: `sudo bash scripts/vps-whatsapp-fix.sh`

---

## Comandos útiles

```bash
free -h                    # RAM y swap
pm2 logs motobrain-api --lines 30 --nostream
pm2 restart motobrain-api --update-env
```

---

## ¿Separar WhatsApp en otro servidor?

Solo si creces mucho. Hoy la API y WhatsApp comparten el mismo proceso; mover WhatsApp a otro VPS implica más coste y configuración. Con **swap + lazy start + 1 GB RAM** suele bastar.
