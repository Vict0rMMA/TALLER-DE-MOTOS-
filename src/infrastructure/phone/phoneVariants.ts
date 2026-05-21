/** Normaliza y genera variantes comunes de teléfono colombiano para búsqueda en BD. */
export function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function phoneLookupVariants(raw: string): string[] {
  const digits = normalizePhoneDigits(raw);
  if (!digits) return [];

  const variants = new Set<string>([digits, raw.trim()]);

  if (digits.length === 10) {
    variants.add(`57${digits}`);
    variants.add(`+57${digits}`);
  }
  if (digits.startsWith('57') && digits.length === 12) {
    variants.add(digits.slice(2));
    variants.add(`+${digits}`);
  }

  return [...variants];
}
