import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = await request.json()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ad_campaigns')
    .insert({
      user_id: userId,
      name: body.name ?? '',
      platform: body.platform ?? 'meta',
      investment: body.investment != null ? Number(body.investment) : null,
      leads: body.leads != null ? Number(body.leads) : null,
      conversions: body.conversions != null ? Number(body.conversions) : null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      status: body.status ?? 'active',
      account_link: body.account_link ?? null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
