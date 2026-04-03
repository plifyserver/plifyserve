import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { buildIcsCalendar, type IcsEventInput } from '@/lib/calendar/icsFeed'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!token || token.length < 16 || token.length > 128) {
    return new NextResponse('Não encontrado', { status: 404 })
  }

  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch {
    return new NextResponse('Serviço indisponível', { status: 503 })
  }

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('calendar_ics_token', token)
    .maybeSingle()

  if (pErr || !profile?.id) {
    return new NextResponse('Não encontrado', { status: 404 })
  }

  const userId = profile.id as string
  const { data: events, error: eErr } = await supabase
    .from('events')
    .select('id, title, description, location, start_at, end_at, all_day')
    .eq('user_id', userId)
    .order('start_at', { ascending: true })

  if (eErr) {
    return new NextResponse('Erro ao carregar eventos', { status: 500 })
  }

  const body = buildIcsCalendar((events ?? []) as IcsEventInput[])

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'private, max-age=120',
    },
  })
}
