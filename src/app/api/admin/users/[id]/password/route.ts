import { NextResponse, type NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireAdminSession, isUuid } from '@/lib/admin/require-admin'

type RouteContext = { params: Promise<{ id: string }> }

const MIN_LEN = 8

export async function POST(request: NextRequest, context: RouteContext) {
  const admin = await requireAdminSession()
  if (!admin.ok) return admin.response

  const { id } = await context.params
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  let body: { password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const password = typeof body.password === 'string' ? body.password : ''
  if (password.length < MIN_LEN) {
    return NextResponse.json(
      { error: `A senha deve ter pelo menos ${MIN_LEN} caracteres` },
      { status: 400 }
    )
  }

  const svc = createServiceRoleClient()
  const { data: target, error: loadErr } = await svc.from('profiles').select('id').eq('id', id).maybeSingle()
  if (loadErr || !target) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const { error } = await svc.auth.admin.updateUserById(id, { password })
  if (error) {
    return NextResponse.json({ error: error.message || 'Falha ao atualizar senha' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
