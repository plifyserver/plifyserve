import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { getPalhaSupabaseEnv, palhaAuthCookieOptions } from '@/lib/palha/supabase/env'

export async function POST(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()

  const user = await getPalhaUserFromRequest(request)
  if (!user?.email) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let password = ''
  try {
    const body = (await request.json()) as { password?: string }
    password = String(body.password ?? '')
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  if (!password) {
    return NextResponse.json({ error: 'Digite a senha do admin.' }, { status: 400 })
  }

  const { url, anonKey } = getPalhaSupabaseEnv()
  const response = NextResponse.json({ ok: true })
  const supabase = createServerClient(url, anonKey, {
    cookieOptions: palhaAuthCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({ email: user.email, password })
  if (error) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })
  }

  return response
}
