import { type NextRequest, NextResponse } from 'next/server'
import { isPalhaWeddingsHost } from '@/lib/hosts'
import { updateSession } from '@/lib/supabase/middleware'

const PALHA_PREFIX = '/palhaweddings'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPalhaWeddingsHost(request)) {
    const url = request.nextUrl.clone()
    if (!pathname.startsWith(PALHA_PREFIX)) {
      url.pathname = pathname === '/' ? PALHA_PREFIX : `${PALHA_PREFIX}${pathname}`
    }
    return NextResponse.rewrite(url)
  }

  if (pathname === PALHA_PREFIX || pathname.startsWith(`${PALHA_PREFIX}/`)) {
    return new NextResponse(null, { status: 404 })
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logopreto.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
