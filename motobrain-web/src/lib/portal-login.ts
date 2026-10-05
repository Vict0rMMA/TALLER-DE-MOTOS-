/** Normaliza placa y cédula antes de enviar al portal (misma lógica que la API). */
export function buildPortalLoginPayload(placa: string, cedula: string) {
  const normalizedPlaca = placa.trim().toUpperCase();
  const normalizedCedula = cedula.replace(/\D/g, '') || cedula.trim();

  return { placa: normalizedPlaca, password: normalizedCedula };
}

export function formatPortalLoginError(message: string): string {
  if (/contraseña/i.test(message)) {
    return 'Placa o cédula incorrectos. Si acabas de activar el portal, actualiza la API en el VPS (git pull y pm2 restart).';
  }
  if (/cédula|cedula/i.test(message)) {
    return `${message} Verifica que el taller haya activado tu portal y que la cédula coincida con la ficha del cliente.`;
  }
  return message;
}
