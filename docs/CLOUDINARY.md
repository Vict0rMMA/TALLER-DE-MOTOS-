# Cloudinary — fotos del taller (MotoBrain)

**Cloudinary** no es el servidor de tu API. Es un servicio en la nube para **subir, guardar y servir imágenes** (fotos de servicios, logo del taller, etc.) con URLs rápidas y redimensionado automático.

## Cómo encaja con lo que ya tienes

| Pieza | Para qué |
|--------|----------|
| **Vercel** | Panel web (`taller-mts.vercel.app`) |
| **VPS** | API + WhatsApp (`pm2`) |
| **PostgreSQL** (Supabase/Neon) | Base de datos |
| **Cloudinary** | Fotos y archivos multimedia |
| **Supabase Storage** (opcional) | Alternativa a Cloudinary; en `.env` ya hay variables pero hoy no es obligatorio |

Puedes usar **solo Cloudinary** para imágenes y olvidar Supabase Storage hasta que lo integres en código.

---

## 1. Crear cuenta

1. Entra a [https://cloudinary.com](https://cloudinary.com) y regístrate (plan gratis alcanza para empezar).
2. Confirma el correo.

---

## 2. Datos de tu cuenta (Dashboard)

En **Home** o **Account Details** copia:

| Variable | Dónde está en Cloudinary |
|----------|---------------------------|
| `CLOUDINARY_CLOUD_NAME` | Cloud name |
| `CLOUDINARY_API_KEY` | API Key |
| `CLOUDINARY_API_SECRET` | API Secret (no la subas a Git ni al front) |

---

## 3. Carpeta / organización (recomendado)

En **Media Library** → **Folders** crea por ejemplo:

- `motobrain/workshops/{workshopId}/services`
- `motobrain/workshops/{workshopId}/logo`

Así cada taller tiene sus fotos separadas.

---

## 4. Upload preset (subida desde la app)

**Settings** → **Upload** → **Upload presets** → **Add upload preset**

| Campo | Valor sugerido |
|--------|----------------|
| **Preset name** | `motobrain_services` |
| **Signing Mode** | **Signed** (más seguro; la API firma la subida) |
| **Folder** | `motobrain/workshops` (opcional) |
| **Allowed formats** | `jpg,png,webp` |
| **Max file size** | `5` MB |

Guarda el nombre del preset: `CLOUDINARY_UPLOAD_PRESET=motobrain_services`.

> Para pruebas rápidas puedes usar **Unsigned**, pero en producción usa **Signed** y sube solo desde tu API (nunca expongas el API Secret en el navegador).

---

## 5. Variables en el proyecto

### API (raíz) — `.env` y VPS

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=tu_secreto_largo
CLOUDINARY_UPLOAD_PRESET=motobrain_services
```

### Front (Vercel) — solo si más adelante subes directo desde el navegador

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
```

**No pongas** `API_SECRET` en Vercel del front ni en `NEXT_PUBLIC_*`.

---

## 6. VPS — aplicar cambios

```bash
cd /opt/motobrain
nano .env
# Pega las variables CLOUDINARY_*
pm2 restart motobrain-api
```

En **Vercel** (motobrain-web) no hace falta Cloudinary hasta que exista subida desde el panel.

---

## 7. Probar que la cuenta funciona (terminal)

Con Node en tu PC (sustituye valores):

```bash
cd proyecto-propiedades
npm install cloudinary
node -e "
const { v2 } = require('cloudinary');
v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
v2.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', { folder: 'motobrain/test' })
  .then(r => console.log('OK', r.secure_url))
  .catch(e => console.error(e));
"
```

Exporta antes las variables o ponlas en `.env` y usa `dotenv` si lo prefieres.

Si ves una URL `https://res.cloudinary.com/...`, la cuenta está bien.

---

## 8. Seguridad

- `CLOUDINARY_API_SECRET` → solo en `.env` del **servidor API**.
- Añade a `.gitignore` (ya está `.env`).
- En Cloudinary: **Settings** → **Security** → restringe tipos y tamaño de archivo.

---

## 9. Siguiente paso en MotoBrain (cuando quieras código)

Hoy las fotos de servicios están preparadas en `.env` con **Supabase Storage**, pero Cloudinary es igual de válido. La integración típica sería:

1. Endpoint `POST /api/v1/uploads/service-photo` en la API.
2. La API sube a Cloudinary y guarda la URL en la orden de servicio.
3. El panel muestra la imagen con la URL de Cloudinary.

Si quieres eso en el código, pide “integrar Cloudinary en servicios” y se puede hacer en un PR pequeño.

---

## ¿Era Cloudflare?

Si te referías a **Cloudflare** (DNS, HTTPS, protección), eso va en el **dominio** del VPS (`api.tudominio.com`) y en Vercel, no sustituye Cloudinary. Ver `docs/DEPLOY-VPS.md` (nginx + Let's Encrypt).
