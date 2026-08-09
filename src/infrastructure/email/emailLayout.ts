/** Marcos visuales de los correos al cliente. */

/**
 * Carta oscura, a juego con la app. El verde entra solo como acento (filo
 * superior, datos, botón) en vez de como banner: es lo que la hacía verse
 * a plantilla. Sin emoji y alineada a la izquierda.
 */
export function letter(params: {
  content: string;
  workshopName: string;
  workshopPhone?: string | null;
  workshopAddress?: string | null;
  preheader?: string;
}): string {
  const { content, workshopName, workshopPhone, workshopAddress, preheader } = params;
  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <style>
    /* Mejoras progresivas: Gmail y Outlook las descartan y el correo
       sigue viéndose bien con los estilos en línea. */
    @keyframes mbGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(0,199,122,0.35); }
      50%      { box-shadow: 0 0 0 10px rgba(0,199,122,0); }
    }
    .mb-btn {
      box-shadow: 0 2px 14px rgba(0,199,122,0.22);
      animation: mbGlow 2.6s ease-out infinite;
      transition: background-color .15s ease;
    }
    .mb-btn:hover { background-color: #00b06c !important; }
    .mb-link:hover { text-decoration: underline !important; }
    @media (prefers-reduced-motion: reduce) { .mb-btn { animation: none; } }
    @media only screen and (max-width: 600px) {
      .mb-card { border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
      .mb-pad { padding-left: 22px !important; padding-right: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:${font};-webkit-font-smoothing:antialiased">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>`
      : ''
  }
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="540" cellpadding="0" cellspacing="0" border="0" class="mb-card" style="max-width:540px;background:#141414;border:1px solid #262626;border-radius:10px">
          <tr><td style="height:3px;background:#00c77a;border-radius:9px 9px 0 0;font-size:0;line-height:0">&nbsp;</td></tr>
          <tr>
            <td class="mb-pad" style="padding:26px 36px 0">
              <p style="margin:0;font-size:17px;font-weight:700;color:#fafafa;letter-spacing:-0.3px">MotoBrain</p>
              <p style="margin:3px 0 0;font-size:13px;color:#737373">${workshopName}</p>
            </td>
          </tr>
          <tr><td class="mb-pad" style="padding:22px 36px 0"><div style="height:1px;background:#262626"></div></td></tr>
          <tr><td class="mb-pad" style="padding:28px 36px 32px">${content}</td></tr>
          <tr><td class="mb-pad" style="padding:0 36px"><div style="height:1px;background:#262626"></div></td></tr>
          <tr>
            <td class="mb-pad" style="padding:18px 36px 26px">
              <p style="margin:0;font-size:12px;line-height:1.7;color:#525252">
                ${workshopName}${workshopPhone ? ` · ${workshopPhone}` : ''}${workshopAddress ? `<br>${workshopAddress}` : ''}<br>
                Recibes este correo porque abriste una cuenta con nosotros.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function header(workshopName: string) {
  return `
    <div style="background:#00c77a;padding:24px 32px;text-align:center;border-radius:12px 12px 0 0">
      <span style="font-size:20px;font-weight:700;color:#000">🔧 MotoBrain</span>
      <p style="margin:4px 0 0;color:#003d25;font-size:12px">${workshopName}</p>
    </div>`;
}

export function footer(workshopName: string, phone?: string | null) {
  return `
    <div style="padding:16px 32px;border-top:1px solid #2a2a2a;text-align:center">
      <p style="color:#555;font-size:11px;margin:0">Gracias por confiar en ${workshopName} 🙏</p>
      ${phone ? `<p style="color:#555;font-size:11px;margin:4px 0 0">Tel: ${phone}</p>` : ''}
    </div>`;
}

export function wrap(content: string, workshopName: string, phone?: string | null) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 0">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a">
          <tr><td>${header(workshopName)}</td></tr>
          <tr><td style="padding:28px 32px">${content}</td></tr>
          <tr><td>${footer(workshopName, phone)}</td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}
