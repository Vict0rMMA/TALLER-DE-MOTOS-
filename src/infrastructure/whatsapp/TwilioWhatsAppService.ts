import twilio, { Twilio } from 'twilio';
import { WhatsAppService } from '../../domain/services/WhatsAppService';
import { DomainError } from '../../domain/errors/DomainError';
import { renderTemplateText } from './templates';
import { normalizePhoneDigits } from '../phone/phoneVariants';

/**
 * Convierte un teléfono colombiano a formato E.164 (`+57XXXXXXXXXX`).
 * Acepta 10 dígitos (local) o 12 con prefijo 57.
 */
function toE164(raw: string): string {
  const digits = normalizePhoneDigits(raw);
  if (digits.length === 10) return `+57${digits}`;
  if (digits.startsWith('57') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('+')) return digits;
  return `+${digits}`;
}

/**
 * Canal WhatsApp vía Twilio (BSP oficial). Serverless-friendly: solo hace
 * llamadas REST a la API de Twilio, sin Chrome ni sesión persistente.
 *
 * En esta fase (Sandbox / ventana de 24h) `sendTemplate` renderiza la plantilla
 * a texto plano y la envía como mensaje libre — idéntico al texto de los demás
 * canales. Las Content Templates aprobadas (para fuera de las 24h en producción)
 * quedan como follow-up.
 */
export class TwilioWhatsAppService implements WhatsAppService {
  private readonly client: Twilio | null;
  private readonly from: string;

  constructor() {
    const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const token = process.env.TWILIO_AUTH_TOKEN?.trim();
    this.from = process.env.TWILIO_WHATSAPP_FROM?.trim() ?? '';

    if (!sid || !token || !this.from) {
      console.warn('[WhatsApp/Twilio] Credenciales no configuradas — mensajes desactivados');
      this.client = null;
    } else {
      this.client = twilio(sid, token);
    }
  }

  async sendMessage(phone: string, message: string): Promise<void> {
    if (!this.client) return;

    const fromAddr = this.from.startsWith('whatsapp:') ? this.from : `whatsapp:${this.from}`;
    try {
      await this.client.messages.create({
        from: fromAddr,
        to: `whatsapp:${toE164(phone)}`,
        body: message,
      });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      throw new DomainError(`Twilio WhatsApp error: ${e?.message ?? 'envío fallido'}`, e?.status ?? 502);
    }
  }

  async sendTemplate(phone: string, templateId: string, params: Record<string, string>): Promise<void> {
    await this.sendMessage(phone, renderTemplateText(templateId, params));
  }
}
