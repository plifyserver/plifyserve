import { addDays } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

const APP_TZ = 'America/Sao_Paulo'

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

function formatIcsUtc(dt: Date): string {
  return formatInTimeZone(dt, 'UTC', "yyyyMMdd'T'HHmmss'Z'")
}

function formatIcsDateOnlyInTz(dt: Date): string {
  return formatInTimeZone(dt, APP_TZ, 'yyyyMMdd')
}

export type IcsEventInput = {
  id: string
  title: string
  description?: string | null
  location?: string | null
  start_at: string
  end_at: string
  all_day?: boolean | null
}

export function buildIcsCalendar(events: IcsEventInput[], calName = 'Plify Agenda'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Plify//Agenda//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
  ]

  const now = new Date()
  const stamp = formatIcsUtc(now)

  for (const e of events) {
    const start = new Date(e.start_at)
    const end = new Date(e.end_at)
    const uid = `${e.id}@plify-agenda`
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${stamp}`)
    if (e.all_day) {
      const d0 = formatIcsDateOnlyInTz(start)
      const endIncYmd = formatInTimeZone(end, APP_TZ, 'yyyy-MM-dd')
      const [y, m, d] = endIncYmd.split('-').map(Number)
      const d1 = formatInTimeZone(addDays(new Date(y, m - 1, d), 1), APP_TZ, 'yyyyMMdd')
      lines.push(`DTSTART;VALUE=DATE:${d0}`)
      lines.push(`DTEND;VALUE=DATE:${d1}`)
    } else {
      lines.push(`DTSTART:${formatIcsUtc(start)}`)
      lines.push(`DTEND:${formatIcsUtc(end)}`)
    }
    lines.push(`SUMMARY:${escapeIcsText(e.title || 'Evento')}`)
    if (e.description?.trim()) lines.push(`DESCRIPTION:${escapeIcsText(e.description.trim())}`)
    if (e.location?.trim()) lines.push(`LOCATION:${escapeIcsText(e.location.trim())}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
