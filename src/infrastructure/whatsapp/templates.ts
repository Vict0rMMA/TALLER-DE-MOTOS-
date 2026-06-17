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

/**
 * Renderiza una plantilla a texto plano de WhatsApp.
 * Compartido por los canales que envían texto libre (whatsapp-web.js, Twilio
 * en sandbox / dentro de la ventana de 24h). Meta usa plantillas aprobadas y
 * no pasa por aquí.
 */
/** Nombre del taller que firma el mensaje (param 'w'); cae a algo neutral. */
const shopName = (p: Record<string, string>) => p['w']?.trim() || 'Tu taller';

/** Encabezado: nombre del taller en negrita (sin líneas de guiones — WhatsApp las muestra feas). */
const header = (p: Record<string, string>) => `🏍️ *${shopName(p)}*`;

/** Formatea un monto colombiano. Acepta crudo ("800000") o ya con puntos ("800.000"). */
const money = (v?: string) => {
  const digits = (v ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits).toLocaleString('es-CO') : v?.trim() || '0';
};

const TEMPLATE_TEXT: Record<string, (p: Record<string, string>) => string> = {
  maintenance_reminder: (p) => {
    const d = Number(p['3']);
    const plazo =
      !Number.isFinite(d) || d <= 0
        ? 'para hoy'
        : d === 1
          ? 'para mañana'
          : `en ${d} días`;
    return (
      `${header(p)}\n` +
      `\n` +
      `🔔 *Recordatorio de mantenimiento*\n` +
      `\n` +
      `Hola ${p['1']}, tu moto *${p['2']}* tiene su próximo mantenimiento ${plazo}.\n` +
      `\n` +
      `Responde a este mensaje y te agendamos la cita. 🔧`
    );
  },

  service_completed: (p) =>
    `${header(p)}\n` +
    `\n` +
    `✅ *¡Tu moto ya está lista!*\n` +
    `\n` +
    `*Cliente:* ${p['1']}\n` +
    `*Moto:* ${p['2']}\n` +
    `*Servicio:* ${p['3'] || 'Mantenimiento'}\n` +
    `*Total:* $${money(p['4'])}\n` +
    `\n` +
    `Puedes pasar a recogerla cuando quieras. Cualquier duda, respóndenos por aquí. 🙌`,

  low_stock_alert: (p) =>
    `⚠️ *Stock bajo*\n` +
    `\n` +
    `*${p['1']}*\n` +
    `Quedan *${p['2']}* unidades (mínimo: ${p['3']}).\n` +
    `\n` +
    `Conviene reabastecer pronto. 📦`,

  diagnosis_ready: (p) =>
    `${header(p)}\n` +
    `\n` +
    `🔍 *Diagnóstico listo*\n` +
    `\n` +
    `Hola ${p['1']}, ya revisamos tu moto *${p['2']}*.\n` +
    `\n` +
    `Respóndenos por aquí y te contamos qué encontramos y qué te recomendamos.`,

  consultation_answered: (p) =>
    `${header(p)}\n` +
    `\n` +
    `💬 *Respuesta a tu consulta*\n` +
    `\n` +
    `Hola ${p['1']}, sobre tu moto *${p['2']}*:\n` +
    `\n` +
    `“${p['3']}”\n` +
    `\n` +
    `${p['4'] ? `*Cotización estimada:* ${p['4']}\n\n` : ''}` +
    `Si quieres avanzar, respóndenos por aquí o agéndalo desde el portal.`,

  appointment_confirmed: (p) =>
    `${header(p)}\n` +
    `\n` +
    `✅ *Cita confirmada*\n` +
    `\n` +
    `*Moto:* ${p['2']}\n` +
    `*Fecha:* ${p['3']}\n` +
    `\n` +
    `Te esperamos, ${p['1']}. Si necesitas cambiarla, respóndenos por aquí.`,
};

export function renderTemplateText(templateId: string, params: Record<string, string>): string {
  const builder = TEMPLATE_TEXT[templateId];
  return builder ? builder(params) : `${shopName(params)}: ${JSON.stringify(params)}`;
}
