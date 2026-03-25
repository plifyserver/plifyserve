import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import type { ClientStatus } from '@/types'

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
  const recurringEndDate =
    paymentType === 'recorrente' && body.recurring_end_date != null && body.recurring_end_date !== ''
      ? String(body.recurring_end_date).slice(0, 10)
      : null
  const billingDueDate =
    body.billing_due_date != null && body.billing_due_date !== ''
      ? String(body.billing_due_date).slice(0, 10)
      : null

  const supabase = await createClient()
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
      recurring_end_date: recurringEndDate,
      billing_due_date: billingDueDate,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
