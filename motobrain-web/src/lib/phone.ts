/** Extrae los 10 dígitos locales de un teléfono colombiano guardado o escrito a mano. */
export function extractColombiaLocalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length >= 12) {
    return digits.slice(2, 12);
  }
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits.slice(0, 10);
}

/** Formato E.164 para Colombia: +573001234567 */
export function toColombiaE164(local: string): string {
  const digits = local.replace(/\D/g, '').slice(0, 10);
  return digits.length > 0 ? `+57${digits}` : '';
}

/** Muestra 300 123 4567 mientras el usuario escribe. */
export function formatColombiaLocalDisplay(local: string): string {
  const d = local.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function isValidColombiaMobileE164(phone: string): boolean {
  return /^\+57[3][0-9]{9}$/.test(phone.replace(/\s/g, ''));
}
