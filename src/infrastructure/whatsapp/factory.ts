import { WhatsAppService } from '../../domain/services/WhatsAppService';
import { WhatsAppWebService, getWhatsAppStatus } from './WhatsAppWebService';
import { MetaWhatsAppService } from './MetaWhatsAppService';
import { TwilioWhatsAppService } from './TwilioWhatsAppService';

export function getWhatsAppProvider(): string {
  return (process.env.WHATSAPP_PROVIDER ?? 'web').trim().toLowerCase();
}

/**
 * Devuelve la implementación de WhatsApp según `WHATSAPP_PROVIDER`:
 *   - 'twilio' → Twilio (BSP oficial, serverless-friendly)
 *   - 'meta'   → Meta Cloud API
 *   - 'web' / sin definir → whatsapp-web.js (comportamiento actual por defecto)
 *
 * Cambiar de canal en producción es solo cambiar esta variable de entorno.
 */
export function getWhatsAppService(): WhatsAppService {
  switch (getWhatsAppProvider()) {
    case 'twilio':
      return new TwilioWhatsAppService();
    case 'meta':
      return new MetaWhatsAppService();
    default:
      return new WhatsAppWebService();
  }
}

/**
 * ¿El canal configurado puede enviar ahora?
 *   - twilio / meta → basta con tener las credenciales (no hay sesión/QR).
 *   - web → la sesión de whatsapp-web.js debe estar conectada (QR escaneado).
 * Útil para decidir entre WhatsApp y el fallback de email sin lanzar excepciones.
 */
export function isWhatsAppReady(): boolean {
  switch (getWhatsAppProvider()) {
    case 'twilio':
      return !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_WHATSAPP_FROM
      );
    case 'meta':
      return !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
    default: {
      const s = getWhatsAppStatus();
      return s.enabled && s.isReady;
    }
  }
}
