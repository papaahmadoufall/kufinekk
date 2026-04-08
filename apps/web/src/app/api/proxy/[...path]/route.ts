import { NextRequest, NextResponse } from 'next/server'
import { getToken } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://kufinekk-production.up.railway.app'

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const token = await getToken()

  if (!token) {
    return NextResponse.json({ error: { code: 'unauthorized', message: 'Session expirée' } }, { status: 401 })
  }

  const apiPath = path.join('/')
  const url = new URL(req.url)
  const queryString = url.search
  const upstreamUrl = `${API_URL}/api/v1/${apiPath}${queryString}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    // Réutiliser la connexion TCP vers Railway
    keepalive: true,
    // Les appels proxy sont des actions — pas de cache
    cache: 'no-store',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text()
  }

  const upstream = await fetch(upstreamUrl, init)
  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
