import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { getPublicBaseUrl } from '@/lib/publicBaseUrl'

export async function GET(request: NextRequest) {
  const base = getPublicBaseUrl(request) ?? ''
  const url = request.nextUrl
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const err = url.searchParams.get('error')

  if (err || !code || !state) {
    return NextResponse.redirect(`${base}/dashboard/agenda?calendar_error=google_denied`)
  }

  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${base}/dashboard/agenda?calendar_error=google_config`)
  }

  const supabase = await createClient()
  const { data: st, error: stErr } = await supabase
    .from('calendar_oauth_states')
    .select('user_id')
    .eq('state', state)
    .maybeSingle()

  if (stErr || !st || st.user_id !== userId) {
    return NextResponse.redirect(`${base}/dashboard/agenda?calendar_error=google_state`)
  }

  const redirectUri = `${base}/api/calendar/oauth/google/callback`
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    await supabase.from('calendar_oauth_states').delete().eq('state', state)
    return NextResponse.redirect(`${base}/dashboard/agenda?calendar_error=google_token`)
  }

  const tok = (await tokenRes.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
  }
  if (!tok.access_token || typeof tok.expires_in !== 'number') {
    await supabase.from('calendar_oauth_states').delete().eq('state', state)
    return NextResponse.redirect(`${base}/dashboard/agenda?calendar_error=google_token`)
  }

  let email: string | null = null
  try {
    const ui = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    })
    if (ui.ok) {
      const j = (await ui.json()) as { email?: string }
      email = j.email ?? null
    }
  } catch {
    /* ignore */
  }

  const expiresAt = new Date(Date.now() + tok.expires_in * 1000).toISOString()
  const { error: upErr } = await supabase.from('calendar_integrations').upsert(
    {
      user_id: userId,
      provider: 'google',
      access_token: tok.access_token,
      refresh_token: tok.refresh_token ?? null,
      expires_at: expiresAt,
      provider_account_email: email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' }
  )

  await supabase.from('calendar_oauth_states').delete().eq('state', state)

  if (upErr) {
    return NextResponse.redirect(`${base}/dashboard/agenda?calendar_error=google_save`)
  }

  return NextResponse.redirect(`${base}/dashboard/agenda?calendar_connected=google`)
}
