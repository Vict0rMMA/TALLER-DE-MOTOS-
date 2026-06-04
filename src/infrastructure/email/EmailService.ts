import nodemailer from 'nodemailer';

function createTransport() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transport = createTransport();
  if (!transport) throw new Error('GMAIL_USER o GMAIL_APP_PASSWORD no configurados');
  await transport.sendMail({
    from: `"MotoBrain Taller" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export function isEmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
}

export function buildServiceEmailHtml(params: {
  customerName: string;
  placa: string;
  type: string;
  total: string;
  description?: string;
  workshopName?: string;
}): string {
  const { customerName, placa, type, total, description, workshopName = 'MotoBrain Taller' } = params;
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a">
        <!-- Header -->
        <tr><td style="background:#00c77a;padding:24px 32px;text-align:center">
          <span style="font-size:22px;font-weight:700;color:#000">🔧 MotoBrain</span>
          <p style="margin:4px 0 0;color:#003d25;font-size:13px">${workshopName}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="color:#aaa;margin:0 0 8px;font-size:13px">Hola,</p>
          <h1 style="color:#fff;margin:0 0 24px;font-size:20px">Actualización de servicio</h1>
          <!-- Info card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#242424;border-radius:12px;padding:20px;margin-bottom:24px">
            <tr>
              <td style="padding:6px 0">
                <span style="color:#666;font-size:12px;display:block">Cliente</span>
                <span style="color:#fff;font-size:15px;font-weight:600">${customerName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;border-top:1px solid #333">
                <span style="color:#666;font-size:12px;display:block">Placa</span>
                <span style="color:#00c77a;font-size:18px;font-weight:700;letter-spacing:2px">${placa}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;border-top:1px solid #333">
                <span style="color:#666;font-size:12px;display:block">Tipo de servicio</span>
                <span style="color:#fff;font-size:15px">${type}</span>
              </td>
            </tr>
            ${description ? `<tr><td style="padding:6px 0;border-top:1px solid #333">
                <span style="color:#666;font-size:12px;display:block">Descripción</span>
                <span style="color:#ccc;font-size:14px">${description}</span>
              </td></tr>` : ''}
            <tr>
              <td style="padding:6px 0;border-top:1px solid #333">
                <span style="color:#666;font-size:12px;display:block">Total</span>
                <span style="color:#00c77a;font-size:20px;font-weight:700">$${total}</span>
              </td>
            </tr>
          </table>
          <p style="color:#888;font-size:13px;text-align:center;margin:0">
            Gracias por confiar en ${workshopName} 🙏
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #2a2a2a;text-align:center">
          <p style="color:#555;font-size:11px;margin:0">Este correo fue enviado automáticamente por MotoBrain</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
