import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { DELETE_ACCOUNT_CONFIRMATION_PHRASE } from '@/lib/accountDelete'

type Body = { confirmPhrase?: string }

/** O próprio usuário encerra a conta (auth + dados em cascade conforme o projeto). */
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const phrase = typeof body.confirmPhrase === 'string' ? body.confirmPhrase.trim() : ''
  if (phrase !== DELETE_ACCOUNT_CONFIRMATION_PHRASE) {
    return NextResponse.json(
      { error: `Digite exatamente: ${DELETE_ACCOUNT_CONFIRMATION_PHRASE}` },
      { status: 400 }
    )
  }

  const svc = createServiceRoleClient()

  const { data: target, error: targetErr } = await svc
    .from('profiles')
    .select('account_type')
    .eq('id', userId)
    .maybeSingle()

  if (targetErr || !target) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  if (target.account_type === 'admin') {
    const { count: adminCount, error: countErr } = await svc
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_type', 'admin')

    if (countErr) {
      return NextResponse.json({ error: 'Falha ao verificar administradores' }, { status: 500 })
    }
    if ((adminCount ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Não é possível excluir o único administrador do sistema.' },
        { status: 400 }
      )
    }
  }

  const { error: delErr } = await svc.auth.admin.deleteUser(userId)
  if (delErr) {
    return NextResponse.json({ error: delErr.message || 'Falha ao excluir conta' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
