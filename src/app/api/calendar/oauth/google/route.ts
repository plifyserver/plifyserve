import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { getPublicBaseUrl } from '@/lib/publicBaseUrl'
import { userCanUseCalendarIntegrations } from '@/lib/calendar/calendarAccess'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    const base = getPublicBaseUrl(request) ?? ''
    return NextResponse.redirect(`${base}/dashboard/agenda?calendar_error=google_config`)
  }

  const supabase = await createClient()
  if (!(await userCanUseCalendarIntegrations(supabase, userId))) {
    const base = getPublicBaseUrl(request) ?? ''
    return NextResponse.redirect(`${base}/dashboard/agenda?calendar_error=pro_required`)
  }

  const base = getPublicBaseUrl(request)
  if (!base) {
    return NextResponse.json({ error: 'Defina NEXT_PUBLIC_APP_URL para usar OAuth.' }, { status: 500 })
  }

  const redirectUri = `${base}/api/calendar/oauth/google/callback`
  const state = randomBytes(24).toString('hex')

  await supabase.from('calendar_oauth_states').delete().eq('user_id', userId).eq('provider', 'google')
  const { error } = await supabase.from('calendar_oauth_states').insert({
    state,
    user_id: userId,
    provider: 'google',
  })
  if (error) {
    return NextResponse.redirect(`${base}/dashboard/agenda?calendar_error=google_state`)
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
