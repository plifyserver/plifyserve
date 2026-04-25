import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { getPaymentsEnabled } from '@/lib/cms/paymentsEnabled'
import { isUuid } from '@/lib/admin/require-admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, ctx: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await ctx.params
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const supabase = await createClient()
  if (!(await getPaymentsEnabled(supabase))) {
    return NextResponse.json({ error: 'Pagamentos não estão ativos.' }, { status: 403 })
  }

  const { error } = await supabase.from('user_pix_charges').delete().eq('id', id).eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
