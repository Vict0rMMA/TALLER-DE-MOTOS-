import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../domain/errors/DomainError';

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof DomainError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error('[motobrain-api]', error);
  const msg = error.message ?? '';
  const isStorage =
    msg.includes('SUPABASE') ||
    msg.includes('Storage error') ||
    msg.includes('service-photos') ||
    msg.includes('Bucket') ||
    msg.includes('sb_secret');
  const userMessage = isStorage
    ? msg.includes('sb_secret') || msg.includes('service_role')
      ? 'Fotos: en el VPS pon SUPABASE_SERVICE_KEY con la clave service_role (JWT eyJ…) de Supabase → Settings → API.'
      : 'Fotos: configura Supabase (bucket service-photos). Ejecuta npm run setup:storage en el VPS.'
    : process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : msg || 'Error interno del servidor';
  return res.status(500).json({ error: userMessage });
};
