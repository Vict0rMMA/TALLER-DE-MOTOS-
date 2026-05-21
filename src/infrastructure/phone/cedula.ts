/** Solo dígitos — para comparar cédula en login del portal. */
export function normalizeCedula(value: string): string {
  return value.replace(/\D/g, '');
}
