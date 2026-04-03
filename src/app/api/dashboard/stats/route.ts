import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import {
  getInstallmentDueDatesIso,
  isYmdInCalendarMonth,
  appCalendarYearMonthFromInstant,
  APP_BUSINESS_TIMEZONE,
  isoInstantToAppCalendarYmd,
  type ClientInstallmentFields,
} from '@/lib/clientBillingReminder'

export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'range'

function getPeriodBounds(period: PeriodType, start?: string, end?: string) {
  const now = new Date()
  let from: Date
  let to: Date

  switch (period) {
    case 'day':
      from = startOfDay(now)
      to = endOfDay(now)
      break
    case 'week':
      from = startOfWeek(now, { weekStartsOn: 0 })
      to = endOfWeek(now, { weekStartsOn: 0 })
      break
    case 'month':
      from = startOfMonth(now)
      to = endOfMonth(now)
      break
    case 'year':
      from = new Date(now.getFullYear(), 0, 1)
      to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      break
    case 'range':
      from = start && end ? parseISO(start) : startOfMonth(now)
      to = start && end ? parseISO(end) : endOfMonth(now)
      break
    default:
      from = startOfMonth(now)
      to = endOfMonth(now)
  }
  return { from, to }
}

type ClientRow = {
  status?: string | null
  payment_type?: string | null
  recurring_amount?: number | null
  created_at?: string | null
  billing_due_day?: number | null
  billing_due_date?: string | null
  installment_count?: number | null
  down_payment?: number | null
}

/**
 * MMR e receita “neste mês” no fuso do app: só contam valores quando a data relevante já chegou (hoje ≥ vencimento ou ≥ dia do cadastro).
 * Recorrente: entrada só na receita do mês (não é MMR); parcela no MMR e na receita a partir do dia de vencimento no mês.
 */
function computeMmrAndReceitaForCurrentMonth(clients: ClientRow[]) {
  const now = new Date()
  const { year: refY, monthIndex: refM } = appCalendarYearMonthFromInstant(now)
  const todayYmd = formatInTimeZone(now, APP_BUSINESS_TIMEZONE, 'yyyy-MM-dd')

  /** Ativo e Lead entram na receita/MMR; Inativo e Arquivado ficam de fora. */
  const countsTowardRevenue = (c: ClientRow) => {
    const s = String(c.status ?? '').toLowerCase()
    return s === 'active' || s === 'lead'
  }

  let mmr = 0
  let receitaTotalMes = 0

  for (const c of clients) {
    if (!countsTowardRevenue(c)) continue
    const pt = c.payment_type === 'recorrente' ? 'recorrente' : 'pontual'

    if (pt === 'pontual') {
      const amount = Number(c.recurring_amount ?? 0)
      const dueRaw = c.billing_due_date ? String(c.billing_due_date).slice(0, 10) : ''
      const dueInMonth =
        dueRaw.length >= 10 && isYmdInCalendarMonth(dueRaw, refY, refM)
      const cadastroYmd = isoInstantToAppCalendarYmd(c.created_at ?? null)
      const createdInMonth =
        cadastroYmd != null && isYmdInCalendarMonth(cadastroYmd, refY, refM)
      if (dueRaw.length >= 10 && dueInMonth && dueRaw <= todayYmd) {
        receitaTotalMes += amount
      } else if (!dueRaw && createdInMonth && cadastroYmd != null && cadastroYmd <= todayYmd) {
        receitaTotalMes += amount
      }
      continue
    }

    const dates = getInstallmentDueDatesIso(c as ClientInstallmentFields)
    let parcelCounts = false
    for (const d of dates) {
      if (isYmdInCalendarMonth(d, refY, refM) && d <= todayYmd) {
        parcelCounts = true
        break
      }
    }
    if (parcelCounts) {
      const p = Number(c.recurring_amount ?? 0)
      mmr += p
      receitaTotalMes += p
    }

    const cadastroYmd = isoInstantToAppCalendarYmd(c.created_at ?? null)
    if (
      cadastroYmd &&
      isYmdInCalendarMonth(cadastroYmd, refY, refM) &&
      cadastroYmd <= todayYmd
    ) {
      const ent = Number(c.down_payment ?? 0)
      if (ent > 0) receitaTotalMes += ent
    }
  }

  return { mmr, receitaTotalMes }
}

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period = (searchParams.get('period') as PeriodType) || 'month'
  const start = searchParams.get('start') ?? undefined
  const end = searchParams.get('end') ?? undefined

  const { from, to } = getPeriodBounds(period, start, end)
  const fromStr = from.toISOString().slice(0, 10)
  const toStr = to.toISOString().slice(0, 10)

  const supabase = await createClient()

  const [clientsRes, contractsRes, transactionsRes, proposalsRes] = await Promise.all([
    supabase
      .from('clients')
      .select(
        'id, status, payment_type, recurring_amount, billing_due_day, billing_due_date, created_at, installment_count, down_payment'
      )
      .eq('user_id', userId),
    supabase.from('contracts').select('id, signatories').eq('user_id', userId),
    supabase
      .from('finance_transactions')
      .select('type, amount, date')
      .eq('user_id', userId)
      .gte('date', fromStr)
      .lte('date', toStr),
    supabase.from('proposals').select('id, status').eq('user_id', userId),
  ])

  const clients = (clientsRes.data ?? []) as ClientRow[]
  const contracts = contractsRes.data ?? []
  const transactions = transactionsRes.data ?? []
  const proposals = proposalsRes.data ?? []

  const totalClients = clients.length

  const { mmr, receitaTotalMes } = computeMmrAndReceitaForCurrentMonth(clients)

  const isContractFinalizado = (c: { signatories?: unknown[] }) => {
    const sigs = (c.signatories ?? []) as { signed?: boolean; selfie_url?: string | null }[]
    return (
      sigs.length > 0 &&
      sigs.every(
        (s) =>
          s.signed &&
          typeof s.selfie_url === 'string' &&
          s.selfie_url.trim().length > 0
      )
    )
  }
  const contractsFinalized = contracts.filter(isContractFinalizado).length

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)
  const financeBalance = income - expense

  const totalProposals = proposals.length

  return NextResponse.json({
    totalClients,
    mmr,
    receitaTotalMes,
    contractsFinalized,
    financeBalance,
    totalProposals,
    period,
    from: fromStr,
    to: toStr,
  })
}
