import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../domain/errors/DomainError';

export const tenantMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.workshopId) return next(new DomainError('Workshop no identificado', 403));
  next();
};
