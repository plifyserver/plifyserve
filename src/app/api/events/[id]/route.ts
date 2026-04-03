import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { deleteEventFromConnectedCalendars } from '@/lib/calendar/pushEventToConnectedCalendars'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const { id } = await params
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('events')
    .select('google_event_id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  const { error } = await supabase.from('events').delete().eq('id', id).eq('user_id', userId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  void deleteEventFromConnectedCalendars(
    supabase,
    userId,
    (existing as { google_event_id?: string | null } | null)?.google_event_id
  )

  return NextResponse.json({ success: true })
}
