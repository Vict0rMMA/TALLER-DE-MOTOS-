import { ReminderRepository } from '../../../domain/repositories/ReminderRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { ReminderStatus } from '../../../domain/entities/Reminder';

export class UpdateReminderStatus {
  constructor(private readonly reminderRepo: ReminderRepository) {}

  async execute(id: string, status: ReminderStatus): Promise<void> {
    const reminder = await this.reminderRepo.findById(id);
    if (!reminder) throw new DomainError('Recordatorio no encontrado', 404);

    await this.reminderRepo.updateStatus(id, status);
  }
}
