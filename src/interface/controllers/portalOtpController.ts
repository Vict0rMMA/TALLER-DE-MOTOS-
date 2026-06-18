import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/prisma/client';
import { signCustomerToken } from '../../infrastructure/config/jwt';
import { getWhatsAppService } from '../../infrastructure/whatsapp/factory';
import { DomainError } from '../../domain/errors/DomainError';
import { normalizePhoneDigits, phoneLookupVariants } from '../../infrastructure/phone/phoneVariants';
import { setOtp, getOtp, deleteOtp } from '../../infrastructure/redis/otpStore';

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const requestOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body as { phone?: string };
    if (!phone?.trim()) return next(new DomainError('Ingresa tu número de celular', 400));

    const variants = phoneLookupVariants(phone);
    if (!variants.length) return next(new DomainError('Ingresa tu número de celular', 400));

    const customer = await prisma.customer.findFirst({
      where: { portalActive: true, phone: { in: variants } },
    });

    if (!customer) {
      return next(new DomainError('Número no registrado o portal no activado. Contacta al taller.', 404));
    }

    const code = generateCode();
    await setOtp(customer.id, code);

    try {
      const wa = getWhatsAppService();
      const digits = normalizePhoneDigits(phone);
      const to = digits.startsWith('57') ? digits : `57${digits}`;
      await wa.sendMessage(to, `🔐 Tu código de acceso a MotoBrain es: *${code}*\n\nVálido por 5 minutos. No lo compartas con nadie.`);
    } catch (waErr) {
      console.warn('[requestOtp] WhatsApp failed:', (waErr as Error).message);
    }

    res.json({ message: 'Código enviado por WhatsApp', customerId: customer.id });
  } catch (e) { next(e); }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, code } = req.body as { customerId?: string; code?: string };
    if (!customerId || !code) return next(new DomainError('Datos incompletos', 400));

    const entry = await getOtp(customerId);
    if (!entry) {
      return next(new DomainError('Código expirado. Solicita uno nuevo.', 401));
    }
    if (entry.code !== code.trim()) {
      return next(new DomainError('Código incorrecto', 401));
    }

    await deleteOtp(customerId);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, phone: true, workshopId: true, portalActive: true },
    });

    if (!customer?.portalActive) {
      return next(new DomainError('Portal no activado', 403));
    }

    const token = signCustomerToken({
      customerId: customer.id,
      workshopId: customer.workshopId,
      name: customer.name,
      phone: customer.phone,
    });

    res.json({ token, customer: { id: customer.id, name: customer.name, phone: customer.phone } });
  } catch (e) { next(e); }
};
