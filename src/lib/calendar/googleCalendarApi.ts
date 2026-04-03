import { addDays } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

const APP_TZ = 'America/Sao_Paulo'

type PlifyEvent = {
  id: string
  title: string
  description?: string | null
  location?: string | null
  start_at: string
  end_at: string
  all_day?: boolean | null
}

function toGoogleBody(e: PlifyEvent): Record<string, unknown> {
  const start = new Date(e.start_at)
  const end = new Date(e.end_at)
  if (e.all_day) {
    const startDate = formatInTimeZone(start, APP_TZ, 'yyyy-MM-dd')
    const endInclusive = formatInTimeZone(end, APP_TZ, 'yyyy-MM-dd')
    const [y, m, d] = endInclusive.split('-').map(Number)
    const endExclusive = formatInTimeZone(addDays(new Date(y, m - 1, d), 1), APP_TZ, 'yyyy-MM-dd')
    return {
      summary: e.title,
      description: e.description || undefined,
      location: e.location || undefined,
      start: { date: startDate },
      end: { date: endExclusive },
    }
  }
  return {
    summary: e.title,
    description: e.description || undefined,
    location: e.location || undefined,
    start: { dateTime: start.toISOString(), timeZone: APP_TZ },
    end: { dateTime: end.toISOString(), timeZone: APP_TZ },
  }
}

export async function googleRefreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
} | null> {
  const id = process.env.GOOGLE_CLIENT_ID
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!id || !secret) return null
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) return null
  const j = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!j.access_token || typeof j.expires_in !== 'number') return null
  return { access_token: j.access_token, expires_in: j.expires_in }
}

export async function googleCreateEvent(accessToken: string, e: PlifyEvent): Promise<string | null> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(toGoogleBody(e)),
  })
  if (!res.ok) return null
  const j = (await res.json()) as { id?: string }
  return j.id ?? null
}

export async function googleDeleteEvent(accessToken: string, googleEventId: string): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
  )
  return res.ok || res.status === 404 || res.status === 410
}
