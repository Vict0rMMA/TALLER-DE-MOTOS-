import { PrismaReminderRepository } from '../repositories/PrismaReminderRepository';
import { SendReminder } from '../../application/usecases/reminders/SendReminder';
import { getWhatsAppService, isWhatsAppReady } from '../whatsapp/factory';

export async function runReminderCron(): Promise<void> {
  if (!isWhatsAppReady()) return;

  const reminderRepo = new PrismaReminderRepository();
  const whatsapp = getWhatsAppService();
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
