import PDFDocument from 'pdfkit';

interface ReceiptData {
  id: string;
  type: string;
  description?: string | null;
  serviceDate: Date | string;
  closedAt?: Date | string | null;
  kmAtService: number;
  nextMaintenanceKm?: number | null;
  laborCost: number;
  totalCost: number;
  workshop: { name: string; phone?: string | null; address?: string | null };
  motorcycle: { placa: string; brand: string; model: string; year?: number | null; cc: number };
  customer: { name: string; phone: string };
  mechanic?: string | null;
  products: { name: string; brand?: string | null; quantity: number; unitPrice: number; subtotal: number }[];
  photos?: string[];
}

const SERVICE_LABELS: Record<string, string> = {
  oil_change: 'Cambio de aceite', brake_repair: 'Reparacion de frenos', brakes: 'Frenos',
  general_service: 'Servicio general', chain_replacement: 'Cambio de cadena', chain_kit: 'Kit de cadena',
  diagnosis: 'Diagnostico', maintenance: 'Mantenimiento', tire_change: 'Cambio de llanta',
  electrical: 'Electrico', other: 'Otro',
};

function fmt(n: number) {
  return '$' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch {
    return null;
  }
}

export async function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const GREEN = '#00c77a';
    const DARK = '#111111';
    const GRAY = '#666666';
    const W = 495;

    // Header
    doc.rect(50, 50, W, 70).fill(GREEN);
    doc.fillColor('#000').fontSize(22).font('Helvetica-Bold').text('MotoBrain', 65, 68);
    doc.fillColor('#003d25').fontSize(11).font('Helvetica').text(data.workshop.name, 65, 95);
    doc.fillColor(DARK);

    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica-Bold').fillColor(DARK).text('Recibo de Servicio', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor(GRAY).text(`Fecha: ${fmtDate(data.closedAt ?? data.serviceDate)}`, { align: 'center' });
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(GREEN).lineWidth(1.5).stroke();
    doc.moveDown(0.5);

    const y0 = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY).text('CLIENTE', 50, y0);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK).text(data.customer.name, 50, y0 + 13);
    doc.fontSize(10).font('Helvetica').fillColor(GRAY).text(data.customer.phone, 50, y0 + 27);

    doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY).text('MOTOCICLETA', 320, y0);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(GREEN).text(data.motorcycle.placa, 320, y0 + 11);
    doc.fontSize(10).font('Helvetica').fillColor(DARK).text(
      `${data.motorcycle.brand} ${data.motorcycle.model} ${data.motorcycle.year ?? ''} - ${data.motorcycle.cc}cc`,
      320, y0 + 28
    );

    doc.moveDown(3.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    const y1 = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY).text('SERVICIO', 50, y1);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK).text(SERVICE_LABELS[data.type] ?? data.type, 50, y1 + 13);
    if (data.description) {
      doc.fontSize(10).font('Helvetica').fillColor(GRAY).text(data.description, 50, y1 + 28, { width: 250 });
    }

    doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY).text('KM EN SERVICIO', 320, y1);
    doc.fontSize(12).font('Helvetica').fillColor(DARK).text(data.kmAtService.toLocaleString('es-CO') + ' km', 320, y1 + 13);
    if (data.nextMaintenanceKm) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY).text('PROXIMO MANTENIMIENTO', 320, y1 + 30);
      doc.fontSize(10).font('Helvetica').fillColor(DARK).text(data.nextMaintenanceKm.toLocaleString('es-CO') + ' km', 320, y1 + 43);
    }

    doc.moveDown(4);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    // Productos
    if (data.products.length > 0) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY).text('REPUESTOS Y MATERIALES', 50);
      doc.moveDown(0.4);

      const th = doc.y;
      doc.rect(50, th, W, 18).fill('#f5f5f5');
      doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY)
        .text('Producto', 55, th + 4)
        .text('Cant.', 340, th + 4)
        .text('Precio unit.', 390, th + 4)
        .text('Subtotal', 470, th + 4);

      let rowY = th + 22;
      for (const p of data.products) {
        doc.fontSize(10).font('Helvetica').fillColor(DARK)
          .text(`${p.name}${p.brand ? ' (' + p.brand + ')' : ''}`, 55, rowY, { width: 270 })
          .text(String(p.quantity), 340, rowY)
          .text(fmt(p.unitPrice), 390, rowY)
          .text(fmt(p.subtotal), 470, rowY);
        rowY += 18;
      }
      doc.y = rowY;
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
      doc.moveDown(0.5);
    }

    // Totales
    const ty = doc.y;
    doc.fontSize(10).font('Helvetica').fillColor(GRAY).text('Mano de obra:', 350, ty);
    doc.text(fmt(data.laborCost), 460, ty, { align: 'right', width: 85 });

    const prodTotal = data.products.reduce((s, p) => s + p.subtotal, 0);
    if (prodTotal > 0) {
      doc.text('Repuestos:', 350, ty + 16);
      doc.text(fmt(prodTotal), 460, ty + 16, { align: 'right', width: 85 });
    }

    doc.rect(340, ty + 38, 205, 32).fill(GREEN);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000')
      .text('TOTAL', 355, ty + 47)
      .text(fmt(data.totalCost), 460, ty + 47, { align: 'right', width: 75 });

    doc.moveDown(4);

    // Fotos del servicio
    if (data.photos && data.photos.length > 0) {
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(GRAY).text('FOTOS DEL SERVICIO');
      doc.moveDown(0.4);

      let photoX = 50;
      let photoY = doc.y;
      const photoW = 150;
      const photoH = 110;
      let col = 0;

      for (const url of data.photos.slice(0, 6)) {
        const buf = await fetchImageBuffer(url);
        if (buf) {
          try {
            doc.image(buf, photoX, photoY, { width: photoW, height: photoH, fit: [photoW, photoH] });
          } catch {
            doc.fontSize(9).fillColor(GRAY).text('[foto]', photoX, photoY + 50, { width: photoW, align: 'center' });
          }
        }
        col++;
        if (col < 3) {
          photoX += photoW + 8;
        } else {
          col = 0;
          photoX = 50;
          photoY += photoH + 8;
        }
      }
      doc.y = photoY + photoH + 12;
    }

    // Footer
    doc.moveDown(1);
    doc.fontSize(9).font('Helvetica').fillColor(GRAY)
      .text('Gracias por confiar en ' + data.workshop.name, { align: 'center' });
    if (data.workshop.phone) doc.text('Tel: ' + data.workshop.phone, { align: 'center' });
    if (data.workshop.address) doc.text(data.workshop.address, { align: 'center' });

    doc.end();
  });
}
