import prisma from '../prisma/client';
import { Motorcycle } from '../../domain/entities/Motorcycle';
import { MotorcycleRepository } from '../../domain/repositories/MotorcycleRepository';

export class PrismaMotorcycleRepository implements MotorcycleRepository {
  async findById(id: string): Promise<Motorcycle | null> {
    const r = await (prisma as any).motorcycle.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByPlaca(placa: string, customerId?: string): Promise<Motorcycle | null> {
    const where = customerId ? { customerId, placa } : { placa };
    const r = await (prisma as any).motorcycle.findFirst({ where });
    return r ? this.toDomain(r) : null;
  }

  async findByCustomer(customerId: string): Promise<Motorcycle[]> {
    const rows = await (prisma as any).motorcycle.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toDomain);
  }

  async create(data: Omit<Motorcycle, 'id' | 'createdAt'>): Promise<Motorcycle> {
    const r = await (prisma as any).motorcycle.create({ data });
    return this.toDomain(r);
  }

  async update(id: string, data: Partial<Omit<Motorcycle, 'id' | 'createdAt'>>): Promise<Motorcycle> {
    const r = await (prisma as any).motorcycle.update({ where: { id }, data });
    return this.toDomain(r);
  }

  private toDomain(r: any): Motorcycle {
    return {
      id: r.id,
      customerId: r.customerId,
      placa: r.placa,
      brand: r.brand,
      model: r.model,
      cc: r.cc,
      year: r.year ?? undefined,
      kmCurrent: r.kmCurrent,
      createdAt: r.createdAt,
    };
  }
}
