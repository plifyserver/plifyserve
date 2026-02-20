import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { upgrade_type } = body

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, plan')
    .eq('id', userId)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (upgrade_type === 'socio') {
    if (profile.account_type === 'admin') {
      return NextResponse.json({ error: 'Admins não precisam virar sócio' }, { status: 400 })
    }
    updates.account_type = 'socio'
  } else if (upgrade_type === 'essential') {
    updates.plan = 'essential'
  } else if (upgrade_type === 'pro') {
    updates.plan = 'pro'
  } else {
    return NextResponse.json({ error: 'Tipo de upgrade inválido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    profile: data,
    message: upgrade_type === 'socio' 
      ? 'Parabéns! Agora você é um sócio.' 
      : `Seu plano foi atualizado para ${upgrade_type}.`,
  })
}
