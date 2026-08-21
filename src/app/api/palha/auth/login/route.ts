import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isLocalDevHost, isPalhaWeddingsHost } from '@/lib/hosts'
import { getPalhaSupabaseEnv, palhaAuthCookieOptions } from '@/lib/palha/supabase/env'

function palhaApiAllowed(request: NextRequest) {
  return isPalhaWeddingsHost(request) || isLocalDevHost(request)
}

export async function POST(request: NextRequest) {
  if (!palhaApiAllowed(request)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let email = ''
  let password = ''
  try {
    const body = (await request.json()) as { email?: string; password?: string }
    email = String(body.email ?? '').trim().toLowerCase()
    password = String(body.password ?? '')
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Preencha o e-mail e a senha.' }, { status: 400 })
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

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const message =
      error.message === 'Invalid login credentials' ? 'Email ou senha inválidos' : error.message
    return NextResponse.json({ error: message }, { status: 401 })
  }

  return response
}
