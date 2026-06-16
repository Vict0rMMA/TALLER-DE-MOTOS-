import { ReminderRepository } from '../../../domain/repositories/ReminderRepository';
import { WhatsAppService } from '../../../domain/services/WhatsAppService';
import { DomainError } from '../../../domain/errors/DomainError';
import prisma from '../../../infrastructure/prisma/client';

export class SendReminder {
  constructor(
    private readonly reminderRepo: ReminderRepository,
    private readonly whatsapp: WhatsAppService,
  ) {}

  async execute(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepo.findById(reminderId);
    if (!reminder) throw new DomainError('Recordatorio no encontrado', 404);
    if (reminder.status !== 'pending') throw new DomainError('El recordatorio ya fue procesado', 422);

    const row = await (prisma as any).reminder.findUnique({
      where: { id: reminderId },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            optInWhatsapp: true,
            workshop: { select: { name: true } },
          },
        },
        motorcycle: { select: { placa: true } },
      },
    });

    if (!row?.customer) throw new DomainError('Cliente del recordatorio no encontrado', 404);

    if (!row.customer.optInWhatsapp || !String(row.customer.phone ?? '').trim()) {
      await this.reminderRepo.updateStatus(reminderId, 'failed', new Date());
      return;
    }

    const afterAttempt = await this.reminderRepo.incrementAttempts(reminderId);

    const msDay = 86400000;
    const days = Math.max(
      0,
      Math.ceil((new Date(reminder.scheduledDate).getTime() - Date.now()) / msDay),
    );

    try {
      await this.whatsapp.sendTemplate(row.customer.phone, reminder.templateId ?? 'maintenance_reminder', {
        '1': row.customer.name ?? 'Cliente',
        '2': row.motorcycle?.placa ?? '',
        '3': String(days),
        'w': row.customer.workshop?.name ?? '',
      });
      await this.reminderRepo.updateStatus(reminderId, 'sent', new Date());
    } catch {
      if (afterAttempt.attempts >= 3) {
        await this.reminderRepo.updateStatus(reminderId, 'failed', new Date());
      }
      throw new DomainError('Error al enviar recordatorio', 502);
    }
  }
}
