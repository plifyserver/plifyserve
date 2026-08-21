import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isPalhaWeddingsHost } from '@/lib/hosts'
import { getPalhaSupabaseEnv, palhaAuthCookieOptions } from './env'

function palhaAdminPaths(request: NextRequest) {
  const onPalhaHost = isPalhaWeddingsHost(request)
  return {
    login: onPalhaHost ? '/admin' : '/palhaweddings/admin',
    painel: onPalhaHost ? '/admin/painel' : '/palhaweddings/admin/painel',
  }
}

function isPalhaAdminPath(pathname: string) {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/palhaweddings/admin' ||
    pathname.startsWith('/palhaweddings/admin/')
  )
}

function isPalhaLoginPath(pathname: string) {
  return pathname === '/admin' || pathname === '/palhaweddings/admin'
}

export async function updatePalhaSession(request: NextRequest, rewriteTo?: URL) {
  const response = rewriteTo ? NextResponse.rewrite(rewriteTo) : NextResponse.next({ request })
  const internalPath = rewriteTo?.pathname ?? request.nextUrl.pathname
  if (!isPalhaAdminPath(internalPath)) return response

  const { url, anonKey } = getPalhaSupabaseEnv()
  const supabase = createServerClient(url, anonKey, {
    cookieOptions: palhaAuthCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  let user: { id: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    user = null
  }

  const paths = palhaAdminPaths(request)

  if (isPalhaLoginPath(internalPath) && user) {
    const dest = request.nextUrl.clone()
    dest.pathname = paths.painel
    dest.search = ''
    return NextResponse.redirect(dest)
  }

  if (!isPalhaLoginPath(internalPath) && !user) {
    const dest = request.nextUrl.clone()
    dest.pathname = paths.login
    dest.search = ''
    dest.searchParams.set('redirect', paths.painel)
    return NextResponse.redirect(dest)
  }

  return response
}
