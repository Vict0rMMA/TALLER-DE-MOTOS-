import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { json } from 'express';
import apiRouter from './interface/routes';
import { errorHandler } from './interface/middlewares/errorMiddleware';
import { DomainError } from './domain/errors/DomainError';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());

const allowedOrigins = [
  'http://localhost:3000',
  process.env.PUBLIC_APP_URL ?? 'https://taller-mts.vercel.app',
  ...(process.env.EXTRA_ORIGINS ? process.env.EXTRA_ORIGINS.split(',').map((o) => o.trim()) : []),
].filter(Boolean);

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

app.use(cors({
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) cb(null, true);
    else cb(new Error(`CORS: origen no permitido (${origin})`));
  },
  credentials: true,
}));
app.use(json());

app.get('/api/v1/health', (_req, res) => {
  res.json({ ok: true, message: 'MotoBrain AI API funcionando', version: 'v1' });
});

app.get('/api/v1', (_req, res) => {
  res.json({
    ok: true,
    message: 'MotoBrain API v1 — usa rutas como /api/v1/health o /api/v1/auth/login',
    health: '/api/v1/health',
  });
});

// Cron de recordatorios (lo invoca Vercel Cron; en VPS/local lo hace el setInterval de index.ts).
// Si CRON_SECRET está configurado, exige el header Bearer que Vercel envía automáticamente.
app.get('/api/v1/cron/reminders', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }
  try {
    const { runReminderCron } = await import('./infrastructure/jobs/reminderCron');
    await runReminderCron();
    res.json({ ok: true, ran: 'reminders', at: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

app.use('/api/v1', apiRouter);

app.use((req, _res, next) => {
  next(new DomainError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
});

app.use(errorHandler);

export default app;
