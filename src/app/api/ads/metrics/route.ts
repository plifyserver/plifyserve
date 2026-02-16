import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dateStart = searchParams.get('date_start') ?? ''
  const dateEnd = searchParams.get('date_end') ?? ''

  const supabase = await createClient()

  // Verificar se tem conta Meta conectada
  const { data: fbAccount } = await supabase
    .from('facebook_accounts')
    .select('id, ad_account_id')
    .eq('user_id', userId)
    .single()

  if (!fbAccount?.ad_account_id) {
    return NextResponse.json({
      connected: false,
      metrics: null,
      message: 'Conecte sua conta Meta Ads em Configurações',
    })
  }

  // Buscar snapshot existente
  const { data: snapshot } = await supabase
    .from('ad_snapshots')
    .select('data')
    .eq('user_id', userId)
    .eq('ad_account_id', fbAccount.ad_account_id)
    .eq('date_start', dateStart)
    .eq('date_end', dateEnd)
    .single()

  if (snapshot?.data) {
    return NextResponse.json({
      connected: true,
      metrics: snapshot.data,
      lineData: (snapshot.data as { lineData?: unknown[] }).lineData ?? [],
      barData: (snapshot.data as { barData?: unknown[] }).barData ?? [],
    })
  }

  // TODO: Chamar API Meta Ads se não tiver snapshot
  // Por ora, retornar vazio para que o frontend mostre dados simulados
  return NextResponse.json({
    connected: true,
    metrics: null,
    message: 'Nenhum snapshot para este período. Conecte e aguarde a primeira sincronização.',
  })
}
