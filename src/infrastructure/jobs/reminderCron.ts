import { PrismaReminderRepository } from '../repositories/PrismaReminderRepository';
import { SendReminder } from '../../application/usecases/reminders/SendReminder';

export async function runReminderCron(): Promise<void> {
  if (process.env.ENABLE_WHATSAPP !== 'true') return;

  const { WhatsAppWebService } = await import('../whatsapp/WhatsAppWebService');
  const reminderRepo = new PrismaReminderRepository();
  const whatsapp = new WhatsAppWebService();
  const sendReminder = new SendReminder(reminderRepo, whatsapp);

  const now = new Date();
  const pending = await reminderRepo.findPending(now);

  for (const reminder of pending) {
    try {
      await sendReminder.execute(reminder.id);
    } catch (err) {
      console.error(`[reminderCron] Error enviando reminder ${reminder.id}:`, err);
    }
  }
}
