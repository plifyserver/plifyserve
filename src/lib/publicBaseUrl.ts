import type { NextRequest } from 'next/server'

/** Base pública do site (OAuth redirect, links por e-mail). */
export function getPublicBaseUrl(request: NextRequest): string | null {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (env) return env
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  const origin = request.headers.get('origin')
  if (origin?.startsWith('http')) return origin.replace(/\/$/, '')
  const host = request.headers.get('host')
  if (host) {
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    return `${proto}://${host}`.replace(/\/$/, '')
  }
  return null
}
