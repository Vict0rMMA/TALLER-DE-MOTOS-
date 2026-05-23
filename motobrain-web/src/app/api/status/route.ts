import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const base = (process.env.BACKEND_URL?.trim() || 'http://185.166.212.43').replace(/\/+$/, '');
  const badPort = base.includes(':4000');

  try {
    const res = await fetch(`${base}/api/v1/health`, {
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json({
      ok: res.ok,
      vpsReachable: res.ok,
      backendUrl: base,
      badPort,
      health: body,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        vpsReachable: false,
        backendUrl: base,
        badPort,
        error: e instanceof Error ? e.message : 'timeout',
        hint: badPort
          ? 'BACKEND_URL no debe usar :4000; la API está en puerto 80.'
          : 'Abre el puerto 80 en Clouding y confirma pm2 en el VPS.',
      },
      { status: 503 },
    );
  }
}
