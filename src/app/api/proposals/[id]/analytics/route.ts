import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createClient()

  // Verificar se a proposta pertence ao usuário
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id, views')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  // Buscar visualizações
  const { data: views, error: viewsError } = await supabase
    .from('proposal_views')
    .select('*')
    .eq('proposal_id', id)
    .order('viewed_at', { ascending: false })

  if (viewsError) {
    return NextResponse.json({ error: viewsError.message }, { status: 500 })
  }

  // Calcular estatísticas
  const totalViews = views?.length || 0
  const uniqueIps = new Set(views?.map(v => v.ip_address).filter(Boolean)).size
  const firstView = views?.length ? views[views.length - 1] : null
  const lastView = views?.length ? views[0] : null

  // Agrupar por dispositivo
  const deviceBreakdown: Record<string, number> = {}
  views?.forEach(v => {
    const device = v.device_type || 'unknown'
    deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1
  })

  // Timeline (últimas 10 visualizações)
  const timeline = views?.slice(0, 10).map(v => ({
    id: v.id,
    viewed_at: v.viewed_at,
    ip_address: v.ip_address,
    country: v.country,
    city: v.city,
    device_type: v.device_type,
  }))

  return NextResponse.json({
    views: totalViews,
    unique_views: uniqueIps,
    first_view: firstView?.viewed_at || null,
    last_view: lastView?.viewed_at || null,
    device_breakdown: deviceBreakdown,
    timeline,
  })
}
