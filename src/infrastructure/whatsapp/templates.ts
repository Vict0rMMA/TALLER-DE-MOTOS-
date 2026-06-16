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

/** Línea divisoria + encabezado con el nombre del taller. */
const DIV = '━━━━━━━━━━━━━━━';
const header = (p: Record<string, string>) => `🏍️ *${shopName(p)}*\n${DIV}`;

const TEMPLATE_TEXT: Record<string, (p: Record<string, string>) => string> = {
  maintenance_reminder: (p) => {
    const d = Number(p['3']);
    const plazo =
      !Number.isFinite(d) || d <= 0
        ? 'para hoy'
        : d === 1
          ? 'para mañana'
          : `en ${d} días`;
    return `${header(p)}\n🔔 *Recordatorio de mantenimiento*\n\nHola ${p['1']}, tu moto *${p['2']}* tiene su próximo mantenimiento ${plazo}.\n\nResponde a este mensaje y te agendamos la cita. 🔧`;
  },

  service_completed: (p) =>
    `${header(p)}\n✅ *Tu moto ya está lista*\n\n*Cliente:* ${p['1']}\n*Moto:* ${p['2']}\n*Servicio:* ${p['3'] || 'Mantenimiento'}\n*Total:* $${p['4'] || '0'}\n\nPuedes pasar a recogerla cuando quieras. Cualquier duda, respóndenos por aquí. 🙌`,

  low_stock_alert: (p) =>
    `⚠️ *Stock bajo*\n${DIV}\n*${p['1']}*\nQuedan *${p['2']}* unidades (mínimo: ${p['3']}).\n\nConviene reabastecer pronto. 📦`,

  diagnosis_ready: (p) =>
    `${header(p)}\n🔍 *Diagnóstico listo*\n\nHola ${p['1']}, ya revisamos tu moto *${p['2']}*.\n\nRespóndenos por aquí y te contamos qué encontramos y qué te recomendamos.`,

  consultation_answered: (p) =>
    `${header(p)}\n💬 *Respuesta a tu consulta*\n\nHola ${p['1']}, sobre tu moto *${p['2']}*:\n\n“${p['3']}”\n\n${p['4'] ? `*Cotización estimada:* ${p['4']}\n\n` : ''}Si quieres avanzar, respóndenos por aquí o agéndalo desde el portal.`,

  appointment_confirmed: (p) =>
    `${header(p)}\n✅ *Cita confirmada*\n\n*Moto:* ${p['2']}\n*Fecha:* ${p['3']}\n\nTe esperamos, ${p['1']}. Si necesitas cambiarla, respóndenos por aquí.`,
};

export function renderTemplateText(templateId: string, params: Record<string, string>): string {
  const builder = TEMPLATE_TEXT[templateId];
  return builder ? builder(params) : `${shopName(params)}: ${JSON.stringify(params)}`;
}
