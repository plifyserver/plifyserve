import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

const PLAN_LIMITS: Record<string, number | null> = {
  free: 10,
  essential: 50,
  pro: null,
  admin: null,
}

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_type, templates_count, templates_limit, account_type')
    .eq('id', userId)
    .single()

  if (profile && profile.account_type !== 'admin') {
    const planType = profile.plan_type || profile.plan || 'essential'
    const limit = profile.templates_limit ?? PLAN_LIMITS[planType] ?? 50
    const currentCount = profile.templates_count || 0
    
    if (limit !== null && currentCount >= limit) {
      return NextResponse.json(
        { 
          error: 'LIMIT_REACHED',
          message: `Limite de ${limit} templates atingido. Faça upgrade do seu plano.`,
          currentCount,
          limit,
        },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const { title, description, content, is_public } = body

  if (!title) {
    return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('templates')
    .insert({
      user_id: userId,
      title,
      description: description || null,
      content: content || null,
      is_public: is_public || false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase
    .from('profiles')
    .update({ 
      templates_count: (profile?.templates_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return NextResponse.json(data, { status: 201 })
}
