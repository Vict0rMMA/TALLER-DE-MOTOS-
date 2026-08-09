/**
 * Extrae los 10 dígitos locales de un teléfono colombiano guardado o escrito a mano.
 *
 * Solo quita el indicativo 57 cuando viene marcado como tal: con `+` delante, o
 * completo a 12 dígitos. Un 57 al principio de algo a medio escribir son dígitos
 * que tecleó el usuario, no el país — quitarlos duplicaba lo que se veía en pantalla.
 */
export function extractColombiaLocalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+') && digits.startsWith('57')) {
    return digits.slice(2, 12);
  }
  if (digits.length === 12 && digits.startsWith('57')) {
    return digits.slice(2, 12);
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
