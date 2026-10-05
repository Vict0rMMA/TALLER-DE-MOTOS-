import { Motorcycle } from '../entities/Motorcycle';

export interface MotorcycleRepository {
  findById(id: string, workshopId: string): Promise<Motorcycle | null>;
  findByPlaca(placa: string, customerId?: string): Promise<Motorcycle | null>;
  findByCustomer(customerId: string): Promise<Motorcycle[]>;
  create(data: Omit<Motorcycle, 'id' | 'createdAt'>): Promise<Motorcycle>;
  update(id: string, data: Partial<Omit<Motorcycle, 'id' | 'createdAt'>>): Promise<Motorcycle>;
}
