import prisma from '../prisma/client';
import { Workshop } from '../../domain/entities/Workshop';
import { WorkshopRepository } from '../../domain/repositories/WorkshopRepository';

export class PrismaWorkshopRepository implements WorkshopRepository {
  async findById(id: string): Promise<Workshop | null> {
    const r = await (prisma as any).workshop.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByNit(nit: string): Promise<Workshop | null> {
    const r = await (prisma as any).workshop.findUnique({ where: { nit } });
    return r ? this.toDomain(r) : null;
  }

  async create(data: Omit<Workshop, 'id' | 'createdAt'>): Promise<Workshop> {
    const r = await (prisma as any).workshop.create({ data });
    return this.toDomain(r);
  }

  async update(id: string, data: Partial<Omit<Workshop, 'id' | 'createdAt'>>): Promise<Workshop> {
    const r = await (prisma as any).workshop.update({ where: { id }, data });
    return this.toDomain(r);
  }

  private toDomain(r: any): Workshop {
    return {
      id: r.id,
      name: r.name,
      nit: r.nit ?? undefined,
      phone: r.phone ?? undefined,
      address: r.address ?? undefined,
      plan: r.plan,
      createdAt: r.createdAt,
    };
  }
}
