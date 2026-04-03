import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import type { ClientStatus } from '@/types'
import { ESSENTIAL_MAX_CLIENTS, hasUnlimitedQuotas } from '@/lib/plan-entitlements'
import { getEffectivePlanForUser } from '@/lib/server/get-effective-plan'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as ClientStatus | null

  const supabase = await createClient()
  let query = supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const status = (body.status as ClientStatus) || 'active'
  const validStatuses: ClientStatus[] = ['active', 'inactive', 'lead', 'archived']
  const finalStatus = validStatuses.includes(status) ? status : 'active'
  const paymentType = body.payment_type === 'recorrente' ? 'recorrente' : 'pontual'
  const rawAmount = body.recurring_amount
  const recurringAmount =
    (paymentType === 'recorrente' || paymentType === 'pontual') &&
    rawAmount != null &&
    rawAmount !== '' &&
    !Number.isNaN(Number(rawAmount))
      ? Number(rawAmount)
      : null
  let billingDueDay: number | null = null
  if (paymentType === 'recorrente' && body.billing_due_day != null && body.billing_due_day !== '') {
    const n = Number(body.billing_due_day)
    if (Number.isInteger(n) && n >= 1 && n <= 31) billingDueDay = n
  }

  const billingDueDate =
    paymentType === 'pontual' && body.billing_due_date != null && body.billing_due_date !== ''
      ? String(body.billing_due_date).slice(0, 10)
      : null

  const installmentCount =
    paymentType === 'recorrente'
      ? body.installment_count != null && body.installment_count !== ''
        ? Math.min(360, Math.max(1, Math.floor(Number(body.installment_count)) || 1))
        : null
      : null

  const downPayment =
    paymentType === 'recorrente' &&
    body.down_payment != null &&
    body.down_payment !== '' &&
    !Number.isNaN(Number(body.down_payment))
      ? Number(body.down_payment)
      : null

  const supabase = await createClient()
  const plan = await getEffectivePlanForUser(supabase, userId)
  if (!hasUnlimitedQuotas(plan)) {
    const { count, error: countErr } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 500 })
    }
    if ((count ?? 0) >= ESSENTIAL_MAX_CLIENTS) {
      return NextResponse.json(
        {
          error: 'CLIENT_LIMIT',
          message: `O plano Essential permite até ${ESSENTIAL_MAX_CLIENTS} clientes. Faça upgrade para o Pro para clientes ilimitados.`,
        },
        { status: 403 }
      )
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      name: body.name ?? '',
      email: body.email ?? null,
      phone: body.phone ?? null,
      status: finalStatus,
      company: body.company ?? null,
      notes: body.notes ?? null,
      source: body.source ?? null,
      responsible: body.responsible ?? null,
      kanban_stage: body.kanban_stage ?? 'lead',
      payment_type: paymentType,
      recurring_amount: recurringAmount,
      recurring_end_date: null,
      billing_due_day: billingDueDay,
      billing_due_date: billingDueDate,
      installment_count: installmentCount,
      down_payment: downPayment,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
