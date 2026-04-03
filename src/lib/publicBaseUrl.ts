import type { NextRequest } from 'next/server'

function hostnameFromHostHeader(hostHeader: string): string {
  return hostHeader.split(':')[0].toLowerCase()
}

function isVercelDeploymentHost(hostname: string): boolean {
  return hostname.endsWith('.vercel.app')
}

/**
 * Base pública do site (OAuth, links por e-mail, feed ICS).
 *
 * Não usa `*.vercel.app` como fallback: em produção isso costuma abrir o ecrã de login
 * da Vercel (Deployment Protection) para quem recebe o link por e-mail.
 *
 * 1) `NEXT_PUBLIC_APP_URL` — definir na Vercel (ex.: https://www.seudominio.com.br)
 * 2) Host do pedido — quando o utilizador acede pelo domínio próprio (recomendado)
 * 3) Em desenvolvimento, `VERCEL_URL` só fora de `production`
 */
export function getPublicBaseUrl(request: NextRequest): string | null {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (envUrl) return envUrl

  const forwarded = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const hostHeader = forwarded || request.headers.get('host')?.trim()
  if (hostHeader) {
    const hostname = hostnameFromHostHeader(hostHeader)
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
    if (!isVercelDeploymentHost(hostname)) {
      const proto =
        request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
        (isLocal ? 'http' : 'https')
      const scheme = proto === 'http' || proto === 'https' ? proto : 'https'
      return `${scheme}://${hostHeader}`.replace(/\/$/, '')
    }
  }

  const origin = request.headers.get('origin')
  if (origin?.startsWith('http')) {
    try {
      const { hostname } = new URL(origin)
      if (!isVercelDeploymentHost(hostname)) {
        return origin.replace(/\/$/, '')
      }
    } catch {
      /* ignore */
    }
  }

  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  }

  return null
}
