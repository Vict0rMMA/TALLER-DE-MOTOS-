import prisma from '../prisma/client';
import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const r = await (prisma as any).user.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const r = await (prisma as any).user.findUnique({ where: { email } });
    return r ? this.toDomain(r) : null;
  }

  async findByWorkshop(workshopId: string): Promise<User[]> {
    const rows = await (prisma as any).user.findMany({ where: { workshopId, active: true } });
    return rows.map(this.toDomain);
  }

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const r = await (prisma as any).user.create({ data });
    return this.toDomain(r);
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    const r = await (prisma as any).user.update({ where: { id }, data });
    return this.toDomain(r);
  }

  private toDomain(r: any): User {
    return {
      id: r.id,
      workshopId: r.workshopId,
      name: r.name,
      email: r.email,
      passwordHash: r.passwordHash,
      role: r.role,
      active: r.active,
      createdAt: r.createdAt,
    };
  }
}
