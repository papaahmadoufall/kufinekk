'use server'

import { cookies } from 'next/headers'

const COOKIE = 'kfn_token'

export async function getToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(COOKIE)?.value
}

export async function setToken(token: string) {
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: '/',
  })
}

export async function clearToken() {
  const store = await cookies()
  store.delete(COOKIE)
}
