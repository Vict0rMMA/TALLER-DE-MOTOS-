import { Redis } from '@upstash/redis';

// Almacén del código OTP del portal del cliente.
// Usa Upstash Redis si está configurado (sobrevive el serverless de Vercel:
// el código se comparte entre instancias y expira solo). Si no hay Upstash
// (dev/local), cae a un Map en memoria — mismo patrón que el rate-limit.

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

const TTL_S = 5 * 60; // 5 minutos
const keyOf = (customerId: string) => `portal-otp:${customerId}`;

export interface OtpEntry {
  code: string;
  customerId: string;
  attempts: number;
}

export const MAX_OTP_ATTEMPTS = 5;

// Fallback en memoria (solo dev/local sin Upstash)
const mem = new Map<string, { entry: OtpEntry; expiresAt: number }>();

export async function setOtp(customerId: string, code: string): Promise<void> {
  const entry: OtpEntry = { code, customerId, attempts: 0 };
  if (redis) {
    await redis.set(keyOf(customerId), entry, { ex: TTL_S });
  } else {
    mem.set(customerId, { entry, expiresAt: Date.now() + TTL_S * 1000 });
    setTimeout(() => mem.delete(customerId), TTL_S * 1000);
  }
}

export async function getOtp(customerId: string): Promise<OtpEntry | null> {
  if (redis) {
    return (await redis.get<OtpEntry>(keyOf(customerId))) ?? null;
  }
  const m = mem.get(customerId);
  if (!m) return null;
  if (Date.now() > m.expiresAt) {
    mem.delete(customerId);
    return null;
  }
  return m.entry;
}

/** Suma un intento fallido y devuelve el total. Bloquea (borra el codigo) al llegar al limite. */
export async function registerFailedAttempt(customerId: string): Promise<number> {
  const entry = await getOtp(customerId);
  if (!entry) return MAX_OTP_ATTEMPTS;
  const attempts = entry.attempts + 1;
  if (attempts >= MAX_OTP_ATTEMPTS) {
    await deleteOtp(customerId);
    return attempts;
  }
  const updated: OtpEntry = { ...entry, attempts };
  if (redis) {
    const ttl = await redis.ttl(keyOf(customerId));
    await redis.set(keyOf(customerId), updated, { ex: ttl > 0 ? ttl : TTL_S });
  } else {
    const m = mem.get(customerId);
    if (m) m.entry = updated;
  }
  return attempts;
}

export async function deleteOtp(customerId: string): Promise<void> {
  if (redis) await redis.del(keyOf(customerId));
  else mem.delete(customerId);
}
