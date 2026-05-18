import express from 'express';
import cors from 'cors';
import { json } from 'express';
import apiRouter from './interface/routes';
import { errorHandler } from './interface/middlewares/errorMiddleware';
import { DomainError } from './domain/errors/DomainError';

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'http://localhost:3000',
        process.env.PUBLIC_APP_URL ?? 'https://taller-mts.vercel.app',
      ]
    : true,
}));
app.use(json());

app.get('/api/v1/health', (_req, res) => {
  res.json({ ok: true, message: 'MotoBrain AI API funcionando', version: 'v1' });
});

app.use('/api/v1', apiRouter);

app.use((req, _res, next) => {
  next(new DomainError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
});

app.use(errorHandler);

export default app;
