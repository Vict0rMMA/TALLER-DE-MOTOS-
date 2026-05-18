import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const STAFF_PUBLIC_PATHS = ['/login', '/register'];
const PORTAL_PREFIX = '/portal';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/portal/login') {
    const url = new URL('/login', request.url);
    url.searchParams.set('tab', 'cliente');
    const from = request.nextUrl.searchParams.get('from');
    if (from) url.searchParams.set('from', from);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith(PORTAL_PREFIX)) {
    const portalToken = request.cookies.get('motobrain_portal_token')?.value;

    if (!portalToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('tab', 'cliente');
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  const token = request.cookies.get('motobrain_token')?.value;
  const isPublic = STAFF_PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublic && !request.nextUrl.searchParams.get('tab')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};
