import { format, startOfDay, isBefore, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

export type ClientBillingFields = {
  payment_type?: string | null
  billing_due_day?: number | null
  billing_due_date?: string | null
}

export type ClientInstallmentFields = ClientBillingFields & {
  installment_count?: number | null
  created_at?: string | null
}

/** Fuso usado em receita/MMR do dashboard e datas de cadastro/vencimento (evita divergência com UTC do servidor). */
export const APP_BUSINESS_TIMEZONE = 'America/Sao_Paulo'

function clampDayToMonth(year: number, monthIndex: number, desiredDay: number): number {
  const last = new Date(year, monthIndex + 1, 0).getDate()
  return Math.min(desiredDay, last)
}

/** Próxima data de vencimento a partir do dia do mês (ex.: todo dia 10), em calendário local. */
export function nextBillingDateFromDayOfMonth(dayOfMonth: number, from: Date = new Date()): Date {
  const d0 = startOfDay(from)
  const y = d0.getFullYear()
  const m = d0.getMonth()
  const day = clampDayToMonth(y, m, dayOfMonth)
  let candidate = startOfDay(new Date(y, m, day))
  if (isBefore(candidate, d0)) {
    let nm = m + 1
    let ny = y
    if (nm > 11) {
      nm = 0
      ny += 1
    }
    const day2 = clampDayToMonth(ny, nm, dayOfMonth)
    candidate = startOfDay(new Date(ny, nm, day2))
  }
  return candidate
}

function parseBillingDay(d: unknown): number | null {
  if (d == null || d === '') return null
  const n = typeof d === 'string' ? parseInt(d, 10) : Number(d)
  if (!Number.isInteger(n) || n < 1 || n > 31) return null
  return n
}

/** Sem valor = assinatura mensal contínua (teto de 360 meses nos cálculos de dashboard / lembretes). */
const ONGOING_INSTALLMENT_MONTHS = 360

function parseInstallmentCount(raw: unknown): number {
  if (raw == null || raw === '') return ONGOING_INSTALLMENT_MONTHS
  const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw)
  if (!Number.isInteger(n) || n < 1) return ONGOING_INSTALLMENT_MONTHS
  return Math.min(n, ONGOING_INSTALLMENT_MONTHS)
}

/** yyyy-MM-dd do instante no fuso do app (ex.: cadastro no Supabase em UTC). */
export function isoInstantToAppCalendarYmd(iso: string | null | undefined): string | null {
  if (!iso || typeof iso !== 'string') return null
  const d = parseISO(iso)
  if (Number.isNaN(d.getTime())) return null
  return formatInTimeZone(d, APP_BUSINESS_TIMEZONE, 'yyyy-MM-dd')
}

/** @deprecated use isoInstantToAppCalendarYmd */
export const utcIsoToLocalCalendarYmd = isoInstantToAppCalendarYmd

/** Ano e mês civil no fuso do app (alinhado ao dashboard). */
export function appCalendarYearMonthFromInstant(now: Date = new Date()): { year: number; monthIndex: number } {
  const ymd = formatInTimeZone(now, APP_BUSINESS_TIMEZONE, 'yyyy-MM-dd')
  const [y, m] = ymd.split('-').map(Number)
  return { year: y, monthIndex: m - 1 }
}

/** Último dia do mês (m1 = 1–12). */
function daysInCalendarMonth(y: number, m1: number): number {
  return new Date(y, m1, 0).getDate()
}

/** Primeiro vencimento no dia `dom` (1–31), ≥ cadastroYmd; avança mês a mês se preciso. */
function firstInstallmentYmdOnOrAfterCadastro(cadastroYmd: string, dom: number): string {
  const [cy, cm] = cadastroYmd.split('-').map(Number)
  let y = cy
  let m1 = cm
  for (let guard = 0; guard < 48; guard++) {
    const last = daysInCalendarMonth(y, m1)
    const d = Math.min(dom, last)
    const ymd = `${y}-${String(m1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (ymd >= cadastroYmd) return ymd
    if (m1 === 12) {
      y += 1
      m1 = 1
    } else {
      m1 += 1
    }
  }
  const last = daysInCalendarMonth(y, m1)
  const d = Math.min(dom, last)
  return `${y}-${String(m1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Soma meses mantendo o dia (com clamp ao fim do mês). */
function addMonthsToYmd(ymd: string, deltaMonths: number): string {
  const [y0, m1, d0] = ymd.split('-').map(Number)
  let y = y0
  let m = m1 + deltaMonths
  while (m > 12) {
    m -= 12
    y += 1
  }
  while (m < 1) {
    m += 12
    y -= 1
  }
  const last = daysInCalendarMonth(y, m)
  const d = Math.min(d0, last)
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * Datas de vencimento de cada parcela (yyyy-MM-dd), na ordem.
 * Recorrente: 1.ª parcela = primeiro dia de vencimento em ou após o cadastro (fuso app); demais = +1 mês cada.
 */
export function getInstallmentDueDatesIso(client: ClientInstallmentFields): string[] {
  if (client.payment_type !== 'recorrente') return []
  const createdYmd = isoInstantToAppCalendarYmd(client.created_at ?? null)
  if (!createdYmd) return []

  const n = parseInstallmentCount(client.installment_count)
  const dayNum = parseBillingDay(client.billing_due_day)

  if (dayNum != null) {
    const first = firstInstallmentYmdOnOrAfterCadastro(createdYmd, dayNum)
    const out: string[] = []
    for (let i = 0; i < n; i++) {
      out.push(i === 0 ? first : addMonthsToYmd(first, i))
    }
    return out
  }

  if (client.billing_due_date && String(client.billing_due_date).trim() !== '') {
    const fixed = String(client.billing_due_date).slice(0, 10)
    const d0 = fixed >= createdYmd ? fixed : createdYmd
    return [d0]
  }

  return []
}

/** Próxima parcela ainda não vencida (>= hoje), ou null. */
export function getNextInstallmentDueIso(client: ClientInstallmentFields, today: Date = new Date()): string | null {
  const dates = getInstallmentDueDatesIso(client)
  if (!dates.length) return null
  const todayStr = formatInTimeZone(today, APP_BUSINESS_TIMEZONE, 'yyyy-MM-dd')
  return dates.find((d) => d >= todayStr) ?? null
}

/**
 * Pontual: próxima data em billing_due_date (legado).
 * Recorrente: usar getNextInstallmentDueIso.
 */
export function getNextBillingDueDateIso(client: ClientBillingFields, today: Date = new Date()): string | null {
  const pt = client.payment_type === 'recorrente' ? 'recorrente' : 'pontual'
  if (pt === 'recorrente') {
    return getNextInstallmentDueIso(client as ClientInstallmentFields, today)
  }
  if (client.billing_due_date && String(client.billing_due_date).trim() !== '') {
    return String(client.billing_due_date).slice(0, 10)
  }
  return null
}

export function shouldShowClientBillingReminder(
  billingDueDate: string | null | undefined,
  _recurringEndDate: string | null | undefined,
  today: Date = new Date()
): boolean {
  if (!billingDueDate || String(billingDueDate).trim() === '') return false
  const due = String(billingDueDate).slice(0, 10)
  const todayStr = formatInTimeZone(today, APP_BUSINESS_TIMEZONE, 'yyyy-MM-dd')
  if (due < todayStr) return false
  const days = Math.round(
    (new Date(due + 'T12:00:00').getTime() - new Date(todayStr + 'T12:00:00').getTime()) / (24 * 60 * 60 * 1000)
  )
  return days >= 0 && days <= 1
}

export function shouldShowClientBillingReminderFromClient(
  client: ClientBillingFields & Partial<ClientInstallmentFields>,
  today: Date = new Date()
): boolean {
  const due = getNextBillingDueDateIso(client, today)
  if (!due) return false
  return shouldShowClientBillingReminder(due, null, today)
}

/** Verifica se ymd (yyyy-MM-dd) cai no mês civil (monthIndex 0–11). */
export function isYmdInCalendarMonth(ymd: string, year: number, monthIndex: number): boolean {
  const [y, m] = ymd.split('-').map(Number)
  return y === year && m - 1 === monthIndex
}

/** Cadastro neste mês civil (fuso do app)? Usado para entrada na receita/MMR. */
export function isCreatedInCalendarMonth(createdIso: string | null | undefined, year: number, monthIndex: number): boolean {
  const d = isoInstantToAppCalendarYmd(createdIso ?? null)
  if (!d) return false
  return isYmdInCalendarMonth(d, year, monthIndex)
}
