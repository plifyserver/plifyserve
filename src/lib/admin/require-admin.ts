import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type AdminSessionResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }

/**
 * Garante sessão válida e profile.account_type === 'admin'.
 * Usar em rotas /api/admin/* antes de operações sensíveis.
 */
export async function requireAdminSession(): Promise<AdminSessionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.account_type !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Sem permissão de administrador' }, { status: 403 }),
    }
  }

  return { ok: true, userId: user.id }
}

export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}
