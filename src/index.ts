import 'reflect-metadata';
import app from './app';
import { env } from './infrastructure/config/env';
import { runReminderCron } from './infrastructure/jobs/reminderCron';

if (process.env.ENABLE_WHATSAPP === 'true') {
  import('./infrastructure/whatsapp/WhatsAppWebService')
    .then(({ WhatsAppWebService }) => {
      new WhatsAppWebService();
      console.log('[WhatsApp] Iniciando bot...');
    })
    .catch((err) => console.error('[WhatsApp] No se pudo cargar:', err.message));
} else {
  console.log('[WhatsApp] Desactivado — pon ENABLE_WHATSAPP=true para activar el bot');
}

const ONE_HOUR = 60 * 60 * 1000;
setInterval(() => {
  runReminderCron().catch((err) => console.error('[reminderCron] Error:', err));
}, ONE_HOUR);

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[API] Corriendo en puerto ${env.PORT} (${env.NODE_ENV})`);
});
