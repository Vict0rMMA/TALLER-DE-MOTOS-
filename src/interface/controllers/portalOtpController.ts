import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/prisma/client';
import { signCustomerToken } from '../../infrastructure/config/jwt';
import { WhatsAppWebService } from '../../infrastructure/whatsapp/WhatsAppWebService';
import { DomainError } from '../../domain/errors/DomainError';

interface OtpEntry { code: string; customerId: string; expiresAt: number }
const otpStore = new Map<string, OtpEntry>();

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizePhone(raw: string) {
  return raw.replace(/\D/g, '');
}

export const requestOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body as { phone?: string };
    if (!phone?.trim()) return next(new DomainError('Ingresa tu número de celular', 400));

    const digits = normalizePhone(phone.trim());

    const customer = await prisma.customer.findFirst({
      where: {
        portalActive: true,
        OR: [
          { phone: digits },
          { phone: `+57${digits}` },
          { phone: digits.startsWith('57') ? digits.slice(2) : `57${digits}` },
        ],
      },
    });

    if (!customer) {
      return next(new DomainError('Número no registrado o portal no activado. Contacta al taller.', 404));
    }

    const code = generateCode();
    const key = `${customer.id}`;
    otpStore.set(key, { code, customerId: customer.id, expiresAt: Date.now() + 5 * 60_000 });

    setTimeout(() => otpStore.delete(key), 5 * 60_000);

    try {
      const wa = new WhatsAppWebService();
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

    const entry = otpStore.get(customerId);
    if (!entry || entry.expiresAt < Date.now()) {
      return next(new DomainError('Código expirado. Solicita uno nuevo.', 401));
    }
    if (entry.code !== code.trim()) {
      return next(new DomainError('Código incorrecto', 401));
    }

    otpStore.delete(customerId);

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
