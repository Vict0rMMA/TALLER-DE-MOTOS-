import { Request, Response, NextFunction } from 'express';
import { RegisterUser } from '../../application/usecases/auth/RegisterUser';
import { RegisterWorkshop } from '../../application/usecases/auth/RegisterWorkshop';
import { LoginUser } from '../../application/usecases/auth/LoginUser';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { PrismaWorkshopRepository } from '../../infrastructure/repositories/PrismaWorkshopRepository';
import { BcryptPasswordHasher } from '../../infrastructure/security/BcryptPasswordHasher';
import { DomainError } from '../../domain/errors/DomainError';

const userRepo = new PrismaUserRepository();
const workshopRepo = new PrismaWorkshopRepository();
const passwordHasher = new BcryptPasswordHasher();

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario', mechanic: 'Mecánico', seller: 'Vendedor',
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new RegisterUser(userRepo, workshopRepo, passwordHasher).execute(req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new RegisterWorkshop(userRepo, workshopRepo, passwordHasher).execute(req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await new LoginUser(userRepo, passwordHasher).execute(req.body);
    res.json(result);
  } catch (e) { next(e); }
};

export const getWorkshopUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userRepo.findByWorkshop(req.workshopId!);
    res.json(users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      roleLabel: ROLE_LABELS[u.role] ?? u.role,
      active: u.active,
      createdAt: u.createdAt,
    })));
  } catch (e) { next(e); }
};

export const getWorkshop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ws = await workshopRepo.findById(req.workshopId!);
    if (!ws) throw new DomainError('Taller no encontrado', 404);
    res.json(ws);
  } catch (e) { next(e); }
};

export const updateWorkshop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, address } = req.body as { name?: string; phone?: string; address?: string };
    const ws = await workshopRepo.update(req.workshopId!, {
      ...(name?.trim() && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone.trim() || undefined }),
      ...(address !== undefined && { address: address.trim() || undefined }),
    });
    res.json(ws);
  } catch (e) { next(e); }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const users = await userRepo.findByWorkshop(req.workshopId!);
    const target = users.find((u) => u.id === id);
    if (!target) throw new DomainError('Usuario no encontrado', 404);
    if (target.role === 'owner') throw new DomainError('No puedes desactivar al propietario', 403);
    await userRepo.update(id, { active: false });
    res.status(204).send();
  } catch (e) { next(e); }
};
