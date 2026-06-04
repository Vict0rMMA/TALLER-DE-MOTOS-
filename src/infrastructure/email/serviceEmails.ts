import { sendEmail, isEmailConfigured } from './EmailService';
import { generateReceiptPdf } from '../pdf/generateReceiptPdf';
import prisma from '../prisma/client';

const SERVICE_LABELS: Record<string, string> = {
  oil_change: 'Cambio de aceite', brake_repair: 'Reparación de frenos', brakes: 'Frenos',
  general_service: 'Servicio general', chain_replacement: 'Cambio de cadena', chain_kit: 'Kit de cadena',
  diagnosis: 'Diagnóstico', maintenance: 'Mantenimiento', tire_change: 'Cambio de llanta',
  electrical: 'Eléctrico', other: 'Otro',
};

function fmt(n: number) {
  return '$' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function header(workshopName: string) {
  return `
    <div style="background:#00c77a;padding:24px 32px;text-align:center;border-radius:12px 12px 0 0">
      <span style="font-size:20px;font-weight:700;color:#000">🔧 MotoBrain</span>
      <p style="margin:4px 0 0;color:#003d25;font-size:12px">${workshopName}</p>
    </div>`;
}

function footer(workshopName: string, phone?: string | null) {
  return `
    <div style="padding:16px 32px;border-top:1px solid #2a2a2a;text-align:center">
      <p style="color:#555;font-size:11px;margin:0">Gracias por confiar en ${workshopName} 🙏</p>
      ${phone ? `<p style="color:#555;font-size:11px;margin:4px 0 0">Tel: ${phone}</p>` : ''}
    </div>`;
}

function wrap(content: string, workshopName: string, phone?: string | null) {
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

async function getServiceData(serviceId: string) {
  return (prisma as any).service.findUnique({
    where: { id: serviceId },
    include: {
      workshop: { select: { name: true, phone: true, address: true } },
      motorcycle: { include: { customer: { select: { name: true, phone: true, email: true } } } },
      products: { include: { product: { select: { name: true, brand: true } } } },
    },
  });
}

// 1. Moto ingresó al taller
export async function sendServiceCreatedEmail(serviceId: string) {
  if (!isEmailConfigured()) return;
  const s = await getServiceData(serviceId);
  if (!s?.motorcycle?.customer?.email) return;

  const { customer, placa } = s.motorcycle;
  const typeLabel = SERVICE_LABELS[s.type] ?? s.type;
  const workshopName = s.workshop.name;

  const html = wrap(`
    <p style="color:#aaa;margin:0 0 6px;font-size:13px">Hola ${customer.name},</p>
    <h2 style="color:#fff;margin:0 0 20px;font-size:18px">Tu moto ingresó al taller ✅</h2>
    <div style="background:#242424;border-radius:10px;padding:18px;margin-bottom:20px">
      <p style="margin:0 0 8px"><span style="color:#666;font-size:11px">PLACA</span><br>
        <span style="color:#00c77a;font-size:22px;font-weight:700;letter-spacing:2px">${placa}</span></p>
      <p style="margin:8px 0 0;border-top:1px solid #333;padding-top:8px">
        <span style="color:#666;font-size:11px">SERVICIO</span><br>
        <span style="color:#fff;font-size:14px">${typeLabel}</span></p>
      ${s.description ? `<p style="margin:8px 0 0;border-top:1px solid #333;padding-top:8px">
        <span style="color:#666;font-size:11px">DESCRIPCIÓN</span><br>
        <span style="color:#ccc;font-size:13px">${s.description}</span></p>` : ''}
    </div>
    <p style="color:#888;font-size:13px;margin:0">Te avisaremos cuando comencemos a trabajar en ella y cuando esté lista.</p>
  `, workshopName, s.workshop.phone);

  await sendEmail(customer.email, `MotoBrain — Tu moto ${placa} ingresó al taller`, html);
}

// 2. Comenzamos a trabajar
export async function sendServiceInProgressEmail(serviceId: string) {
  if (!isEmailConfigured()) return;
  const s = await getServiceData(serviceId);
  if (!s?.motorcycle?.customer?.email) return;

  const { customer, placa } = s.motorcycle;
  const typeLabel = SERVICE_LABELS[s.type] ?? s.type;
  const workshopName = s.workshop.name;

  const html = wrap(`
    <p style="color:#aaa;margin:0 0 6px;font-size:13px">Hola ${customer.name},</p>
    <h2 style="color:#fff;margin:0 0 20px;font-size:18px">🔧 Comenzamos a trabajar en tu moto</h2>
    <div style="background:#242424;border-radius:10px;padding:18px;margin-bottom:20px">
      <p style="margin:0 0 8px"><span style="color:#666;font-size:11px">PLACA</span><br>
        <span style="color:#00c77a;font-size:22px;font-weight:700;letter-spacing:2px">${placa}</span></p>
      <p style="margin:8px 0 0;border-top:1px solid #333;padding-top:8px">
        <span style="color:#666;font-size:11px">TRABAJO A REALIZAR</span><br>
        <span style="color:#fff;font-size:14px">${typeLabel}</span></p>
    </div>
    <p style="color:#888;font-size:13px;margin:0">Nuestro equipo ya está trabajando en tu moto. Te notificaremos cuando esté lista.</p>
  `, workshopName, s.workshop.phone);

  await sendEmail(customer.email, `MotoBrain — Trabajando en tu moto ${placa}`, html);
}

// 3. Servicio cancelado
export async function sendServiceCancelledEmail(serviceId: string) {
  if (!isEmailConfigured()) return;
  const s = await getServiceData(serviceId);
  if (!s?.motorcycle?.customer?.email) return;

  const { customer, placa } = s.motorcycle;
  const workshopName = s.workshop.name;

  const html = wrap(`
    <p style="color:#aaa;margin:0 0 6px;font-size:13px">Hola ${customer.name},</p>
    <h2 style="color:#fff;margin:0 0 20px;font-size:18px">Servicio cancelado</h2>
    <div style="background:#242424;border-radius:10px;padding:18px;margin-bottom:20px">
      <p style="margin:0"><span style="color:#666;font-size:11px">PLACA</span><br>
        <span style="color:#00c77a;font-size:22px;font-weight:700;letter-spacing:2px">${placa}</span></p>
    </div>
    <p style="color:#888;font-size:13px;margin:0">El servicio de tu moto ha sido cancelado. Contáctanos si tienes alguna pregunta.</p>
  `, workshopName, s.workshop.phone);

  await sendEmail(customer.email, `MotoBrain — Servicio cancelado · ${placa}`, html);
}

// 4. Servicio completado con PDF y fotos
export async function sendServiceClosedEmail(serviceId: string, publicAppUrl: string) {
  if (!isEmailConfigured()) return;
  const s = await getServiceData(serviceId);
  if (!s?.motorcycle?.customer?.email) return;

  const { customer, placa } = s.motorcycle;
  const typeLabel = SERVICE_LABELS[s.type] ?? s.type;
  const total = Number(s.totalCost);
  const workshopName = s.workshop.name;

  const productsRows = s.products.map((p: any) => `
    <tr>
      <td style="color:#ccc;font-size:13px;padding:6px 0;border-bottom:1px solid #333">${p.product.name}${p.product.brand ? ` (${p.product.brand})` : ''}</td>
      <td style="color:#ccc;font-size:13px;padding:6px 0;border-bottom:1px solid #333;text-align:center">${p.quantity}</td>
      <td style="color:#ccc;font-size:13px;padding:6px 0;border-bottom:1px solid #333;text-align:right">${fmt(Number(p.unitPrice) * p.quantity)}</td>
    </tr>`).join('');

  const photosSection = s.photos?.length > 0 ? `
    <p style="color:#666;font-size:11px;margin:16px 0 8px;font-weight:700">FOTOS DEL SERVICIO</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      ${s.photos.map((url: string, i: number) => `
        <a href="${url}" style="color:#00c77a;font-size:12px">📷 Ver foto ${i + 1}</a>`).join(' · ')}
    </div>` : '';

  const receiptUrl = `${publicAppUrl}/recibo/${serviceId}`;

  const html = wrap(`
    <p style="color:#aaa;margin:0 0 6px;font-size:13px">Hola ${customer.name},</p>
    <h2 style="color:#fff;margin:0 0 4px;font-size:18px">✅ Tu moto está lista</h2>
    <p style="color:#888;font-size:13px;margin:0 0 20px">Ya puedes pasar a recogerla al taller.</p>

    <div style="background:#242424;border-radius:10px;padding:18px;margin-bottom:20px">
      <p style="margin:0 0 10px"><span style="color:#666;font-size:11px">PLACA</span><br>
        <span style="color:#00c77a;font-size:22px;font-weight:700;letter-spacing:2px">${placa}</span></p>
      <p style="margin:10px 0;border-top:1px solid #333;padding-top:10px">
        <span style="color:#666;font-size:11px">SERVICIO REALIZADO</span><br>
        <span style="color:#fff;font-size:14px;font-weight:600">${typeLabel}</span></p>
      ${s.description ? `<p style="margin:10px 0;border-top:1px solid #333;padding-top:10px">
        <span style="color:#666;font-size:11px">DESCRIPCIÓN DEL TRABAJO</span><br>
        <span style="color:#ccc;font-size:13px">${s.description}</span></p>` : ''}

      ${s.products.length > 0 ? `
      <p style="margin:10px 0 6px;border-top:1px solid #333;padding-top:10px;color:#666;font-size:11px">REPUESTOS UTILIZADOS</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <th style="color:#666;font-size:11px;text-align:left;padding-bottom:4px">Producto</th>
          <th style="color:#666;font-size:11px;text-align:center;padding-bottom:4px">Cant.</th>
          <th style="color:#666;font-size:11px;text-align:right;padding-bottom:4px">Valor</th>
        </tr>
        ${productsRows}
      </table>` : ''}

      <div style="background:#00c77a;border-radius:8px;padding:12px 16px;margin-top:14px;display:flex;justify-content:space-between">
        <span style="color:#000;font-weight:700;font-size:14px">TOTAL A PAGAR</span>
        <span style="color:#000;font-weight:700;font-size:16px">${fmt(total)}</span>
      </div>
    </div>

    ${photosSection}

    <p style="margin:16px 0 8px">
      <a href="${receiptUrl}" style="background:#1a1a1a;border:1px solid #00c77a;color:#00c77a;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">
        📄 Ver recibo completo online
      </a>
    </p>
    <p style="color:#666;font-size:12px;margin:8px 0 0">El recibo en PDF también va adjunto a este correo.</p>
  `, workshopName, s.workshop.phone);

  // Generar PDF
  let attachments: any[] = [];
  try {
    const pdfBuffer = await generateReceiptPdf({
      id: s.id, type: s.type, description: s.description,
      serviceDate: s.serviceDate, closedAt: s.closedAt,
      kmAtService: s.kmAtService, nextMaintenanceKm: s.nextMaintenanceKm,
      laborCost: Number(s.laborCost), totalCost: Number(s.totalCost),
      workshop: s.workshop,
      motorcycle: { placa, brand: s.motorcycle.brand, model: s.motorcycle.model, year: s.motorcycle.year, cc: s.motorcycle.cc },
      customer: { name: customer.name, phone: customer.phone },
      photos: s.photos ?? [],
      products: s.products.map((p: any) => ({
        name: p.product.name, brand: p.product.brand ?? null,
        quantity: p.quantity, unitPrice: Number(p.unitPrice),
        subtotal: Number(p.unitPrice) * p.quantity,
      })),
    });
    attachments = [{ filename: `recibo-${placa}-${new Date().toISOString().slice(0,10)}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }];
  } catch { /* sin adjunto */ }

  await sendEmail(customer.email, `MotoBrain — Tu moto ${placa} está lista ✅`, html, attachments);
}
