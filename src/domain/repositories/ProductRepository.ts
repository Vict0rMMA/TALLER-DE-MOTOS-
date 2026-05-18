import { Product } from '../entities/Product';

export interface ProductRepository {
  findById(id: string, workshopId: string): Promise<Product | null>;
  findBySku(sku: string, workshopId: string): Promise<Product | null>;
  findByWorkshop(workshopId: string, category?: string): Promise<Product[]>;
  findLowStock(workshopId: string): Promise<Product[]>;
  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, workshopId: string, data: Partial<Omit<Product, 'id' | 'workshopId' | 'createdAt' | 'updatedAt'>>): Promise<Product>;
  delete(id: string, workshopId: string): Promise<void>;
  incrementStock(id: string, quantity: number): Promise<Product>;
  decrementStock(id: string, quantity: number): Promise<Product>;
}
