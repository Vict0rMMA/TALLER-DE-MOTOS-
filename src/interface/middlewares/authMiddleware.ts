import { Request, Response, NextFunction } from 'express';
import { verifyToken, verifyCustomerToken } from '../../infrastructure/config/jwt';
import { DomainError } from '../../domain/errors/DomainError';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization) return next(new DomainError('Token requerido', 401));

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new DomainError('Formato inválido: Bearer <token>', 401));

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userName = payload.name;
    req.userEmail = payload.email;
    req.userRole = payload.role;
    req.workshopId = payload.workshopId;
    next();
  } catch {
    next(new DomainError('Token inválido o expirado', 401));
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.userRole!)) {
      return next(new DomainError(`Acceso restringido. Rol requerido: ${roles.join(' o ')}`, 403));
    }
    next();
  };
};

export const authenticateCustomer = (req: Request, _res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization) return next(new DomainError('Token requerido', 401));

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new DomainError('Formato inválido: Bearer <token>', 401));

  try {
    const payload = verifyCustomerToken(token);
    req.customerId = payload.customerId;
    req.workshopId = payload.workshopId;
    next();
  } catch {
    next(new DomainError('Token inválido o expirado', 401));
  }
};
