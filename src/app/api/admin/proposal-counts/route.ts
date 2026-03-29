import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireAdminSession, isUuid } from '@/lib/admin/require-admin'

/** Contagem de propostas por usuário (service role; RLS não expõe propostas alheias). */
export async function POST(request: NextRequest) {
  const admin = await requireAdminSession()
  if (!admin.ok) return admin.response

  let body: { ids?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const raw = Array.isArray(body.ids) ? body.ids : []
  const ids = raw.filter((id): id is string => typeof id === 'string' && isUuid(id)).slice(0, 100)
  if (ids.length === 0) {
    return NextResponse.json({ counts: {} as Record<string, number> })
  }

  const svc = createServiceRoleClient()
  const { data, error } = await svc.from('proposals').select('user_id').in('user_id', ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const counts: Record<string, number> = {}
  for (const row of data || []) {
    const uid = row.user_id as string
    if (uid) counts[uid] = (counts[uid] || 0) + 1
  }

  return NextResponse.json({ counts })
}
