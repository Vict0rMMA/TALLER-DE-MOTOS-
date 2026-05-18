import { Reminder, ReminderStatus } from '../entities/Reminder';

export interface ReminderRepository {
  findById(id: string): Promise<Reminder | null>;
  findPending(before: Date): Promise<Reminder[]>;
  findByCustomer(customerId: string): Promise<Reminder[]>;
  create(data: Omit<Reminder, 'id' | 'createdAt'>): Promise<Reminder>;
  createMany(data: Array<Omit<Reminder, 'id' | 'createdAt'>>): Promise<number>;
  updateStatus(id: string, status: ReminderStatus, lastAttemptAt?: Date): Promise<Reminder>;
  incrementAttempts(id: string): Promise<Reminder>;
}
