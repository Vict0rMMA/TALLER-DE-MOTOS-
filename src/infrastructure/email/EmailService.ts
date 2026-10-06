import nodemailer from 'nodemailer';
import { letter } from './emailLayout';

function createTransport() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/** Versión en texto de último recurso, por si no se pasa una escrita a mano. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<\/(p|div|tr|h1|h2|h3|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8226;/g, '-')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim();
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: { filename: string; content: Buffer; contentType: string }[],
  /** Versión en texto plano. Su ausencia es de los motivos más citados para
   *  marcar un correo como spam: los legítimos casi siempre llevan las dos. */
  text?: string,
): Promise<void> {
  const transport = createTransport();
  if (!transport) throw new Error('GMAIL_USER o GMAIL_APP_PASSWORD no configurados');
  await transport.sendMail({
    from: `"MotoBrain Taller" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text: text?.trim() || htmlToText(html),
    attachments,
  });
}

export function isEmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
}

/** Primer nombre, con la inicial en mayúscula — la BD guarda nombres en mayúscula sostenida. */
function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? '';
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '';
}

export function buildServiceEmailHtml(params: {
  customerName: string;
  placa: string;
  type: string;
  total: string;
  description?: string;
  workshopName?: string;
  workshopPhone?: string | null;
  workshopAddress?: string | null;
}): string {
  const {
    customerName,
    placa,
    type,
    total,
    description,
    workshopName = 'MotoBrain Taller',
    workshopPhone,
    workshopAddress,
  } = params;
  const name = firstName(customerName);

  return letter({
    workshopName,
    workshopPhone,
    workshopAddress,
    content: `
      <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#8a8a8a">${name ? `Hola ${name},` : 'Hola,'}</p>
      <h1 style="margin:0 0 18px;font-size:21px;line-height:1.35;font-weight:700;color:#fafafa;letter-spacing:-0.4px">Actualización de tu servicio</h1>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;background:#141414;border:1px solid #262626;border-radius:10px">
        <tr><td style="padding:20px 22px">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.4px;color:#737373">PLACA</p>
          <p style="margin:0 0 14px;font-size:22px;font-weight:700;color:#00c77a;letter-spacing:1.5px">${placa}</p>
          <div style="padding-top:14px;border-top:1px solid #262626">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.4px;color:#737373">SERVICIO</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#e5e5e5">${type}</p>
          </div>
          ${
            description
              ? `<div style="padding-top:14px;margin-top:14px;border-top:1px solid #262626">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.4px;color:#737373">DETALLE</p>
            <p style="margin:0;font-size:13px;line-height:1.5;color:#b0b0b0">${description}</p>
          </div>`
              : ''
          }
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px">
            <tr>
              <td style="padding-top:14px;border-top:1px solid #262626;font-size:13px;font-weight:600;color:#8a8a8a">TOTAL</td>
              <td style="padding-top:14px;border-top:1px solid #262626;text-align:right;font-size:18px;font-weight:700;color:#00c77a">$${total}</td>
            </tr>
          </table>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#8a8a8a">Gracias por confiar en ${workshopName}.</p>
    `,
  });
}
