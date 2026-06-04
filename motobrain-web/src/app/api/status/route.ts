import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const base = (process.env.BACKEND_URL?.trim() || 'https://moto-taller-app.vercel.app').replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/api/v1/health`, {
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, backendUrl: base, health: body });
  } catch (e) {
    return NextResponse.json(
      { ok: false, backendUrl: base, error: e instanceof Error ? e.message : 'timeout' },
      { status: 503 },
    );
  }
}
