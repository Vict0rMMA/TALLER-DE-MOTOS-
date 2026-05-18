import { User } from '../entities/User';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByWorkshop(workshopId: string): Promise<User[]>;
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User>;
}
