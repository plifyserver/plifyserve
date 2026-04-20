import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasActivePaidAccess, type BillingGateProfile } from '@/lib/billing-access'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Landing e páginas legais estáticas (OAuth / bots): sem Supabase no edge.
  if (pathname === '/' || pathname === '/legal' || pathname.startsWith('/legal/')) {
    return NextResponse.next({ request })
  }

  const supabaseResponse = NextResponse.next({
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

  let user: { id: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = (data?.user as { id: string } | null) ?? null
  } catch {
    // Em dev/edge, falhas de rede/abort podem acontecer (ex.: refresh token inválido, fetch abortado).
    // Para não derrubar a navegação, tratamos como "não autenticado" e seguimos.
    user = null
  }

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/cadastro')
  const isAdminPage = pathname.startsWith('/admin')
  const isProtectedPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/proposta') ||
    pathname.startsWith('/propostas') ||
    pathname.startsWith('/templates') ||
    pathname.startsWith('/faturamento') ||
    pathname.startsWith('/minha-pagina') ||
    isAdminPage

  if (isAuthPage && user) {
    const redirectParam = request.nextUrl.searchParams.get('redirect')
    const url = request.nextUrl.clone()
    if (
      redirectParam &&
      redirectParam.startsWith('/') &&
      !redirectParam.startsWith('//') &&
      !redirectParam.includes('://')
    ) {
      const parsed = new URL(redirectParam, request.url)
      url.pathname = parsed.pathname
      url.search = parsed.search
    } else {
      url.pathname = '/dashboard'
      url.search = ''
    }
    return NextResponse.redirect(url)
  }

  if (isProtectedPage && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const back = `${pathname}${request.nextUrl.search}`
    url.searchParams.set('redirect', back)
    return NextResponse.redirect(url)
  }

  if (user && isProtectedPage) {
    type ProfileGate = BillingGateProfile & { banned?: boolean | null }
    let profile: ProfileGate | null = null
    try {
      const { data } = await supabase
        .from('profiles')
        .select('account_type, banned, subscription_id, plan_status, plan_expires_at')
        .eq('id', user.id)
        .single()
      profile = (data as ProfileGate | null) ?? null
    } catch {
      profile = null
    }

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

    const isCheckoutArea = pathname.startsWith('/checkout')
    const needsBilling = isProtectedPage && !isCheckoutArea
    if (needsBilling && !hasActivePaidAccess(profile)) {
      const url = request.nextUrl.clone()
      url.pathname = '/checkout'
      url.search = ''
      url.searchParams.set('payment_required', '1')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
