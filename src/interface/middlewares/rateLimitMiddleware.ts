import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Upstash sliding-window rate limiter — survives Vercel cold starts.
// Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in env vars.
// Free tier at https://upstash.com — set both vars in moto-taller-app Vercel settings.
// Falls back to in-memory Map when vars are absent (dev / local).

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const upstashAuth = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: false,
    })
  : null;

const upstashApi = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, '60 s'),
      analytics: false,
    })
  : null;

// In-memory fallback — wiped on each cold start, only for local dev
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function memoryCheck(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = requestCounts.get(key);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

function makeMiddleware(
  upstash: Ratelimit | null,
  maxRequests: number,
  windowMs: number,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? 'unknown';
    if (upstash) {
      const { success } = await upstash.limit(key);
      if (!success) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' });
      }
    } else {
      if (!memoryCheck(key, maxRequests, windowMs)) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' });
      }
    }
    next();
  };
}

export const authRateLimit = makeMiddleware(upstashAuth, 10, 60_000);
export const apiRateLimit = makeMiddleware(upstashApi, 100, 60_000);
