import { Customer } from '../entities/Customer';

export interface CustomerRepository {
  findById(id: string, workshopId: string): Promise<Customer | null>;
  findByCedula(cedula: string, workshopId: string): Promise<Customer | null>;
  findByPhone(phone: string, workshopId: string): Promise<Customer | null>;
  findByWorkshop(workshopId: string, page?: number, limit?: number): Promise<Customer[]>;
  search(workshopId: string, query: string): Promise<Customer[]>;
  create(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>;
  update(id: string, workshopId: string, data: Partial<Omit<Customer, 'id' | 'workshopId' | 'createdAt'>>): Promise<Customer>;
  count(workshopId: string): Promise<number>;
}
