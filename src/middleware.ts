import { type NextRequest, NextResponse } from 'next/server'
import { isLocalDevHost, isPalhaWeddingsHost } from '@/lib/hosts'
import { updatePalhaSession } from '@/lib/palha/supabase/middleware'
import { updateSession } from '@/lib/supabase/middleware'

const PALHA_PREFIX = '/palhaweddings'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPalhaWeddingsHost(request)) {
    const url = request.nextUrl.clone()
    if (!pathname.startsWith(PALHA_PREFIX)) {
      url.pathname = pathname === '/' ? PALHA_PREFIX : `${PALHA_PREFIX}${pathname}`
    }
    return updatePalhaSession(request, url)
  }

  if (pathname === PALHA_PREFIX || pathname.startsWith(`${PALHA_PREFIX}/`)) {
    if (isLocalDevHost(request)) {
      return updatePalhaSession(request)
    }
    return new NextResponse(null, { status: 404 })
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logopreto.ico|api|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
