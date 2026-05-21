import { extractColombiaLocalPhone, toColombiaE164 } from '@/lib/phone';

/** Normaliza celular y cédula antes de enviar al portal (misma lógica que la API). */
export function buildPortalLoginPayload(phone: string, cedula: string) {
  const local = extractColombiaLocalPhone(phone.trim());
  const normalizedPhone =
    local.length === 10 ? toColombiaE164(local) : phone.trim();
  const normalizedCedula = cedula.replace(/\D/g, '') || cedula.trim();

  return { phone: normalizedPhone, password: normalizedCedula };
}

export function formatPortalLoginError(message: string): string {
  if (/contraseña/i.test(message)) {
    return 'Celular o cédula incorrectos. Si acabas de activar el portal, actualiza la API en el VPS (git pull y pm2 restart).';
  }
  if (/cédula|cedula/i.test(message)) {
    return `${message} Verifica que el taller haya activado tu portal y que la cédula coincida con la ficha del cliente.`;
  }
  return message;
}
