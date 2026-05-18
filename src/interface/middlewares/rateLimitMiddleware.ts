import { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = requestCounts.get(key);

    if (!entry || now > entry.resetAt) {
      requestCounts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > maxRequests) {
      return _res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' });
    }
    next();
  };
};

export const authRateLimit = rateLimit(10, 60_000);
export const apiRateLimit = rateLimit(100, 60_000);
