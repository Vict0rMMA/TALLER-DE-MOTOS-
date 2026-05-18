import { Service } from '../entities/Service';

export type ServiceWithProducts = Service & {
  products: Array<{ productId: string; quantity: number; unitPrice: number }>;
};

export interface ServiceRepository {
  findById(id: string, workshopId: string): Promise<ServiceWithProducts | null>;
  findByWorkshop(workshopId: string, status?: string, page?: number, limit?: number): Promise<Service[]>;
  findByMotorcycle(motorcycleId: string): Promise<Service[]>;
  findUpcomingMaintenance(workshopId: string, days: number): Promise<Service[]>;
  create(data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service>;
  update(id: string, workshopId: string, data: Partial<Omit<Service, 'id' | 'workshopId' | 'createdAt' | 'updatedAt'>>): Promise<Service>;
  close(id: string, workshopId: string, closedAt: Date): Promise<Service>;
  count(workshopId: string, status?: string): Promise<number>;
}
