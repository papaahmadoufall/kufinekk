import { NextResponse } from 'next/server'

export async function POST() {
  // 303 See Other : force le navigateur à GET /login après un POST
  const res = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'),
    303,
  )
  res.cookies.delete('kfn_token')
  return res
}
