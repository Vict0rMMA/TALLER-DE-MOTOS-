/** Normaliza la placa antes de enviar al portal (misma lógica que la API). */
export function buildPortalLoginPayload(placa: string) {
  return { placa: placa.trim().toUpperCase() };
}

export function formatPortalLoginError(message: string): string {
  if (/no encontrada|portal no activado/i.test(message)) {
    return `${message} Verifica que el taller haya activado tu portal.`;
  }
  return message;
}
