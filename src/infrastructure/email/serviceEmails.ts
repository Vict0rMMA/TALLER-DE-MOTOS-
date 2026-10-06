import { sendEmail, isEmailConfigured } from './EmailService';
import { letter } from './emailLayout';
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

/** Primer nombre, con la inicial en mayúscula — la BD guarda nombres en mayúscula sostenida. */
function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/** Caja de datos (placa, servicio, total…) a juego con la del correo de bienvenida. */
function dataBox(rows: { label: string; value: string; accent?: boolean }[]): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background:#141414;border:1px solid #262626;border-radius:10px">
      <tr><td style="padding:20px 22px">
        ${rows
          .map(
            (r, i) => `
          <div style="${i > 0 ? 'margin-top:14px;padding-top:14px;border-top:1px solid #262626' : ''}">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.4px;color:#737373">${r.label}</p>
            <p style="margin:0;font-size:${r.accent ? '22px' : '14px'};font-weight:${r.accent ? '700' : '500'};color:${r.accent ? '#00c77a' : '#e5e5e5'};${r.accent ? 'letter-spacing:1.5px' : 'line-height:1.5'}">${r.value}</p>
          </div>`,
          )
          .join('')}
      </td></tr>
    </table>`;
}

async function getServiceData(serviceId: string) {
  return (prisma as any).service.findUnique({
    where: { id: serviceId },
    include: {
      workshop: { select: { name: true, phone: true, address: true } },
      motorcycle: { include: { customer: { select: { name: true, phone: true, email: true, optInEmail: true } } } },
      products: { include: { product: { select: { name: true, brand: true } } } },
    },
  });
}

// 1. Moto ingresó al taller
export async function sendServiceCreatedEmail(serviceId: string) {
  if (!isEmailConfigured()) return;
  const s = await getServiceData(serviceId);
  if (!s?.motorcycle?.customer?.email || !s.motorcycle.customer.optInEmail) return;

  const { customer, placa } = s.motorcycle;
  const typeLabel = SERVICE_LABELS[s.type] ?? s.type;
  const workshopName = s.workshop.name;

  const html = letter({
    workshopName,
    workshopPhone: s.workshop.phone,
    workshopAddress: s.workshop.address,
    content: `
      <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#8a8a8a">Hola ${firstName(customer.name)},</p>
      <h1 style="margin:0 0 18px;font-size:21px;line-height:1.35;font-weight:700;color:#fafafa;letter-spacing:-0.4px">Tu moto ingresó al taller</h1>
      ${dataBox([
        { label: 'PLACA', value: placa, accent: true },
        { label: 'SERVICIO', value: typeLabel },
        ...(s.description ? [{ label: 'DESCRIPCIÓN', value: s.description }] : []),
      ])}
      <p style="margin:0;font-size:14px;line-height:1.6;color:#8a8a8a">Te avisaremos cuando comencemos a trabajar en ella y cuando esté lista.</p>
    `,
  });

  await sendEmail(customer.email, `${workshopName} — Tu moto ${placa} ingresó al taller`, html);
}

// 2. Comenzamos a trabajar
export async function sendServiceInProgressEmail(serviceId: string) {
  if (!isEmailConfigured()) return;
  const s = await getServiceData(serviceId);
  if (!s?.motorcycle?.customer?.email || !s.motorcycle.customer.optInEmail) return;

  const { customer, placa } = s.motorcycle;
  const typeLabel = SERVICE_LABELS[s.type] ?? s.type;
  const workshopName = s.workshop.name;

  const html = letter({
    workshopName,
    workshopPhone: s.workshop.phone,
    workshopAddress: s.workshop.address,
    content: `
      <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#8a8a8a">Hola ${firstName(customer.name)},</p>
      <h1 style="margin:0 0 18px;font-size:21px;line-height:1.35;font-weight:700;color:#fafafa;letter-spacing:-0.4px">Ya estamos trabajando en tu moto</h1>
      ${dataBox([
        { label: 'PLACA', value: placa, accent: true },
        { label: 'TRABAJO A REALIZAR', value: typeLabel },
      ])}
      <p style="margin:0;font-size:14px;line-height:1.6;color:#8a8a8a">Te notificaremos apenas esté lista para recoger.</p>
    `,
  });

  await sendEmail(customer.email, `${workshopName} — Trabajando en tu moto ${placa}`, html);
}

// 3. Servicio cancelado
export async function sendServiceCancelledEmail(serviceId: string) {
  if (!isEmailConfigured()) return;
  const s = await getServiceData(serviceId);
  if (!s?.motorcycle?.customer?.email || !s.motorcycle.customer.optInEmail) return;

  const { customer, placa } = s.motorcycle;
  const workshopName = s.workshop.name;

  const html = letter({
    workshopName,
    workshopPhone: s.workshop.phone,
    workshopAddress: s.workshop.address,
    content: `
      <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#8a8a8a">Hola ${firstName(customer.name)},</p>
      <h1 style="margin:0 0 18px;font-size:21px;line-height:1.35;font-weight:700;color:#fafafa;letter-spacing:-0.4px">El servicio fue cancelado</h1>
      ${dataBox([{ label: 'PLACA', value: placa, accent: true }])}
      <p style="margin:0;font-size:14px;line-height:1.6;color:#8a8a8a">Si tienes alguna pregunta, escríbenos y con gusto te ayudamos.</p>
    `,
  });

  await sendEmail(customer.email, `${workshopName} — Servicio cancelado · ${placa}`, html);
}

// 4. Servicio completado con PDF y fotos
export async function sendServiceClosedEmail(serviceId: string, publicAppUrl: string) {
  if (!isEmailConfigured()) return;
  const s = await getServiceData(serviceId);
  if (!s?.motorcycle?.customer?.email || !s.motorcycle.customer.optInEmail) return;

  const { customer, placa } = s.motorcycle;
  const typeLabel = SERVICE_LABELS[s.type] ?? s.type;
  const total = Number(s.totalCost);
  const workshopName = s.workshop.name;

  const productsRows = s.products
    .map(
      (p: any) => `
    <tr>
      <td style="color:#d4d4d4;font-size:13px;padding:8px 0;border-bottom:1px solid #262626">${p.product.name}${p.product.brand ? ` (${p.product.brand})` : ''}</td>
      <td style="color:#d4d4d4;font-size:13px;padding:8px 0;border-bottom:1px solid #262626;text-align:center">${p.quantity}</td>
      <td style="color:#d4d4d4;font-size:13px;padding:8px 0;border-bottom:1px solid #262626;text-align:right">${fmt(Number(p.unitPrice) * p.quantity)}</td>
    </tr>`,
    )
    .join('');

  const photosSection =
    s.photos?.length > 0
      ? `
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.4px;color:#737373">FOTOS DEL SERVICIO</p>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.8">
      ${s.photos.map((url: string, i: number) => `<a href="${url}" style="color:#00c77a;text-decoration:none;font-weight:600">Ver foto ${i + 1}</a>`).join(' &nbsp;&middot;&nbsp; ')}
    </p>`
      : '';

  const receiptUrl = `${publicAppUrl}/recibo/${serviceId}`;

  const productsTable =
    s.products.length > 0
      ? `
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.4px;color:#737373">REPUESTOS UTILIZADOS</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">
        <tr>
          <th style="color:#737373;font-size:11px;text-align:left;padding-bottom:6px;font-weight:500">Producto</th>
          <th style="color:#737373;font-size:11px;text-align:center;padding-bottom:6px;font-weight:500">Cant.</th>
          <th style="color:#737373;font-size:11px;text-align:right;padding-bottom:6px;font-weight:500">Valor</th>
        </tr>
        ${productsRows}
      </table>`
      : '';

  const html = letter({
    workshopName,
    workshopPhone: s.workshop.phone,
    workshopAddress: s.workshop.address,
    content: `
      <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#8a8a8a">Hola ${firstName(customer.name)},</p>
      <h1 style="margin:0 0 6px;font-size:21px;line-height:1.35;font-weight:700;color:#fafafa;letter-spacing:-0.4px">Tu moto está lista</h1>
      <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#8a8a8a">Ya puedes pasar a recogerla al taller.</p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background:#141414;border:1px solid #262626;border-radius:10px">
        <tr><td style="padding:22px 24px">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.4px;color:#737373">PLACA</p>
          <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#00c77a;letter-spacing:1.5px">${placa}</p>

          <div style="padding-top:14px;border-top:1px solid #262626;margin-bottom:${s.description ? '14px' : '18px'}">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.4px;color:#737373">SERVICIO REALIZADO</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#e5e5e5">${typeLabel}</p>
          </div>

          ${
            s.description
              ? `<div style="padding-top:14px;border-top:1px solid #262626;margin-bottom:18px">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.4px;color:#737373">DESCRIPCIÓN DEL TRABAJO</p>
            <p style="margin:0;font-size:13px;line-height:1.5;color:#b0b0b0">${s.description}</p>
          </div>`
              : ''
          }

          <div style="padding-top:14px;border-top:1px solid #262626">
            ${productsTable}
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#00c77a;border-radius:8px">
              <tr>
                <td style="padding:13px 16px;font-size:14px;font-weight:700;color:#0a0a0a">TOTAL A PAGAR</td>
                <td style="padding:13px 16px;font-size:16px;font-weight:700;color:#0a0a0a;text-align:right">${fmt(total)}</td>
              </tr>
            </table>
          </div>
        </td></tr>
      </table>

      ${photosSection}

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 10px">
        <tr>
          <td align="center" style="background:#00c77a;border-radius:8px">
            <a href="${receiptUrl}" style="display:block;padding:16px 20px;font-size:16px;font-weight:700;color:#0a0a0a;text-decoration:none;text-align:center">Ver recibo completo online</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:12px;color:#737373">El recibo en PDF también va adjunto a este correo.</p>
    `,
  });

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

  await sendEmail(customer.email, `${workshopName} — Tu moto ${placa} está lista`, html, attachments);
}
