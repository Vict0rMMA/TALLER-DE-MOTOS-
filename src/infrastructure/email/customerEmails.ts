import { sendEmail, isEmailConfigured } from './EmailService';
import { letter } from './emailLayout';
import prisma from '../prisma/client';

/** El cliente entra al portal con su celular tal como lo digita: 10 dígitos, sin +57. */
function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/** Primer nombre, con la inicial en mayúscula — la BD guarda nombres en mayúscula sostenida. */
function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/** Enlace de WhatsApp del taller, o null si el número no sirve para escribirle. */
function whatsappUrl(phone?: string | null): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `https://wa.me/57${digits}`;
  if (digits.length === 12 && digits.startsWith('57')) return `https://wa.me/${digits}`;
  return null;
}

export function buildPortalWelcomeHtml(params: {
  customerName: string;
  phone: string;
  workshopName: string;
  workshopPhone?: string | null;
  workshopAddress?: string | null;
  publicAppUrl: string;
}): string {
  const { customerName, phone, workshopName, workshopPhone, workshopAddress, publicAppUrl } =
    params;
  const loginUrl = `${publicAppUrl}/login`;
  const waUrl = whatsappUrl(workshopPhone);

  return letter({
    workshopName,
    workshopPhone,
    workshopAddress,
    preheader: `Entra con tu celular ${displayPhone(phone)} y tu cédula.`,
    content: `
    <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#8a8a8a">Hola ${firstName(customerName)},</p>
    <h1 style="margin:0 0 18px;font-size:21px;line-height:1.35;font-weight:700;color:#fafafa;letter-spacing:-0.4px">Tu cuenta ya está lista</h1>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#b0b0b0">
      Gracias por registrarte en ${workshopName}. Te dejamos todo listo para que estés
      <strong style="color:#fafafa;font-weight:600">pendiente de tu moto</strong> sin tener que llamar a preguntar.
    </p>

    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#b0b0b0">Desde tu cuenta puedes:</p>

    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 30px">
      <tr><td style="padding:0 0 10px;font-size:15px;line-height:1.5;color:#b0b0b0">
        <span style="color:#00c77a">&#8226;</span>&nbsp;&nbsp;Ver en qué va tu servicio, paso a paso
      </td></tr>
      <tr><td style="padding:0 0 10px;font-size:15px;line-height:1.5;color:#b0b0b0">
        <span style="color:#00c77a">&#8226;</span>&nbsp;&nbsp;Consultar todo lo que le hemos hecho a tu moto
      </td></tr>
      <tr><td style="padding:0 0 10px;font-size:15px;line-height:1.5;color:#b0b0b0">
        <span style="color:#00c77a">&#8226;</span>&nbsp;&nbsp;Agendar tu próxima cita cuando la necesites
      </td></tr>
      <tr><td style="padding:0;font-size:15px;line-height:1.5;color:#b0b0b0">
        <span style="color:#00c77a">&#8226;</span>&nbsp;&nbsp;Preguntarle a nuestro asistente sobre tu moto
      </td></tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;border:1px solid #1d4c3b;border-radius:10px;background:#101d18">
      <tr>
        <td style="padding:24px 24px 22px">
          <p style="margin:0 0 20px;font-size:17px;font-weight:700;color:#fafafa;letter-spacing:-0.2px">Cómo entrar</p>

          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="26" valign="top" style="font-size:15px;font-weight:700;color:#00c77a;line-height:1.5">1</td>
              <td style="font-size:15px;line-height:1.5;color:#d4d4d4;padding-bottom:12px">Toca el botón verde de aquí abajo</td>
            </tr>
            <tr>
              <td width="26" valign="top" style="font-size:15px;font-weight:700;color:#00c77a;line-height:1.5">2</td>
              <td style="font-size:15px;line-height:1.5;color:#d4d4d4;padding-bottom:12px">Elige la pestaña <strong style="color:#fafafa;font-weight:600">Soy cliente</strong></td>
            </tr>
            <tr>
              <td width="26" valign="top" style="font-size:15px;font-weight:700;color:#00c77a;line-height:1.5">3</td>
              <td style="font-size:15px;line-height:1.5;color:#d4d4d4">Digita estos dos datos:</td>
            </tr>
          </table>

          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:14px 0 22px;background:#0b0b0b;border:1px solid #262626;border-radius:8px">
            <tr>
              <td style="padding:16px 18px 14px">
                <p style="margin:0 0 3px;font-size:12px;color:#737373;letter-spacing:0.3px">CELULAR</p>
                <p style="margin:0;font-size:23px;color:#00c77a;font-weight:700;letter-spacing:1px">${displayPhone(phone)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 18px 16px">
                <div style="height:1px;background:#262626;margin-bottom:14px"></div>
                <p style="margin:0 0 3px;font-size:12px;color:#737373;letter-spacing:0.3px">CONTRASEÑA</p>
                <p style="margin:0;font-size:17px;color:#fafafa;font-weight:600">Tu número de cédula</p>
                <p style="margin:4px 0 0;font-size:13px;color:#737373">Solo los números, sin puntos ni comas</p>
              </td>
            </tr>
          </table>

          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" class="mb-btn" style="background:#00c77a;border-radius:8px">
                <a href="${loginUrl}" style="display:block;padding:16px 20px;font-size:16px;font-weight:700;color:#0a0a0a;text-decoration:none;text-align:center">Abrir mi cuenta</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background:#0e1a15;border:1px solid #1d4c3b;border-radius:8px">
      <tr>
        <td style="padding:14px 18px">
          <p style="margin:0 0 5px;font-size:13px;line-height:1.5;color:#8a8a8a">
            ¿El botón no te abre? Copia este enlace en tu navegador:
          </p>
          <a href="${loginUrl}" class="mb-link" style="font-size:14px;font-weight:600;color:#00c77a;text-decoration:none;word-break:break-all">${loginUrl}</a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px">
      <tr>
        <td style="border-left:2px solid #2a2a2a;padding:2px 0 2px 14px">
          <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#8a8a8a">
            <strong style="color:#b0b0b0;font-weight:600">Ábrela desde el celular.</strong>
            Agrégala a la pantalla de inicio y entras de una, como cualquier otra app.
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#8a8a8a">
            <strong style="color:#b0b0b0;font-weight:600">Tu cédula es tu clave.</strong>
            Nunca te la vamos a pedir por teléfono ni por WhatsApp.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:15px;line-height:1.65;color:#b0b0b0">
      Nos alegra tenerte con nosotros. Cualquier duda${
        waUrl
          ? ` nos <a href="${waUrl}" style="color:#00c77a;text-decoration:none;font-weight:600">escribes por WhatsApp</a>`
          : ' nos escribes'
      }.<br>
      <span style="color:#737373">Equipo de ${workshopName}</span>
    </p>`,
  });
}

/**
 * Da la bienvenida al portal: le dice al cliente que ya puede seguir el proceso
 * de su moto y con qué datos entra. Silencioso si falta email, cédula o SMTP.
 */
export async function sendPortalWelcomeEmail(customerId: string, publicAppUrl: string) {
  if (!isEmailConfigured()) return;

  const customer = await (prisma as any).customer.findUnique({
    where: { id: customerId },
    include: { workshop: { select: { name: true, phone: true, address: true } } },
  });

  // Sin correo no hay a dónde enviar; sin cédula el portal lo rechazaría al entrar.
  if (!customer?.email?.trim() || !customer.cedula?.trim() || !customer.portalActive) return;

  const workshopName = customer.workshop?.name ?? 'MotoBrain Taller';
  const html = buildPortalWelcomeHtml({
    customerName: customer.name,
    phone: customer.phone,
    workshopName,
    workshopPhone: customer.workshop?.phone,
    workshopAddress: customer.workshop?.address,
    publicAppUrl,
  });

  await sendEmail(customer.email, `Tu cuenta en ${workshopName} ya está lista`, html);
}
