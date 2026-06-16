import { WhatsAppService } from '../../domain/services/WhatsAppService';
import { DomainError } from '../../domain/errors/DomainError';
import { TEMPLATES, TemplateId } from './templates';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0';

export class MetaWhatsAppService implements WhatsAppService {
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? '';
    if (!this.phoneNumberId || !this.accessToken) {
      console.warn('[WhatsApp] Credenciales no configuradas — mensajes desactivados');
    }
  }

  async sendTemplate(phone: string, templateId: string, params: Record<string, string>): Promise<void> {
    if (!this.phoneNumberId) return;

    const template = TEMPLATES[templateId as TemplateId];
    if (!template) throw new DomainError(`Template '${templateId}' no existe`, 400);

    // Solo las variables numeradas ({{1}}, {{2}}, …) en orden; ignora claves
    // auxiliares como 'w' (nombre del taller) que usan los canales de texto libre.
    const numbered = Object.keys(params)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => ({ type: 'text', text: params[k] }));
    const components = numbered.length > 0 ? [{ type: 'body', parameters: numbered }] : [];

    await this.callApi(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: { name: template.name, language: { code: template.language }, components },
    });
  }

  async sendMessage(phone: string, message: string): Promise<void> {
    if (!this.phoneNumberId) return;

    await this.callApi(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message },
    });
  }

  private async callApi(path: string, body: object): Promise<void> {
    const res = await fetch(`${WHATSAPP_API_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new DomainError(`WhatsApp API error: ${err?.error?.message ?? res.statusText}`, 502);
    }
  }
}
