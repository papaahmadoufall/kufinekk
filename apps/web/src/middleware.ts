import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes accessibles sans token : landing + login + onboarding (et leurs sous-chemins)
const PUBLIC_PREFIXES = ['/login', '/onboarding']
const PUBLIC_EXACT = ['/']

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get('kfn_token')?.value
  const { pathname } = req.nextUrl

  if (!token && !isPublic(pathname)) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api).*)'],
}
