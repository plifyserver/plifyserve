import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, parseISO } from 'date-fns'

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
    supabase.from('clients').select('id, status, payment_type, recurring_amount, recurring_end_date').eq('user_id', userId),
    supabase.from('contracts').select('id, signatories').eq('user_id', userId),
    supabase
      .from('finance_transactions')
      .select('type, amount, date')
      .eq('user_id', userId)
      .gte('date', fromStr)
      .lte('date', toStr),
    supabase.from('proposals').select('id, status').eq('user_id', userId),
  ])

  const clients = clientsRes.data ?? []
  const contracts = contractsRes.data ?? []
  const transactions = transactionsRes.data ?? []
  const proposals = proposalsRes.data ?? []

  const totalClients = clients.length
  const todayStr = new Date().toISOString().slice(0, 10)

  const activeForMmr = (c: { status?: string | null }) => (c.status ?? '') === 'active'

  const mmrRecorrente = clients
    .filter(activeForMmr)
    .filter((c) => (c as { payment_type?: string }).payment_type === 'recorrente')
    .filter((c) => {
      const end = (c as { recurring_end_date?: string | null }).recurring_end_date
      return end == null || end === '' || end >= todayStr
    })
    .reduce((s, c) => s + Number((c as { recurring_amount?: number | null }).recurring_amount ?? 0), 0)

  const mmrPontual = clients
    .filter(activeForMmr)
    .filter((c) => (c as { payment_type?: string }).payment_type === 'pontual')
    .reduce((s, c) => s + Number((c as { recurring_amount?: number | null }).recurring_amount ?? 0), 0)

  const mmr = mmrRecorrente + mmrPontual

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

  const periodDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1)
  const recurringProrated = mmr * (periodDays / 30)
  /** Receita prevista só a partir de clientes (recorrente + pontual); sem integração com lançamentos financeiros. */
  const receitaTotalMes = recurringProrated

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
