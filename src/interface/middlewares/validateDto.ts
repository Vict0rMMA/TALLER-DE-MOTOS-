import { Request, Response, NextFunction } from 'express';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { DomainError } from '../../domain/errors/DomainError';

const flattenErrors = (errors: ValidationError[], path = ''): string[] => {
  const msgs: string[] = [];
  for (const e of errors) {
    const p = path ? `${path}.${e.property}` : e.property;
    if (e.constraints) msgs.push(...Object.values(e.constraints).map(c => `${p}: ${c}`));
    if (e.children?.length) msgs.push(...flattenErrors(e.children, p));
  }
  return msgs;
};

export const validateDto = <T extends object>(
  Dto: ClassConstructor<T>,
  source: 'body' | 'query' | 'params' = 'body',
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const instance = plainToInstance(Dto, req[source] ?? {}, { enableImplicitConversion: false });
    const errors = await validate(instance as object, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) {
      return next(new DomainError(`Datos inválidos: ${flattenErrors(errors).join('; ')}`, 400));
    }
    (req as any)[source] = instance;
    next();
  };
};
