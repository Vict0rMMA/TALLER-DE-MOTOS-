import { Workshop } from '../entities/Workshop';

export interface WorkshopRepository {
  findById(id: string): Promise<Workshop | null>;
  findByNit(nit: string): Promise<Workshop | null>;
  create(data: Omit<Workshop, 'id' | 'createdAt'>): Promise<Workshop>;
  update(id: string, data: Partial<Omit<Workshop, 'id' | 'createdAt'>>): Promise<Workshop>;
}
