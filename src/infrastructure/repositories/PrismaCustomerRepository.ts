import prisma from '../prisma/client';
import { Customer } from '../../domain/entities/Customer';
import { CustomerRepository } from '../../domain/repositories/CustomerRepository';

export class PrismaCustomerRepository implements CustomerRepository {
  async findById(id: string, workshopId: string): Promise<Customer | null> {
    const r = await (prisma as any).customer.findFirst({ where: { id, workshopId } });
    return r ? this.toDomain(r) : null;
  }

  async findByCedula(cedula: string, workshopId: string): Promise<Customer | null> {
    const r = await (prisma as any).customer.findFirst({ where: { cedula, workshopId } });
    return r ? this.toDomain(r) : null;
  }

  async findByPhone(phone: string, workshopId: string): Promise<Customer | null> {
    const r = await (prisma as any).customer.findFirst({ where: { phone, workshopId } });
    return r ? this.toDomain(r) : null;
  }

  async findByWorkshop(workshopId: string, page = 1, limit = 50): Promise<Customer[]> {
    const rows = await (prisma as any).customer.findMany({
      where: { workshopId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    });
    return rows.map(this.toDomain);
  }

  async search(workshopId: string, query: string): Promise<Customer[]> {
    const rows = await (prisma as any).customer.findMany({
      where: {
        workshopId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { cedula: { contains: query } },
        ],
      },
      take: 20,
    });
    return rows.map(this.toDomain);
  }

  async create(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const r = await (prisma as any).customer.create({ data });
    return this.toDomain(r);
  }

  async update(id: string, workshopId: string, data: Partial<Omit<Customer, 'id' | 'workshopId' | 'createdAt'>>): Promise<Customer> {
    const r = await (prisma as any).customer.update({ where: { id }, data });
    return this.toDomain(r);
  }

  async count(workshopId: string): Promise<number> {
    return (prisma as any).customer.count({ where: { workshopId } });
  }

  private toDomain(r: any): Customer {
    return {
      id: r.id,
      workshopId: r.workshopId,
      name: r.name,
      cedula: r.cedula ?? undefined,
      phone: r.phone,
      email: r.email ?? undefined,
      optInWhatsapp: r.optInWhatsapp,
      portalActive: r.portalActive ?? false,
      createdAt: r.createdAt,
    };
  }
}
