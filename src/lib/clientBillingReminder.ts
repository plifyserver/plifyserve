import { format, startOfDay, isBefore, parseISO, addMonths } from 'date-fns'

export type ClientBillingFields = {
  payment_type?: string | null
  billing_due_day?: number | null
  billing_due_date?: string | null
}

export type ClientInstallmentFields = ClientBillingFields & {
  installment_count?: number | null
  created_at?: string | null
}

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

/**
 * Datas de vencimento de cada parcela (yyyy-MM-dd), na ordem.
 * Recorrente: 1.ª parcela = próximo dia de vencimento em ou após o cadastro; demais = +1 mês cada.
 */
export function getInstallmentDueDatesIso(client: ClientInstallmentFields): string[] {
  if (client.payment_type !== 'recorrente') return []
  const created = client.created_at?.slice(0, 10)
  if (!created) return []

  const n = parseInstallmentCount(client.installment_count)
  const dayNum = parseBillingDay(client.billing_due_day)

  if (dayNum != null) {
    const from = parseISO(`${created}T12:00:00`)
    const first = nextBillingDateFromDayOfMonth(dayNum, from)
    const out: string[] = []
    for (let i = 0; i < n; i++) {
      out.push(format(addMonths(first, i), 'yyyy-MM-dd'))
    }
    return out
  }

  if (client.billing_due_date && String(client.billing_due_date).trim() !== '') {
    const fixed = String(client.billing_due_date).slice(0, 10)
    const d0 = fixed >= created ? fixed : created
    return [d0]
  }

  return []
}

/** Próxima parcela ainda não vencida (>= hoje), ou null. */
export function getNextInstallmentDueIso(client: ClientInstallmentFields, today: Date = new Date()): string | null {
  const dates = getInstallmentDueDatesIso(client)
  if (!dates.length) return null
  const todayStr = format(startOfDay(today), 'yyyy-MM-dd')
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
  const todayStr = format(startOfDay(today), 'yyyy-MM-dd')
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

/** created_at ISO: cadastro neste mês civil? */
export function isCreatedInCalendarMonth(createdIso: string | null | undefined, year: number, monthIndex: number): boolean {
  if (!createdIso) return false
  const d = String(createdIso).slice(0, 10)
  return isYmdInCalendarMonth(d, year, monthIndex)
}
