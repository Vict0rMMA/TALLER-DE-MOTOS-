import jwt from 'jsonwebtoken';
import { env } from './env';
import { UserRole } from '../../domain/entities/User';

export type JwtPayload = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  workshopId: string;
};

export type CustomerJwtPayload = {
  type: 'customer';
  customerId: string;
  workshopId: string;
  name: string;
  phone: string;
};

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const signCustomerToken = (payload: Omit<CustomerJwtPayload, 'type'>): string => {
  return jwt.sign({ ...payload, type: 'customer' }, env.JWT_SECRET, { expiresIn: '30d' });
};

export const verifyCustomerToken = (token: string): CustomerJwtPayload => {
  const payload = jwt.verify(token, env.JWT_SECRET) as CustomerJwtPayload;
  if (payload.type !== 'customer') throw new Error('Invalid token type');
  return payload;
};
