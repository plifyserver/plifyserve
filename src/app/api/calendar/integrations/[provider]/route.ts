import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { userCanUseCalendarIntegrations } from '@/lib/calendar/calendarAccess'

const PROVIDERS = new Set(['google'])

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { provider } = await params
  if (!PROVIDERS.has(provider)) {
    return NextResponse.json({ error: 'Provedor inválido' }, { status: 400 })
  }

  const supabase = await createClient()
  if (!(await userCanUseCalendarIntegrations(supabase, userId))) {
    return NextResponse.json({ error: 'Recurso disponível no plano Pro' }, { status: 403 })
  }

  const { error } = await supabase
    .from('calendar_integrations')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
