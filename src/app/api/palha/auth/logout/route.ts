import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { isPalhaWeddingsHost } from '@/lib/hosts'
import { getPalhaSupabaseEnv, palhaAuthCookieOptions, PALHA_AUTH_COOKIE } from '@/lib/palha/supabase/env'

function loginPath(request: NextRequest) {
  return isPalhaWeddingsHost(request) ? '/admin' : '/palhaweddings/admin'
}

function clearPalhaAuthCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name === PALHA_AUTH_COOKIE || cookie.name.startsWith(`${PALHA_AUTH_COOKIE}.`)) {
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
      })
    }
  }
}

export async function GET(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()

  const { url, anonKey } = getPalhaSupabaseEnv()
  const response = NextResponse.redirect(new URL(loginPath(request), request.url), 302)
  const supabase = createServerClient(url, anonKey, {
    cookieOptions: palhaAuthCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })
  await supabase.auth.signOut()
  clearPalhaAuthCookies(request, response)
  return response
}
