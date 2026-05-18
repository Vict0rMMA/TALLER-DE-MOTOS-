export type TemplateId =
  | 'maintenance_reminder'
  | 'service_completed'
  | 'low_stock_alert'
  | 'diagnosis_ready';

export type TemplateParams = Record<string, string>;

export const TEMPLATES: Record<TemplateId, { name: string; language: string }> = {
  maintenance_reminder: { name: 'motobrain_mantenimiento', language: 'es' },
  service_completed: { name: 'motobrain_servicio_listo', language: 'es' },
  low_stock_alert: { name: 'motobrain_bajo_stock', language: 'es' },
  diagnosis_ready: { name: 'motobrain_diagnostico', language: 'es' },
};

export const buildMaintenanceReminderParams = (
  customerName: string,
  motorcyclePlaca: string,
  daysUntil: number,
): TemplateParams => ({
  '1': customerName,
  '2': motorcyclePlaca,
  '3': String(daysUntil),
});
