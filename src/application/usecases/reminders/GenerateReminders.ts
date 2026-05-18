import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';
import { ReminderRepository } from '../../../domain/repositories/ReminderRepository';

export class GenerateReminders {
  constructor(
    private readonly serviceRepo: ServiceRepository,
    private readonly reminderRepo: ReminderRepository,
  ) {}

  async execute(workshopId: string, daysAhead = 7): Promise<number> {
    const upcoming = await this.serviceRepo.findUpcomingMaintenance(workshopId, daysAhead);

    const reminders = upcoming.map(s => ({
      customerId: '',
      motorcycleId: s.motorcycleId,
      type: 'maintenance',
      scheduledDate: s.nextMaintenanceDate!,
      status: 'pending' as const,
      channel: 'whatsapp',
      attempts: 0,
    }));

    return this.reminderRepo.createMany(reminders);
  }
}
