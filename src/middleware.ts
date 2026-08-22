import { type NextRequest, NextResponse } from 'next/server'
import { isLocalDevHost, isPalhaWeddingsHost } from '@/lib/hosts'
import { applyContentSecurityPolicy, createCspNonce } from '@/lib/securityHeaders'
import { updatePalhaSession } from '@/lib/palha/supabase/middleware'
import { updateSession } from '@/lib/supabase/middleware'

const PALHA_PREFIX = '/palhaweddings'

export async function middleware(request: NextRequest) {
  const nonce = createCspNonce()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const { pathname } = request.nextUrl
  let response: NextResponse

  if (isPalhaWeddingsHost(request)) {
    const url = request.nextUrl.clone()
    if (!pathname.startsWith(PALHA_PREFIX)) {
      url.pathname = pathname === '/' ? PALHA_PREFIX : `${PALHA_PREFIX}${pathname}`
    }
    response = await updatePalhaSession(request, url, requestHeaders)
  } else if (pathname === PALHA_PREFIX || pathname.startsWith(`${PALHA_PREFIX}/`)) {
    if (isLocalDevHost(request)) {
      response = await updatePalhaSession(request, undefined, requestHeaders)
    } else {
      response = new NextResponse(null, { status: 404 })
    }
  } else {
    response = await updateSession(request, requestHeaders)
  }

  applyContentSecurityPolicy(response, nonce)
  return response
}

export const config = {
  matcher: [
    {
      source:
        '/((?!_next/static|_next/image|favicon.ico|logopreto.ico|api|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
