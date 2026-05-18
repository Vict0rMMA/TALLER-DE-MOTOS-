import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/prisma/client';
import { runPortalConsultationAI } from '../../infrastructure/ai/portalConsultationAI';
import { WhatsAppWebService } from '../../infrastructure/whatsapp/WhatsAppWebService';
import { DomainError } from '../../domain/errors/DomainError';

async function findRelevantCatalogItems(workshopId: string, symptom: string) {
  const words = symptom
    .toLowerCase()
    .replace(/[^a-záéíóúüñ\s]/gi, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (!words.length) {
    return prisma.repairCatalogItem.findMany({
      where: { workshopId, active: true },
      take: 8,
      orderBy: { name: 'asc' },
    });
  }

  return prisma.repairCatalogItem.findMany({
    where: {
      workshopId,
      active: true,
      OR: [
        ...words.map((w) => ({ name: { contains: w, mode: 'insensitive' as const } })),
        ...words.map((w) => ({ category: { contains: w, mode: 'insensitive' as const } })),
        ...words.map((w) => ({ description: { contains: w, mode: 'insensitive' as const } })),
      ],
    },
    take: 6,
  });
}

export const portalConsult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symptom, motorcycleId } = req.body as { symptom?: string; motorcycleId?: string };
    if (!symptom?.trim()) return next(new DomainError('La consulta no puede estar vacía', 400));

    const customer = await prisma.customer.findUnique({
      where: { id: req.customerId },
      include: { workshop: { select: { name: true } } },
    });
    if (!customer) return next(new DomainError('Cliente no encontrado', 404));

    let motorcycle: any = null;
    if (motorcycleId) {
      motorcycle = await prisma.motorcycle.findFirst({
        where: { id: motorcycleId, customerId: req.customerId! },
      });
    }
    if (!motorcycle) {
      motorcycle = await prisma.motorcycle.findFirst({
        where: { customerId: req.customerId! },
      });
    }

    const motorcycleInfo = motorcycle
      ? `${motorcycle.brand} ${motorcycle.model} ${motorcycle.year ?? ''} ${motorcycle.cc}cc — Placa: ${motorcycle.placa}`
      : 'Moto no especificada';

    const catalogItems = await findRelevantCatalogItems(req.workshopId!, symptom.trim());

    const aiResult = await runPortalConsultationAI(symptom.trim(), motorcycleInfo, catalogItems);
    const { routedTo, response: aiResponse, minPrice, maxPrice } = aiResult;

    const consultation = await prisma.clientConsultation.create({
      data: {
        workshopId: req.workshopId!,
        customerId: req.customerId!,
        motorcycleId: motorcycle?.id ?? null,
        symptom: symptom.trim(),
        aiResponse,
        aiMinPrice: minPrice,
        aiMaxPrice: maxPrice,
        status: routedTo === 'mechanic' ? 'pending' : 'answered',
      },
    });

    res.status(201).json({
      id: consultation.id,
      symptom: consultation.symptom,
      aiResponse,
      aiMinPrice: minPrice,
      aiMaxPrice: maxPrice,
      routedTo,
      status: consultation.status,
      createdAt: consultation.createdAt,
    });
  } catch (e) { next(e); }
};

export const portalGetConsultations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.clientConsultation.findMany({
      where: { customerId: req.customerId! },
      orderBy: { createdAt: 'desc' },
      include: { motorcycle: { select: { placa: true, brand: true, model: true } } },
      take: 20,
    });
    res.json(rows.map(toClientDto));
  } catch (e) { next(e); }
};

export const listConsultations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const rows = await prisma.clientConsultation.findMany({
      where: { workshopId: req.workshopId!, ...(status !== 'all' ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        motorcycle: { select: { placa: true, brand: true, model: true } },
        mechanic: { select: { name: true } },
      },
      take: 50,
    });
    res.json(rows.map(toWorkshopDto));
  } catch (e) { next(e); }
};

export const pendingCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.clientConsultation.count({
      where: { workshopId: req.workshopId!, status: 'pending' },
    });
    res.json({ count });
  } catch (e) { next(e); }
};

export const respondToConsultation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { mechanicResponse, mechanicPrice } = req.body as {
      mechanicResponse?: string;
      mechanicPrice?: number;
    };
    if (!mechanicResponse?.trim()) {
      return next(new DomainError('La respuesta no puede estar vacía', 400));
    }

    const existing = await prisma.clientConsultation.findFirst({
      where: { id, workshopId: req.workshopId! },
    });
    if (!existing) return next(new DomainError('Consulta no encontrada', 404));

    const responseText = mechanicResponse.trim();

    const updated = await prisma.clientConsultation.update({
      where: { id },
      data: {
        mechanicResponse: responseText,
        mechanicPrice: mechanicPrice ?? null,
        respondedBy: req.userId!,
        respondedAt: new Date(),
        status: 'answered',
      },
      include: {
        customer: { select: { name: true, phone: true, optInWhatsapp: true } },
        motorcycle: { select: { placa: true, brand: true, model: true } },
        mechanic: { select: { name: true } },
      },
    });

    (async () => {
      try {
        const { customer, motorcycle } = updated;
        if (customer?.optInWhatsapp && customer.phone) {
          const wa = new WhatsAppWebService();
          const priceLine =
            mechanicPrice != null
              ? `$${Number(mechanicPrice).toLocaleString('es-CO')} COP`
              : '';
          await wa.sendTemplate(customer.phone, 'consultation_answered', {
            '1': customer.name ?? 'Cliente',
            '2': motorcycle?.placa ?? 'tu moto',
            '3': responseText.length > 280 ? `${responseText.slice(0, 277)}…` : responseText,
            '4': priceLine,
          });
        }
      } catch (waErr) {
        console.warn('[respondToConsultation] WhatsApp failed:', (waErr as Error).message);
      }
    })();

    res.json(toWorkshopDto(updated));
  } catch (e) { next(e); }
};

function toClientDto(r: any) {
  return {
    id: r.id,
    symptom: r.symptom,
    aiResponse: r.aiResponse,
    aiMinPrice: r.aiMinPrice !== null ? Number(r.aiMinPrice) : null,
    aiMaxPrice: r.aiMaxPrice !== null ? Number(r.aiMaxPrice) : null,
    mechanicResponse: r.mechanicResponse,
    mechanicPrice: r.mechanicPrice !== null ? Number(r.mechanicPrice) : null,
    status: r.status,
    createdAt: r.createdAt,
    respondedAt: r.respondedAt,
    motorcycle: r.motorcycle,
  };
}

function toWorkshopDto(r: any) {
  return {
    id: r.id,
    symptom: r.symptom,
    aiResponse: r.aiResponse,
    aiMinPrice: r.aiMinPrice !== null ? Number(r.aiMinPrice) : null,
    aiMaxPrice: r.aiMaxPrice !== null ? Number(r.aiMaxPrice) : null,
    mechanicResponse: r.mechanicResponse ?? null,
    mechanicPrice: r.mechanicPrice !== null ? Number(r.mechanicPrice) : null,
    status: r.status,
    createdAt: r.createdAt,
    respondedAt: r.respondedAt,
    customer: r.customer,
    motorcycle: r.motorcycle,
    mechanic: r.mechanic,
  };
}
