import prisma from '../prisma/client';
import { Reminder, ReminderStatus } from '../../domain/entities/Reminder';
import { ReminderRepository } from '../../domain/repositories/ReminderRepository';

export class PrismaReminderRepository implements ReminderRepository {
  async findById(id: string): Promise<Reminder | null> {
    const r = await (prisma as any).reminder.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findPending(before: Date): Promise<Reminder[]> {
    const rows = await (prisma as any).reminder.findMany({
      where: { status: 'pending', scheduledDate: { lte: before } },
      orderBy: { scheduledDate: 'asc' },
    });
    return rows.map(this.toDomain);
  }

  async findByCustomer(customerId: string): Promise<Reminder[]> {
    const rows = await (prisma as any).reminder.findMany({
      where: { customerId },
      orderBy: { scheduledDate: 'desc' },
    });
    return rows.map(this.toDomain);
  }

  async create(data: Omit<Reminder, 'id' | 'createdAt'>): Promise<Reminder> {
    const r = await (prisma as any).reminder.create({ data });
    return this.toDomain(r);
  }

  async createMany(data: Array<Omit<Reminder, 'id' | 'createdAt'>>): Promise<number> {
    const result = await (prisma as any).reminder.createMany({ data, skipDuplicates: true });
    return result.count;
  }

  async updateStatus(id: string, status: ReminderStatus, lastAttemptAt?: Date): Promise<Reminder> {
    const r = await (prisma as any).reminder.update({
      where: { id },
      data: { status, ...(lastAttemptAt && { lastAttemptAt }) },
    });
    return this.toDomain(r);
  }

  async incrementAttempts(id: string): Promise<Reminder> {
    const r = await (prisma as any).reminder.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
    return this.toDomain(r);
  }

  private toDomain(r: any): Reminder {
    return {
      id: r.id,
      customerId: r.customerId,
      motorcycleId: r.motorcycleId,
      type: r.type,
      scheduledDate: r.scheduledDate,
      status: r.status,
      channel: r.channel,
      templateId: r.templateId ?? undefined,
      attempts: r.attempts,
      lastAttemptAt: r.lastAttemptAt ?? undefined,
      createdAt: r.createdAt,
    };
  }
}
