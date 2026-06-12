import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/prisma/client';
import { signCustomerToken } from '../../infrastructure/config/jwt';
import { DomainError } from '../../domain/errors/DomainError';
import { phoneLookupVariants } from '../../infrastructure/phone/phoneVariants';
import { normalizeCedula } from '../../infrastructure/phone/cedula';
import { uploadMotoPhoto } from '../../infrastructure/storage/supabaseStorage';
import { WhatsAppWebService } from '../../infrastructure/whatsapp/WhatsAppWebService';

export const portalRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, cedula, email, moto } = req.body as {
      name?: string; phone?: string; cedula?: string; email?: string;
      moto?: { placa?: string; brand?: string; model?: string; cc?: number; year?: number; imageBase64?: string; imageMimeType?: string };
    };
    if (!name?.trim() || !phone?.trim() || !cedula?.trim()) {
      return next(new DomainError('Nombre, teléfono y cédula son requeridos', 400));
    }

    const workshop = await prisma.workshop.findFirst({ select: { id: true }, orderBy: { createdAt: 'asc' } });
    if (!workshop) return next(new DomainError('Taller no configurado', 500));

    const existing = await prisma.customer.findFirst({
      where: { workshopId: workshop.id, phone: phone.trim() },
    });
    if (existing) return next(new DomainError('Ya existe un cliente con ese teléfono', 409));

    const customer = await prisma.customer.create({
      data: {
        workshopId: workshop.id,
        name: name.trim(),
        phone: phone.trim(),
        cedula: cedula.trim(),
        email: email?.trim() ?? null,
        portalActive: true,
        optInWhatsapp: true,
      },
    });

    // Registrar moto si viene en el body
    if (moto?.placa?.trim() && moto?.brand?.trim() && moto?.model?.trim()) {
      const newMoto = await prisma.motorcycle.create({
        data: {
          customerId: customer.id,
          placa: moto.placa.trim().toUpperCase(),
          brand: moto.brand.trim(),
          model: moto.model.trim(),
          cc: moto.cc ?? 125,
          year: moto.year ?? null,
          kmCurrent: 0,
        },
      });

      // Subir foto si viene en base64
      if (moto.imageBase64) {
        try {
          const mimeType = moto.imageMimeType ?? 'image/jpeg';
          const buffer = Buffer.from(moto.imageBase64, 'base64');
          const imageUrl = await uploadMotoPhoto(customer.id, newMoto.id, buffer, mimeType);
          await prisma.motorcycle.update({ where: { id: newMoto.id }, data: { imageUrl } });
        } catch {
          // No bloquear el registro si falla la foto
        }
      }
    }

    // Notificar al taller del nuevo cliente
    void (async () => {
      try {
        const ws = await prisma.workshop.findUnique({ where: { id: workshop.id }, select: { phone: true } });
        if (ws?.phone) {
          const wa = new WhatsAppWebService();
          await wa.sendMessage(
            ws.phone,
            `🆕 *Nuevo cliente registrado en el portal*\n\n👤 ${customer.name}\n📱 ${customer.phone}\n📧 ${customer.email ?? '—'}\n\n_Ya puede ver sus motos y agendar citas._`,
          );
        }
      } catch { /* no bloquear */ }
    })();

    const token = signCustomerToken({
      customerId: customer.id,
      workshopId: customer.workshopId,
      name: customer.name,
      phone: customer.phone,
    });

    res.status(201).json({
      token,
      customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email },
    });
  } catch (err) {
    next(err);
  }
};

export const portalLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body as { phone?: string; password?: string };
    if (!phone || !password) return next(new DomainError('Teléfono y cédula requeridos', 400));

    const variants = phoneLookupVariants(phone);
    if (!variants.length) return next(new DomainError('Ingresa un número de celular válido', 400));

    const customer = await prisma.customer.findFirst({
      where: { portalActive: true, phone: { in: variants } },
    });

    if (!customer?.cedula) {
      return next(new DomainError('Teléfono o cédula incorrectos', 401));
    }

    const inputCedula = normalizeCedula(password);
    const storedCedula = normalizeCedula(customer.cedula);
    if (!inputCedula || inputCedula !== storedCedula) {
      return next(new DomainError('Teléfono o cédula incorrectos', 401));
    }

    const token = signCustomerToken({
      customerId: customer.id,
      workshopId: customer.workshopId,
      name: customer.name,
      phone: customer.phone,
    });

    res.json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        workshopId: customer.workshopId,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const portalMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.customerId },
      include: {
        motorcycles: { orderBy: { createdAt: 'asc' } },
        workshop: { select: { name: true, phone: true, address: true } },
      },
    });
    if (!customer) return next(new DomainError('Cliente no encontrado', 404));

    res.json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      cedula: customer.cedula,
      workshop: customer.workshop,
      motorcycles: customer.motorcycles.map((m) => ({
        id: m.id,
        placa: m.placa,
        brand: m.brand,
        model: m.model,
        cc: m.cc,
        year: m.year,
        kmCurrent: m.kmCurrent,
        imageUrl: m.imageUrl ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const portalDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;

    // Query 1: cliente + motos + taller (1 round-trip)
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        motorcycles: { orderBy: { createdAt: 'asc' } },
        workshop: { select: { name: true, phone: true, address: true } },
      },
    });
    if (!customer) return next(new DomainError('Cliente no encontrado', 404));

    const motoIds = customer.motorcycles.map((m) => m.id);

    // Query 2: servicios + citas en paralelo (1 round-trip)
    const [services, appointments] = await Promise.all([
      prisma.service.findMany({
        where: { motorcycleId: { in: motoIds } },
        orderBy: { serviceDate: 'desc' },
        include: {
          motorcycle: { select: { placa: true, brand: true, model: true } },
          mechanic: { select: { name: true } },
          products: { include: { product: { select: { name: true } } } },
        },
      }),
      prisma.workshopAppointment.findMany({
        where: { customerId },
        orderBy: [{ scheduledAt: 'asc' }, { preferredDate: 'asc' }, { createdAt: 'desc' }],
        take: 20,
        include: { motorcycle: { select: { placa: true, brand: true, model: true } } },
      }),
    ]);

    res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        cedula: customer.cedula,
      },
      workshop: customer.workshop,
      motorcycles: customer.motorcycles.map((m) => ({
        id: m.id,
        placa: m.placa,
        brand: m.brand,
        model: m.model,
        cc: m.cc,
        year: m.year,
        kmCurrent: m.kmCurrent,
        imageUrl: m.imageUrl ?? null,
      })),
      services: services.map((s) => ({
        id: s.id,
        type: s.type,
        description: s.description,
        status: s.status,
        serviceDate: s.serviceDate,
        closedAt: s.closedAt,
        laborCost: Number(s.laborCost),
        totalCost: Number(s.totalCost),
        kmAtService: s.kmAtService,
        nextMaintenanceKm: s.nextMaintenanceKm,
        nextMaintenanceDate: s.nextMaintenanceDate,
        motorcycle: s.motorcycle,
        mechanic: s.mechanic?.name ?? null,
        products: s.products.map((p) => ({
          name: p.product.name,
          quantity: p.quantity,
          unitPrice: Number(p.unitPrice),
        })),
      })),
      appointments: appointments.map((a) => ({
        id: a.id,
        notes: a.notes,
        preferredDate: a.preferredDate,
        scheduledAt: a.scheduledAt,
        status: a.status,
        createdAt: a.createdAt,
        motorcycle: a.motorcycle,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const portalServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const motorcycles = await prisma.motorcycle.findMany({
      where: { customerId: req.customerId },
      select: { id: true },
    });
    const motoIds = motorcycles.map((m) => m.id);

    const services = await prisma.service.findMany({
      where: { motorcycleId: { in: motoIds } },
      orderBy: { serviceDate: 'desc' },
      include: {
        motorcycle: { select: { placa: true, brand: true, model: true } },
        mechanic: { select: { name: true } },
        products: {
          include: { product: { select: { name: true } } },
        },
      },
    });

    res.json(
      services.map((s) => ({
        id: s.id,
        type: s.type,
        description: s.description,
        status: s.status,
        serviceDate: s.serviceDate,
        closedAt: s.closedAt,
        laborCost: Number(s.laborCost),
        totalCost: Number(s.totalCost),
        kmAtService: s.kmAtService,
        nextMaintenanceKm: s.nextMaintenanceKm,
        nextMaintenanceDate: s.nextMaintenanceDate,
        motorcycle: s.motorcycle,
        mechanic: s.mechanic?.name ?? null,
        products: s.products.map((p) => ({
          name: p.product.name,
          quantity: p.quantity,
          unitPrice: Number(p.unitPrice),
        })),
      })),
    );
  } catch (err) {
    next(err);
  }
};

export const portalServiceDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceId = String(req.params.id);

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        motorcycle: { select: { placa: true, brand: true, model: true, customerId: true } },
        mechanic: { select: { name: true } },
        products: {
          include: { product: { select: { name: true, brand: true } } },
        },
      },
    });

    if (!service) return next(new DomainError('Servicio no encontrado', 404));
    if (service.motorcycle.customerId !== req.customerId) {
      return next(new DomainError('Sin acceso a este servicio', 403));
    }

    res.json({
      id: service.id,
      type: service.type,
      description: service.description,
      status: service.status,
      serviceDate: service.serviceDate,
      closedAt: service.closedAt,
      laborCost: Number(service.laborCost),
      totalCost: Number(service.totalCost),
      kmAtService: service.kmAtService,
      nextMaintenanceKm: service.nextMaintenanceKm,
      nextMaintenanceDate: service.nextMaintenanceDate,
      motorcycle: service.motorcycle,
      mechanic: service.mechanic?.name ?? null,
      photos: service.photos,
      products: service.products.map((p) => ({
        name: p.product.name,
        brand: p.product.brand,
        quantity: p.quantity,
        unitPrice: Number(p.unitPrice),
        subtotal: Number(p.unitPrice) * p.quantity,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const portalAddMotorcycle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { placa, brand, model, cc, year, kmCurrent } = req.body as {
      placa?: string;
      brand?: string;
      model?: string;
      cc?: number;
      year?: number;
      kmCurrent?: number;
    };

    if (!placa?.trim() || !brand?.trim() || !model?.trim()) {
      return next(new DomainError('Placa, marca y modelo son obligatorios', 400));
    }

    const normalizedPlaca = placa.trim().toUpperCase();

    const duplicate = await prisma.motorcycle.findFirst({
      where: { customerId: req.customerId!, placa: normalizedPlaca },
    });
    if (duplicate) {
      return next(new DomainError(`La placa ${normalizedPlaca} ya está registrada`, 409));
    }

    const motorcycle = await prisma.motorcycle.create({
      data: {
        customerId: req.customerId!,
        placa: normalizedPlaca,
        brand: brand.trim(),
        model: model.trim(),
        cc: cc && cc > 0 ? Math.round(cc) : 125,
        year: year && year > 1980 ? Math.round(year) : null,
        kmCurrent: kmCurrent && kmCurrent >= 0 ? Math.round(kmCurrent) : 0,
      },
    });

    res.status(201).json({
      id: motorcycle.id,
      placa: motorcycle.placa,
      brand: motorcycle.brand,
      model: motorcycle.model,
      cc: motorcycle.cc,
      year: motorcycle.year,
      kmCurrent: motorcycle.kmCurrent,
    });
  } catch (err) {
    next(err);
  }
};

export const portalUpdateMotoPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const motoId = String(req.params.id);
    const { imageBase64, imageMimeType } = req.body as { imageBase64?: string; imageMimeType?: string };

    const moto = await prisma.motorcycle.findFirst({
      where: { id: motoId, customerId: req.customerId! },
    });
    if (!moto) return next(new DomainError('Moto no encontrada', 404));
    if (!imageBase64?.trim()) return next(new DomainError('Imagen requerida', 400));

    const buffer = Buffer.from(imageBase64, 'base64');
    const mimeType = imageMimeType ?? 'image/jpeg';
    const imageUrl = await uploadMotoPhoto(req.customerId!, motoId, buffer, mimeType);

    await prisma.motorcycle.update({ where: { id: motoId }, data: { imageUrl } });

    res.json({ ok: true, imageUrl });
  } catch (e) {
    next(e);
  }
};

export const portalScheduleRevision = async (req: Request, res: Response, next: NextFunction) => {
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

    const motoLabel = motorcycle
      ? `${motorcycle.brand} ${motorcycle.model} (${motorcycle.placa})`
      : 'sin moto especificada';
    const dateHint = preferredDate?.trim() ? ` Fecha preferida: ${preferredDate.trim()}.` : '';
    const extra = notes?.trim() ? ` Notas: ${notes.trim()}` : '';
    const symptom = `Solicitud de agendar revisión — ${motoLabel}.${dateHint}${extra}`;

    const aiResponse =
      'Tu solicitud de revisión fue enviada al taller. Un mecánico te contactará pronto para confirmar día y hora.';

    const consultation = await prisma.clientConsultation.create({
      data: {
        workshopId: req.workshopId!,
        customerId: req.customerId!,
        motorcycleId: motorcycle?.id ?? null,
        symptom,
        aiResponse,
        status: 'pending',
      },
    });

    res.status(201).json({
      id: consultation.id,
      message: aiResponse,
      status: consultation.status,
    });
  } catch (err) {
    next(err);
  }
};

export const enablePortal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = String(req.params.customerId);

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, workshopId: req.workshopId },
    });
    if (!customer) return next(new DomainError('Cliente no encontrado', 404));
    if (!customer.cedula?.trim()) {
      return next(new DomainError('Registra la cédula del cliente antes de activar el portal', 400));
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: { portalActive: true, passwordHash: null },
    });

    res.json({ ok: true, message: 'Portal activado. El cliente entra con su celular y cédula.' });
  } catch (err) {
    next(err);
  }
};

export const disablePortal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = String(req.params.customerId);
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, workshopId: req.workshopId },
    });
    if (!customer) return next(new DomainError('Cliente no encontrado', 404));

    await prisma.customer.update({
      where: { id: customerId },
      data: { portalActive: false, passwordHash: null },
    });

    res.json({ ok: true, message: 'Acceso al portal desactivado.' });
  } catch (err) {
    next(err);
  }
};
