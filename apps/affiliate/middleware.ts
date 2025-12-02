import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/verify-email'];
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/links',
  '/catalog',
  '/notifications',
  '/payouts',
  '/reports',
  '/support',
  '/settings'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('access_token')?.value ?? null;

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // 1. If user has NO token and tries to access a protected route → redirect to login
  if (!accessToken && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // 2. If user DOES have a token and is on login/register → DO NOT redirect automatically
  // Only allow them to access the login page (so logout works)
  if (accessToken && isAuthRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)']
};
