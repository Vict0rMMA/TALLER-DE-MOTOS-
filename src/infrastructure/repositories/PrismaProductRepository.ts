import prisma from '../prisma/client';
import { Product } from '../../domain/entities/Product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';

export class PrismaProductRepository implements ProductRepository {
  async findById(id: string, workshopId: string): Promise<Product | null> {
    const r = await (prisma as any).product.findFirst({ where: { id, workshopId } });
    return r ? this.toDomain(r) : null;
  }

  async findBySku(sku: string, workshopId: string): Promise<Product | null> {
    const r = await (prisma as any).product.findFirst({ where: { sku, workshopId } });
    return r ? this.toDomain(r) : null;
  }

  async findByWorkshop(workshopId: string, category?: string): Promise<Product[]> {
    const rows = await (prisma as any).product.findMany({
      where: { workshopId, active: true, ...(category && { category }) },
      orderBy: { name: 'asc' },
    });
    return rows.map(this.toDomain);
  }

  async findLowStock(workshopId: string): Promise<Product[]> {
    const rows = await (prisma as any).product.findMany({
      where: { workshopId, active: true },
    });
    return rows.filter((r: any) => r.stock <= r.stockMin).map(this.toDomain);
  }

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const r = await (prisma as any).product.create({ data });
    return this.toDomain(r);
  }

  async update(id: string, workshopId: string, data: Partial<Omit<Product, 'id' | 'workshopId' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    const r = await (prisma as any).product.update({ where: { id }, data });
    return this.toDomain(r);
  }

  async delete(id: string, workshopId: string): Promise<void> {
    await (prisma as any).product.update({ where: { id }, data: { active: false } });
  }

  async incrementStock(id: string, quantity: number): Promise<Product> {
    const r = await (prisma as any).product.update({
      where: { id },
      data: { stock: { increment: quantity } },
    });
    return this.toDomain(r);
  }

  async decrementStock(id: string, quantity: number): Promise<Product> {
    const r = await (prisma as any).product.update({
      where: { id },
      data: { stock: { decrement: quantity } },
    });
    return this.toDomain(r);
  }

  private toDomain(r: any): Product {
    return {
      id: r.id,
      workshopId: r.workshopId,
      sku: r.sku,
      name: r.name,
      brand: r.brand ?? undefined,
      category: r.category,
      compatibility: r.compatibility ?? [],
      stock: r.stock,
      stockMin: r.stockMin,
      cost: Number(r.cost),
      price: Number(r.price),
      barcode: r.barcode ?? undefined,
      active: r.active,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
