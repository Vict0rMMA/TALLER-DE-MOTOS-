import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

function backendRoot(): string {
  const raw = process.env.BACKEND_URL?.trim() || 'http://185.166.212.43';
  const base = raw.replace(/\/+$/, '');
  if (base.includes(':4000')) {
    console.warn('[api/backend] BACKEND_URL usa :4000; en el VPS la API suele estar en puerto 80.');
  }
  return base;
}

async function proxy(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const path = pathSegments.join('/');
  const target = `${backendRoot()}/api/v1/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  const auth = req.headers.get('authorization');
  if (auth) headers.set('authorization', auth);
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: AbortSignal.timeout(55_000),
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  try {
    const res = await fetch(target, init);
    const body = await res.arrayBuffer();
    const out = new NextResponse(body, { status: res.status });
    const ct = res.headers.get('content-type');
    if (ct) out.headers.set('content-type', ct);
    return out;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de conexión';
    return NextResponse.json(
      {
        error:
          'No se pudo conectar con el servidor del taller. Revisa que la API en el VPS esté activa (puerto 80) y el firewall de Clouding.',
        detail: msg,
      },
      { status: 502 },
    );
  }
}

type Ctx = { params: { path: string[] } };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx.params.path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx.params.path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx.params.path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx.params.path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx.params.path);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
