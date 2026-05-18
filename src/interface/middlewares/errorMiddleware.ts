import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../domain/errors/DomainError';

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof DomainError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error('[motobrain-api]', error);
  return res.status(500).json({ error: 'Error interno del servidor' });
};
