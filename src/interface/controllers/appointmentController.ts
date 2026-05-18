import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/prisma/client';
import { WhatsAppWebService } from '../../infrastructure/whatsapp/WhatsAppWebService';
import { DomainError } from '../../domain/errors/DomainError';

function toPortalDto(row: {
  id: string;
  notes: string | null;
  preferredDate: Date | null;
  scheduledAt: Date | null;
  status: string;
  createdAt: Date;
  motorcycle: { placa: string; brand: string; model: string } | null;
}) {
  return {
    id: row.id,
    notes: row.notes,
    preferredDate: row.preferredDate,
    scheduledAt: row.scheduledAt,
    status: row.status,
    createdAt: row.createdAt,
    motorcycle: row.motorcycle,
  };
}

function toWorkshopDto(row: {
  id: string;
  notes: string | null;
  preferredDate: Date | null;
  scheduledAt: Date | null;
  status: string;
  createdAt: Date;
  customer: { id: string; name: string; phone: string };
  motorcycle: { placa: string; brand: string; model: string } | null;
  mechanic: { name: string } | null;
}) {
  return {
    id: row.id,
    notes: row.notes,
    preferredDate: row.preferredDate,
    scheduledAt: row.scheduledAt,
    status: row.status,
    createdAt: row.createdAt,
    customer: row.customer,
    motorcycle: row.motorcycle,
    mechanic: row.mechanic,
  };
}

export const portalListAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.workshopAppointment.findMany({
      where: { customerId: req.customerId! },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        motorcycle: { select: { placa: true, brand: true, model: true } },
      },
    });
    res.json(rows.map(toPortalDto));
  } catch (e) {
    next(e);
  }
};

export const portalNextAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await prisma.workshopAppointment.findFirst({
      where: {
        customerId: req.customerId!,
        status: { in: ['pending', 'confirmed'] },
      },
      orderBy: [{ scheduledAt: 'asc' }, { preferredDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        motorcycle: { select: { placa: true, brand: true, model: true } },
      },
    });
    res.json(row ? toPortalDto(row) : null);
  } catch (e) {
    next(e);
  }
};

export const portalCreateAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { motorcycleId, notes, preferredDate } = req.body as {
      motorcycleId?: string;
      notes?: string;
      preferredDate?: string;
    };

    let motorcycle: { id: string; placa: string; brand: string; model: string } | null = null;
    if (motorcycleId) {
      motorcycle = await prisma.motorcycle.findFirst({
        where: { id: motorcycleId, customerId: req.customerId! },
        select: { id: true, placa: true, brand: true, model: true },
      });
      if (!motorcycle) return next(new DomainError('Moto no encontrada', 404));
    } else {
      motorcycle = await prisma.motorcycle.findFirst({
        where: { customerId: req.customerId! },
        select: { id: true, placa: true, brand: true, model: true },
        orderBy: { createdAt: 'asc' },
      });
    }

    let parsedPreferred: Date | null = null;
    if (preferredDate?.trim()) {
      const d = new Date(preferredDate.trim());
      if (!Number.isNaN(d.getTime())) parsedPreferred = d;
    }

    const appointment = await prisma.workshopAppointment.create({
      data: {
        workshopId: req.workshopId!,
        customerId: req.customerId!,
        motorcycleId: motorcycle?.id ?? null,
        notes: notes?.trim() || null,
        preferredDate: parsedPreferred,
        status: 'pending',
      },
      include: {
        motorcycle: { select: { placa: true, brand: true, model: true } },
      },
    });

    res.status(201).json({
      ...toPortalDto(appointment),
      message:
        'Tu solicitud de cita fue enviada. El taller te confirmará la fecha y hora pronto.',
    });
  } catch (e) {
    next(e);
  }
};

export const listAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const rows = await prisma.workshopAppointment.findMany({
      where: {
        workshopId: req.workshopId!,
        ...(status !== 'all' ? { status: status as 'pending' | 'confirmed' | 'cancelled' | 'completed' } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        motorcycle: { select: { placa: true, brand: true, model: true } },
        mechanic: { select: { name: true } },
      },
    });
    res.json(rows.map(toWorkshopDto));
  } catch (e) {
    next(e);
  }
};

export const pendingAppointmentsCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.workshopAppointment.count({
      where: { workshopId: req.workshopId!, status: 'pending' },
    });
    res.json({ count });
  } catch (e) {
    next(e);
  }
};

export const confirmAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { scheduledAt, notes } = req.body as { scheduledAt?: string; notes?: string };

    if (!scheduledAt?.trim()) {
      return next(new DomainError('Indica la fecha y hora de la cita', 400));
    }

    const when = new Date(scheduledAt.trim());
    if (Number.isNaN(when.getTime())) {
      return next(new DomainError('Fecha u hora no válida', 400));
    }

    const existing = await prisma.workshopAppointment.findFirst({
      where: { id, workshopId: req.workshopId! },
    });
    if (!existing) return next(new DomainError('Cita no encontrada', 404));

    const updated = await prisma.workshopAppointment.update({
      where: { id },
      data: {
        scheduledAt: when,
        status: 'confirmed',
        confirmedBy: req.userId!,
        notes: notes?.trim() ? notes.trim() : existing.notes,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, optInWhatsapp: true } },
        motorcycle: { select: { placa: true, brand: true, model: true } },
        mechanic: { select: { name: true } },
      },
    });

    (async () => {
      try {
        const { customer, motorcycle } = updated;
        if (customer?.optInWhatsapp && customer.phone) {
          const wa = new WhatsAppWebService();
          const fecha = when.toLocaleString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          });
          await wa.sendTemplate(customer.phone, 'appointment_confirmed', {
            '1': customer.name ?? 'Cliente',
            '2': motorcycle?.placa ?? 'tu moto',
            '3': fecha,
          });
        }
      } catch (waErr) {
        console.warn('[confirmAppointment] WhatsApp failed:', (waErr as Error).message);
      }
    })();

    res.json(toWorkshopDto(updated));
  } catch (e) {
    next(e);
  }
};
