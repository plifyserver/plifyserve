import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/cadastro')
  const isAdminPage = pathname.startsWith('/admin')
  const isProtectedPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/propostas') ||
    pathname.startsWith('/templates') ||
    pathname.startsWith('/faturamento') ||
    pathname.startsWith('/minha-pagina') ||
    isAdminPage

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (isProtectedPage && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isProtectedPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type, banned')
      .eq('id', user.id)
      .single()

    if (profile?.banned) {
      const url = request.nextUrl.clone()
      url.pathname = '/conta-bloqueada'
      return NextResponse.redirect(url)
    }

    if (isAdminPage && profile?.account_type !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
