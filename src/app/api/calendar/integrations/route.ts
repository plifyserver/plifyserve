import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { getPublicBaseUrl } from '@/lib/publicBaseUrl'
import { userCanUseCalendarIntegrations } from '@/lib/calendar/calendarAccess'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = await createClient()
  const allowed = await userCanUseCalendarIntegrations(supabase, userId)
  if (!allowed) {
    return NextResponse.json({
      allowed: false,
      google: false,
      icsUrl: null,
      webcalUrl: null,
    })
  }

  const base = getPublicBaseUrl(request)

  const [{ data: profile }, { data: integrations }] = await Promise.all([
    supabase.from('profiles').select('calendar_ics_token').eq('id', userId).maybeSingle(),
    supabase.from('calendar_integrations').select('provider, provider_account_email').eq('user_id', userId),
  ])

  let token = profile?.calendar_ics_token as string | null | undefined
  if (!token) {
    token = randomBytes(24).toString('hex')
    await supabase
      .from('profiles')
      .update({ calendar_ics_token: token, updated_at: new Date().toISOString() })
      .eq('id', userId)
  }

  const rows = integrations ?? []
  const icsPath = token && base ? `${base}/api/calendar/ics/${token}` : null

  return NextResponse.json({
    allowed: true,
    google: rows.some((r: { provider: string }) => r.provider === 'google'),
    googleEmail: rows.find((r: { provider: string }) => r.provider === 'google')?.provider_account_email ?? null,
    icsUrl: icsPath,
    webcalUrl: icsPath ? icsPath.replace(/^https:/i, 'webcal:').replace(/^http:/i, 'webcal:') : null,
  })
}

/** POST { "regenerateIcs": true } — invalida o link anterior (calendários externos deixam de atualizar até reconfigurar). */
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = await createClient()
  if (!(await userCanUseCalendarIntegrations(supabase, userId))) {
    return NextResponse.json({ error: 'Recurso disponível no plano Pro' }, { status: 403 })
  }

  let body: { regenerateIcs?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!body.regenerateIcs) {
    return NextResponse.json({ error: 'Use { "regenerateIcs": true }' }, { status: 400 })
  }

  const token = randomBytes(24).toString('hex')
  const { error } = await supabase
    .from('profiles')
    .update({ calendar_ics_token: token, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const base = getPublicBaseUrl(request)
  const icsPath = base ? `${base}/api/calendar/ics/${token}` : null

  return NextResponse.json({
    icsUrl: icsPath,
    webcalUrl: icsPath ? icsPath.replace(/^https:/i, 'webcal:').replace(/^http:/i, 'webcal:') : null,
  })
}
