import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/prisma/client';
import { getWhatsAppStatus } from '../../infrastructure/whatsapp/WhatsAppWebService';
import { sendEmail, isEmailConfigured, buildServiceEmailHtml } from '../../infrastructure/email/EmailService';
import { generateReceiptPdf } from '../../infrastructure/pdf/generateReceiptPdf';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  oil_change: 'Cambio de aceite',
  brake_repair: 'Reparación de frenos',
  brakes: 'Frenos',
  general_service: 'Servicio general',
  chain_replacement: 'Cambio de cadena',
  diagnosis: 'Diagnóstico',
  maintenance: 'Mantenimiento',
  tire_change: 'Cambio de llanta',
  electrical: 'Eléctrico',
  other: 'Otro',
};

async function dispatchNotification(
  phone: string,
  email: string | null | undefined,
  message: string,
  emailSubject: string,
  emailHtml: string,
  attachments?: { filename: string; content: Buffer; contentType: string }[],
): Promise<{ channel: string; status: 'sent' | 'failed'; reason?: string }> {
  // Intentar WhatsApp primero si está disponible
  const wa = getWhatsAppStatus();
  if (wa.enabled && wa.isReady) {
    try {
      const { WhatsAppWebService } = await import('../../infrastructure/whatsapp/WhatsAppWebService');
      const waService = new WhatsAppWebService();
      await waService.sendMessage(phone, message);
      return { channel: 'whatsapp', status: 'sent' };
    } catch (err) {
      // WhatsApp falló, intentar email
    }
  }

  // Fallback: email
  if (email && isEmailConfigured()) {
    try {
      await sendEmail(email, emailSubject, emailHtml, attachments);
      return { channel: 'email', status: 'sent' };
    } catch (err) {
      return { channel: 'email', status: 'failed', reason: (err as Error).message };
    }
  }

  // Sin canal disponible
  const reason = !wa.enabled
    ? 'WhatsApp no está activo. Configura GMAIL_USER y GMAIL_APP_PASSWORD para enviar emails.'
    : !email
    ? 'El cliente no tiene email registrado y WhatsApp no está disponible.'
    : 'No se pudo enviar: WhatsApp no listo y email no configurado.';

  return { channel: 'none', status: 'failed', reason };
}

export const sendNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workshopId = req.workshopId!;
    const body = req.body as {
      customerId: string;
      serviceId?: string;
      type: string;
      message: string;
      phone?: string;
    };

    if (!body.customerId || !body.type || !body.message) {
      return res.status(400).json({ error: 'customerId, type y message son requeridos' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
      select: { phone: true, email: true, name: true },
    });

    const phone = body.phone ?? customer?.phone ?? null;
    if (!phone) return res.status(400).json({ error: 'El cliente no tiene teléfono registrado' });

    const record = await prisma.notification.create({
      data: {
        workshopId,
        customerId: body.customerId,
        serviceId: body.serviceId ?? null,
        type: body.type,
        phone,
        message: body.message,
        status: 'pending',
      },
    });

    const emailHtml = buildServiceEmailHtml({
      customerName: customer?.name ?? 'Cliente',
      placa: '—',
      type: body.type,
      total: '0',
      description: body.message,
    });

    const result = await dispatchNotification(phone, customer?.email, body.message, 'Notificación MotoBrain', emailHtml);

    await prisma.notification.update({
      where: { id: record.id },
      data: {
        status: result.status,
        errorMsg: result.reason ?? null,
      },
    });

    if (result.status === 'sent') {
      res.json({ ok: true, id: record.id, status: result.status, channel: result.channel });
    } else {
      res.status(422).json({ error: result.reason, id: record.id, status: result.status });
    }
  } catch (err) {
    next(err);
  }
};

export const sendServiceNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workshopId = req.workshopId!;
    const serviceId = String(req.params['serviceId']);
    const { templateId } = req.body as { templateId: string };

    const service = await prisma.service.findFirst({
      where: { id: serviceId, workshopId },
      include: {
        workshop: { select: { name: true, phone: true, address: true } },
        products: { include: { product: { select: { name: true, brand: true } } } },
      },
    });
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });

    const motorcycle = await prisma.motorcycle.findUnique({ where: { id: service.motorcycleId } });
    if (!motorcycle) return res.status(404).json({ error: 'Moto no encontrada' });

    const customer = await prisma.customer.findUnique({ where: { id: motorcycle.customerId } });
    if (!customer?.phone) return res.status(400).json({ error: 'El cliente no tiene teléfono' });

    const total = Number(service.totalCost).toLocaleString('es-CO', { maximumFractionDigits: 0 });
    const typeLabel = SERVICE_TYPE_LABELS[service.type] ?? service.type;

    const waMessage = `🔧 *MotoBrain* — Actualización de servicio\n\nHola ${customer.name}, te informamos sobre el servicio de tu moto *${motorcycle.placa}*.\n\n📋 *Servicio:* ${typeLabel}\n💰 *Total:* $${total} COP\n\n¡Gracias por confiar en nosotros! 🙏`;

    const emailHtml = buildServiceEmailHtml({
      customerName: customer.name,
      placa: motorcycle.placa,
      type: typeLabel,
      total,
      description: service.description ?? undefined,
    });

    const emailSubject = `MotoBrain — Recibo de servicio · ${motorcycle.placa}`;

    // Generar PDF del recibo
    let pdfAttachment: { filename: string; content: Buffer; contentType: string } | undefined;
    try {
      const pdfBuffer = await generateReceiptPdf({
        id: service.id,
        type: service.type,
        description: service.description,
        serviceDate: service.serviceDate,
        closedAt: service.closedAt,
        kmAtService: service.kmAtService,
        nextMaintenanceKm: service.nextMaintenanceKm,
        laborCost: Number(service.laborCost),
        totalCost: Number(service.totalCost),
        workshop: service.workshop,
        motorcycle: {
          placa: motorcycle.placa,
          brand: motorcycle.brand,
          model: motorcycle.model,
          year: motorcycle.year,
          cc: motorcycle.cc,
        },
        customer: { name: customer.name, phone: customer.phone },
        products: service.products.map((p) => ({
          name: p.product.name,
          brand: p.product.brand ?? null,
          quantity: p.quantity,
          unitPrice: Number(p.unitPrice),
          subtotal: Number(p.unitPrice) * p.quantity,
        })),
      });
      pdfAttachment = {
        filename: `recibo-${motorcycle.placa}-${new Date().toISOString().slice(0, 10)}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      };
    } catch {
      // Si falla el PDF, igual envía el email sin adjunto
    }

    const record = await prisma.notification.create({
      data: {
        workshopId,
        customerId: customer.id,
        serviceId,
        type: templateId,
        phone: customer.phone,
        message: waMessage,
        status: 'pending',
      },
    });

    const result = await dispatchNotification(
      customer.phone,
      customer.email,
      waMessage,
      emailSubject,
      emailHtml,
      pdfAttachment ? [pdfAttachment] : undefined,
    );

    await prisma.notification.update({
      where: { id: record.id },
      data: { status: result.status, errorMsg: result.reason ?? null },
    });

    if (result.status === 'sent') {
      res.json({ ok: true, id: record.id, status: result.status, channel: result.channel });
    } else {
      res.status(422).json({ error: result.reason, id: record.id, status: result.status });
    }
  } catch (err) {
    next(err);
  }
};

export const listNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workshopId = req.workshopId!;
    const q = req.query as Record<string, string>;
    const page = Math.max(1, Number(q['page'] ?? 1));
    const limit = Math.min(100, Number(q['limit'] ?? 20));

    const where = {
      workshopId,
      ...(q['customerId'] ? { customerId: q['customerId'] } : {}),
      ...(q['serviceId'] ? { serviceId: q['serviceId'] } : {}),
      ...(q['status'] ? { status: q['status'] } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { customer: { select: { name: true, phone: true } } },
      }),
    ]);

    res.json({
      total,
      page,
      limit,
      data: items.map((n) => ({
        id: n.id,
        type: n.type,
        status: n.status,
        phone: n.phone,
        message: n.message,
        errorMsg: n.errorMsg,
        customerId: n.customerId,
        customerName: n.customer.name,
        serviceId: n.serviceId,
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};
