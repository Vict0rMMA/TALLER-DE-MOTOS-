import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/prisma/client';
import { WhatsAppWebService, getWhatsAppStatus } from '../../infrastructure/whatsapp/WhatsAppWebService';

const TEMPLATES: Record<string, (p: Record<string, string>) => string> = {
  service_completed: (p) =>
    `✅ *MotoBrain* — Servicio completado\n\nHola ${p['1']}, tu moto placa *${p['2']}* ya está lista.\n\n📋 *Trabajo realizado:* Servicio de mantenimiento\n💰 *Total:* $${p['3']}\n\n¡Puedes pasar a recogerla! Gracias por confiar en nosotros 🙏`,
  service_update: (p) =>
    `🔧 *MotoBrain* — Actualización de servicio\n\nHola ${p['1']}, te informamos sobre el servicio de tu moto *${p['2']}*.\n\nContacta al taller si tienes preguntas.`,
  payment_ready: (p) =>
    `💰 *MotoBrain* — Factura lista\n\nHola ${p['1']}, la factura de tu moto *${p['2']}* está lista.\n\n*Total a pagar:* $${p['3']}\n\nAcércate al taller para realizar el pago. ¡Gracias! 🙏`,
};

async function dispatchWA(phone: string, message: string): Promise<'sent' | 'failed' | { failed: true; reason: string }> {
  const st = getWhatsAppStatus();
  if (!st.enabled) {
    return { failed: true, reason: 'WhatsApp desactivado en el VPS (ENABLE_WHATSAPP=true).' };
  }
  if (!st.isReady) {
    return {
      failed: true,
      reason: st.hasQr
        ? 'Escanea el QR en Configuración → WhatsApp.'
        : (st.error ?? 'WhatsApp aún no está listo en el servidor.'),
    };
  }
  try {
    const wa = new WhatsAppWebService();
    await wa.sendMessage(phone, message);
    return 'sent';
  } catch (err) {
    return { failed: true, reason: (err as Error).message };
  }
}

function waFailure(result: 'sent' | 'failed' | { failed: true; reason: string }): result is { failed: true; reason: string } {
  return typeof result === 'object' && result.failed === true;
}

function waErrorReason(result: 'sent' | 'failed' | { failed: true; reason: string }): string | null {
  return waFailure(result) ? result.reason : null;
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

    let phone = body.phone;
    if (!phone) {
      const customer = await prisma.customer.findUnique({
        where: { id: body.customerId },
        select: { phone: true },
      });
      phone = customer?.phone ?? undefined;
    }
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

    const waResult = await dispatchWA(phone, body.message);
    const status = waResult === 'sent' ? 'sent' : 'failed';
    const errorMsg = waErrorReason(waResult);
    await prisma.notification.update({
      where: { id: record.id },
      data: { status, errorMsg },
    });

    if (status === 'sent') {
      res.json({ ok: true, id: record.id, status });
    } else {
      res.status(422).json({
        error: errorMsg ?? 'No se pudo enviar por WhatsApp',
        id: record.id,
        status,
        whatsapp: getWhatsAppStatus(),
      });
    }
  } catch (err) {
    next(err);
  }
};

export const sendServiceNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workshopId = req.workshopId!;
    const serviceId = String(req.params['serviceId']);
    const { templateId, extraParams } = req.body as { templateId: string; extraParams?: Record<string, string> };

    const service = await prisma.service.findFirst({ where: { id: serviceId, workshopId } });
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });

    const motorcycle = await prisma.motorcycle.findUnique({ where: { id: service.motorcycleId } });
    if (!motorcycle) return res.status(404).json({ error: 'Moto no encontrada' });

    const customer = await prisma.customer.findUnique({ where: { id: motorcycle.customerId } });
    if (!customer?.phone) return res.status(400).json({ error: 'El cliente no tiene teléfono' });

    const params: Record<string, string> = {
      '1': customer.name,
      '2': motorcycle.placa,
      '3': String(Number(service.totalCost)),
      ...extraParams,
    };

    const builder = TEMPLATES[templateId];
    const message = builder ? builder(params) : `MotoBrain: Servicio ${serviceId}`;

    const record = await prisma.notification.create({
      data: {
        workshopId,
        customerId: customer.id,
        serviceId,
        type: templateId,
        phone: customer.phone,
        message,
        status: 'pending',
      },
    });

    const waResult = await dispatchWA(customer.phone, message);
    const status = waResult === 'sent' ? 'sent' : 'failed';
    const errorMsg = waErrorReason(waResult);
    await prisma.notification.update({
      where: { id: record.id },
      data: { status, errorMsg },
    });

    if (status === 'sent') {
      res.json({ ok: true, id: record.id, status });
    } else {
      res.status(422).json({
        error: errorMsg ?? 'No se pudo enviar por WhatsApp',
        id: record.id,
        status,
        whatsapp: getWhatsAppStatus(),
      });
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

    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
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
