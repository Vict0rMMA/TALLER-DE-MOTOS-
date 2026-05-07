# API REST — Propiedades

Backend en **Node.js** y **Express 5** para un catálogo inmobiliario: listados con filtros y paginación, CRUD reservado con **JWT**, subida de imágenes (opcionalmente optimizadas con **Sharp** a WebP) y datos en **PostgreSQL** mediante **Prisma 7** y el driver **`pg`** (`@prisma/adapter-pg`). Las entradas se validan con **Zod**.

---

## Cómo está montada la aplicación

El arranque separa dos ideas: **qué es la app HTTP** y **cómo se conecta a la base de datos**.

### `server.js` (entrada del proceso)

- Carga variables con **dotenv**.
- Importa la instancia de **Prisma** (`src/db/prisma.js`) y llama a **`prisma.$connect()`** antes de escuchar; si la base no está accesible, el proceso termina con error.
- Importa **`app`** desde `app.js`, obtiene **`PORT`** del entorno (por defecto **3000**) y hace **`app.listen`**.

Aquí no se definen rutas ni middlewares de negocio; solo el ciclo de vida del proceso y el puerto.

### `app.js` (aplicación Express)

Define **una sola** instancia `express()` y encadena todo lo que afecta a cada petición:

1. **Helmet** — cabeceras de seguridad; si `DISABLE_CSP=1`, se desactiva la Content-Security-Policy para facilitar pruebas locales. Si no, se amplía la CSP para permitir imágenes de ejemplo (p. ej. picsum) y fuentes de Google donde haga falta.
2. **CORS** — permite llamadas desde otros orígenes según la política por defecto de `cors`.
3. **Morgan** — registro de peticiones en consola (formato `dev`).
4. **`express.json()`** — cuerpos JSON en rutas que lo usan.

Luego se definen las rutas bajo el prefijo **`/api/v1`**:

| Prefijo | Archivo de rutas | Rol |
|---------|------------------|-----|
| `/api/v1/health` | inline en `app.js` | Comprueba que la API viva. |
| `/api/v1/auth` | `auth.routes.js` | Login (público). |
| `/api/v1/upload` | `upload.routes.js` | Subida de imagen (JWT). |
| `/api/v1/properties` | `properties.routes.js` | Consulta pública y CRUD protegido. |

Después se expone **`/uploads`** como carpeta estática (`public/uploads`), donde se guardan las imágenes subidas.

Al final van **dos middlewares** de `error.middleware.js`: uno captura rutas no definidas (**404**); el otro centraliza errores (validación Zod, Multer, códigos HTTP de los servicios).

`app.js` solo **exporta** la app (`module.exports = app`); no arranca el servidor. Eso permite, si en el futuro quieres tests o otro entrypoint, reutilizar la misma configuración.

---

## Requisitos

- **Node.js** compatible con el `package-lock.json` del repositorio.
- **PostgreSQL** accesible (local, Supabase, Neon, etc.).

---

## Instalación local

```bash
git clone <url-de-tu-repo>.git
cd <carpeta-del-repo>
npm install
cp .env.example .env
```

Edita `.env` con tus URLs y secretos. Con **Supabase** suele usarse el *Transaction pooler* (puerto **6543**) en `DATABASE_URL` para la API y una URI **directa** (puerto **5432**) en `DIRECT_URL` para migraciones; usar solo el pooler con `prisma migrate` a veces provoca errores de *prepared statements*.

Comprobación rápida sin impruir contraseñas:

```bash
npm run check:env
```

Cliente Prisma y base de datos:

```bash
npm run prisma:generate
npm run prisma:migrate
```

En el primer clone, **`prisma generate`** es necesario porque el cliente generado en `src/generated/prisma/` no se versiona (ver sección Git).

Arranque:

```bash
npm run dev
```

- API: `http://localhost:<PORT>` (por defecto **3000**).
- Salud: `GET /api/v1/health`.

---

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Conexión que usa la aplicación en tiempo de ejecución (en Supabase, a menudo el pooler **6543**). |
| `DIRECT_URL` | Conexión directa **5432** para Prisma Migrate; en Supabase suele ser necesaria si `DATABASE_URL` es el pooler. |
| `DATABASE_SSL` | `1` para TLS en el cliente (habitual en la nube); `0` en local. |
| `JWT_SECRET` | Secreto para firmar y verificar JWT (obligatorio). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales aceptadas en `POST /api/v1/auth/login`. |
| `PORT` | Puerto HTTP (por defecto `3000`). |
| `DISABLE_CSP` | Con `1` desactiva la CSP de Helmet. |
| `NODE_ENV` | Si no es `production`, el manejador de errores puede mostrar *stack* en consola. |

Plantilla comentada: **`.env.example`**.

---

## Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Nodemon sobre `src/server.js`. |
| `npm start` | Producción con `node`. |
| `npm run prisma:generate` | Genera el cliente en `src/generated/prisma/`. |
| `npm run prisma:migrate` | Migraciones en desarrollo. |
| `npm run prisma:deploy` | Aplica migraciones (p. ej. en servidor o CI). |
| `npm run prisma:studio` | Abre Prisma Studio. |
| `npm run check:env` | Valida variables de entorno relacionadas con la DB. |

---

## API (`/api/v1`)

Cabecera en rutas protegidas: `Authorization: Bearer <token>`.

| Método y ruta | Descripción |
|---------------|-------------|
| `GET /api/v1/health` | Estado del servicio. |
| `POST /api/v1/auth/login` | Body `{ "email", "password" }` → `token`, `tokenType`, `expiresIn`. |
| `GET /api/v1/properties` | Listado: `page`, `limit` (≤ 100), `location`, `minPrice`, `maxPrice`, `sort` (`recent` \| `price-asc` \| `price-desc`). |
| `GET /api/v1/properties/:id` | Detalle por id. |
| `POST /api/v1/properties` | Crear (JWT). |
| `PUT /api/v1/properties/:id` | Actualizar (JWT). |
| `DELETE /api/v1/properties/:id` | Borrar (JWT). |
| `POST /api/v1/upload/property-image` | Subida multipart, campo `image` (JPEG/PNG/WebP, máx. 5 MB); JWT. |

Cuerpo de propiedad: `title`, `price`, `location`, `available`; opcionales `imageUrl` (`/uploads/…` o `https://`), `bedrooms`, `bathrooms`, `areaM2`. Las subidas quedan bajo `/uploads/properties/`.

---

## Modelo de datos

Definido en **`prisma/schema.prisma`**: `Property` con `id`, `title`, `price`, `location`, `available`, `imageUrl`, `bedrooms`, `bathrooms`, `areaM2`, `createdAt`. Las migraciones están en **`prisma/migrations/`**.

---

## Estructura del código

| Ruta | Función |
|------|---------|
| `src/server.js` | Entrada: dotenv, conexión Prisma, `listen`. |
| `src/app.js` | Middlewares globales, rutas `/api/v1`, estáticos `/uploads`, manejo 404 y errores. |
| `src/routes/` | Routers por dominio (auth, properties, upload). |
| `src/controllers/` | Respuestas HTTP delegadas en servicios. |
| `src/services/` | Lógica de negocio (auth, propiedades). |
| `src/middlewares/` | JWT, validación Zod, Multer, errores. |
| `src/validators/` | Esquemas Zod. |
| `src/db/prisma.js` | `PrismaClient` con adapter `pg`. |
| `prisma/` | `schema.prisma`, migraciones, `prisma.config.ts` (URL para CLI). |
| `scripts/verify-supabase-env.js` | Comprueba `.env` ante Supabase/pooler. |
| `public/uploads/` | Imágenes servidas en `/uploads` (solo se versiona `.gitkeep` en `properties/`). |

---

## Git y publicación del repositorio

### Qué no debe subirse nunca

- **`.env`** ni copias con secretos (`.env.local`, etc.). Solo **`.env.example`** como plantilla.
- **`node_modules/`** (se reinstala con `npm install`).
- El cliente generado **`src/generated/prisma/`** (cada entorno ejecuta `npm run prisma:generate` tras clonar).
- Subidas de usuario en **`public/uploads/properties/*`** (se ignoran; la carpeta existe gracias a `.gitkeep`).

### Subir el proyecto a un remoto (p. ej. GitHub)

Desde la raíz del proyecto (si aún no hay repositorio git):

```bash
git init
git add .
git commit -m "Initial commit: API propiedades"
```

Crea un repositorio vacío en GitHub y enlázalo:

```bash
git branch -M main
git remote add origin https://github.com/<usuario>/<nombre-repo>.git
git push -u origin main
```

Si el remoto ya existe y solo añades este código:

```bash
git remote add origin <url-ssh-o-https>
git push -u origin main
```

Tras que alguien clone el repo:

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

En despliegue (servidor o CI) suele usarse `npm run prisma:deploy` con `DATABASE_URL` y `DIRECT_URL` configurados.

---

## Licencia

ISC — ver `package.json`.
