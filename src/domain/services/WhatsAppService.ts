export interface WhatsAppService {
  sendTemplate(phone: string, templateId: string, params: Record<string, string>): Promise<void>;
  sendMessage(phone: string, message: string): Promise<void>;
}
