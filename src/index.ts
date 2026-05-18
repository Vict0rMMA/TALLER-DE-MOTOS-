import 'reflect-metadata';
import app from './app';
import { env } from './infrastructure/config/env';
import { WhatsAppWebService } from './infrastructure/whatsapp/WhatsAppWebService';
import { runReminderCron } from './infrastructure/jobs/reminderCron';

new WhatsAppWebService();

const ONE_HOUR = 60 * 60 * 1000;
setInterval(() => {
  runReminderCron().catch((err) => console.error('[reminderCron] Error:', err));
}, ONE_HOUR);

app.listen(env.PORT, '0.0.0.0');
