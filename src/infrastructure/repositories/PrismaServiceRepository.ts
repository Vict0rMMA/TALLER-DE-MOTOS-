import prisma from '../prisma/client';
import { Service } from '../../domain/entities/Service';
import { ServiceRepository, ServiceWithProducts } from '../../domain/repositories/ServiceRepository';

export class PrismaServiceRepository implements ServiceRepository {
  async findById(id: string, workshopId: string): Promise<ServiceWithProducts | null> {
    const r = await (prisma as any).service.findFirst({
      where: { id, workshopId },
      include: { products: true },
    });
    if (!r) return null;
    return { ...this.toDomain(r), products: r.products };
  }

  async findByWorkshop(workshopId: string, status?: string, page = 1, limit = 20): Promise<Service[]> {
    const rows = await (prisma as any).service.findMany({
      where: { workshopId, ...(status && { status }) },
      orderBy: { serviceDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return rows.map(this.toDomain);
  }

  async findByMotorcycle(motorcycleId: string): Promise<Service[]> {
    const rows = await (prisma as any).service.findMany({
      where: { motorcycleId },
      orderBy: { serviceDate: 'desc' },
    });
    return rows.map(this.toDomain);
  }

  async findUpcomingMaintenance(workshopId: string, days: number): Promise<Service[]> {
    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    const rows = await (prisma as any).service.findMany({
      where: {
        workshopId,
        status: 'closed',
        nextMaintenanceDate: { lte: limit, gte: new Date() },
      },
      orderBy: { nextMaintenanceDate: 'asc' },
    });
    return rows.map(this.toDomain);
  }

  async create(data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
    const r = await (prisma as any).service.create({ data });
    return this.toDomain(r);
  }

  async update(id: string, workshopId: string, data: Partial<Omit<Service, 'id' | 'workshopId' | 'createdAt' | 'updatedAt'>>): Promise<Service> {
    const r = await (prisma as any).service.update({ where: { id }, data });
    return this.toDomain(r);
  }

  async close(id: string, workshopId: string, closedAt: Date): Promise<Service> {
    const r = await (prisma as any).service.update({
      where: { id },
      data: { status: 'closed', closedAt },
    });
    return this.toDomain(r);
  }

  async count(workshopId: string, status?: string): Promise<number> {
    return (prisma as any).service.count({ where: { workshopId, ...(status && { status }) } });
  }

  private toDomain(r: any): Service {
    return {
      id: r.id,
      workshopId: r.workshopId,
      motorcycleId: r.motorcycleId,
      mechanicId: r.mechanicId,
      type: r.type,
      description: r.description ?? undefined,
      laborCost: Number(r.laborCost),
      totalCost: Number(r.totalCost),
      kmAtService: r.kmAtService,
      nextMaintenanceKm: r.nextMaintenanceKm ?? undefined,
      nextMaintenanceDate: r.nextMaintenanceDate ?? undefined,
      status: r.status,
      serviceDate: r.serviceDate,
      closedAt: r.closedAt ?? undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
