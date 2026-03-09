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
    supabase.from('clients').select('id, status, payment_type').eq('user_id', userId),
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
  const mmr = clients.filter((c) => (c as { payment_type?: string }).payment_type === 'recorrente').length

  const isContractFinalizado = (c: { signatories?: unknown[] }) => {
    const sigs = (c.signatories ?? []) as { signed?: boolean }[]
    return sigs.length > 0 && sigs.every((s) => s.signed)
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
    contractsFinalized,
    financeBalance,
    totalProposals,
    period,
    from: fromStr,
    to: toStr,
  })
}
