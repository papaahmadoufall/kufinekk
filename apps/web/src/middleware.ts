import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC = ['/login']

export function middleware(req: NextRequest) {
  const token = req.cookies.get('kfn_token')?.value
  const { pathname } = req.nextUrl

  if (!token && !PUBLIC.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api).*)'],
}
