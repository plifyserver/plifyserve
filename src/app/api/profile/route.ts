import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ...profile, is_pro: profile.plan === 'pro' })
}

export async function PUT(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.full_name !== undefined) updates.full_name = body.full_name
  if (body.company_name !== undefined) updates.company_name = body.company_name
  if (body.phone !== undefined) updates.phone = body.phone
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url
  if (body.edits_remaining !== undefined) updates.edits_remaining = body.edits_remaining
  if (body.plan !== undefined) updates.plan = body.plan
  if (body.stripe_customer_id !== undefined) updates.stripe_customer_id = body.stripe_customer_id
  if (body.stripe_subscription_id !== undefined) updates.stripe_subscription_id = body.stripe_subscription_id
  updates.updated_at = new Date().toISOString()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ...data, is_pro: data.plan === 'pro' })
}
