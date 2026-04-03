import type { SupabaseClient } from '@supabase/supabase-js'
import { googleCreateEvent, googleDeleteEvent, googleRefreshAccessToken } from '@/lib/calendar/googleCalendarApi'

export type EventRowForSync = {
  id: string
  user_id: string
  title: string
  description?: string | null
  location?: string | null
  start_at: string
  end_at: string
  all_day?: boolean | null
  google_event_id?: string | null
}

type IntegrationRow = {
  id: string
  provider: string
  access_token: string
  refresh_token: string | null
  expires_at: string | null
}

async function ensureFreshGoogleToken(
  supabase: SupabaseClient,
  row: IntegrationRow
): Promise<string | null> {
  if (row.provider !== 'google') return null
  const exp = row.expires_at ? new Date(row.expires_at).getTime() : 0
  const needsRefresh = !exp || exp < Date.now() + 120_000
  if (!needsRefresh) return row.access_token
  if (!row.refresh_token) return row.access_token

  const refreshed = await googleRefreshAccessToken(row.refresh_token)
  if (!refreshed) return row.access_token

  const newExp = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
  await supabase
    .from('calendar_integrations')
    .update({
      access_token: refreshed.access_token,
      expires_at: newExp,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)

  return refreshed.access_token
}

/** Após criar evento no Plify: cria cópia no Google Calendar se conectado. Falhas são ignoradas. */
export async function pushNewEventToConnectedCalendars(
  supabase: SupabaseClient,
  event: EventRowForSync
): Promise<void> {
  const { data: rows } = await supabase
    .from('calendar_integrations')
    .select('id, provider, access_token, refresh_token, expires_at')
    .eq('user_id', event.user_id)
    .eq('provider', 'google')

  const list = (rows ?? []) as IntegrationRow[]
  let googleId: string | null = event.google_event_id ?? null

  for (const row of list) {
    const token = await ensureFreshGoogleToken(supabase, row)
    if (!token) continue
    if (!googleId) {
      const gid = await googleCreateEvent(token, event)
      if (gid) googleId = gid
    }
  }

  if (googleId !== (event.google_event_id ?? null)) {
    await supabase
      .from('events')
      .update({
        google_event_id: googleId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', event.id)
      .eq('user_id', event.user_id)
  }
}

export async function deleteEventFromConnectedCalendars(
  supabase: SupabaseClient,
  userId: string,
  googleEventId: string | null | undefined
): Promise<void> {
  const { data: rows } = await supabase
    .from('calendar_integrations')
    .select('id, provider, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')

  const list = (rows ?? []) as IntegrationRow[]

  for (const row of list) {
    const token = await ensureFreshGoogleToken(supabase, row)
    if (!token || !googleEventId) continue
    await googleDeleteEvent(token, googleEventId)
  }
}
