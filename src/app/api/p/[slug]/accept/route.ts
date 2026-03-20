import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type PlanRow = {
  id: string
  name?: string
  description?: string
  benefits?: string[]
  price?: number
  priceType?: string
  highlighted?: boolean
}

function buildAcceptedPlan(plan: PlanRow) {
  return {
    id: plan.id,
    name: plan.name ?? '',
    description: plan.description ?? '',
    benefits: Array.isArray(plan.benefits) ? plan.benefits : [],
    price: typeof plan.price === 'number' ? plan.price : 0,
    priceType: plan.priceType ?? 'unique',
    highlighted: plan.highlighted ?? false,
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id, status, content')
    .eq('public_slug', slug)
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  if (proposal.status === 'accepted') {
    return NextResponse.json({ error: 'Proposta já foi aceita' }, { status: 400 })
  }

  if (proposal.status === 'draft') {
    return NextResponse.json({ error: 'Proposta ainda não foi enviada' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({})) as {
    selectedPlanId?: string
    clientComment?: string
  }

  const rawComment =
    typeof body.clientComment === 'string' ? body.clientComment.trim().slice(0, 2000) : ''
  const selectedPlanId =
    typeof body.selectedPlanId === 'string' && body.selectedPlanId.length > 0
      ? body.selectedPlanId
      : null

  const content = (proposal.content || {}) as Record<string, unknown>
  const paymentType = content.paymentType === 'single' ? 'single' : 'plans'
  const plans = Array.isArray(content.plans) ? (content.plans as PlanRow[]) : []
  const singlePrice = typeof content.singlePrice === 'number' ? content.singlePrice : 0

  if (paymentType === 'plans' && plans.length > 0) {
    if (!selectedPlanId || !plans.some((p) => p.id === selectedPlanId)) {
      return NextResponse.json({ error: 'Selecione um plano válido para aceitar.' }, { status: 400 })
    }
  }

  const chosen = selectedPlanId ? plans.find((p) => p.id === selectedPlanId) : null
  let contentPatch: Record<string, unknown> = {
    acceptanceClientComment: rawComment || null,
  }

  if (chosen) {
    contentPatch = {
      ...contentPatch,
      acceptedPlanId: chosen.id,
      acceptedPlan: buildAcceptedPlan(chosen),
    }
  } else if (paymentType === 'single' && singlePrice > 0) {
    contentPatch = {
      ...contentPatch,
      acceptedPlanId: null,
      acceptedPlan: {
        id: 'single',
        name: 'Valor único',
        description: '',
        benefits: [],
        price: singlePrice,
        priceType: 'unique',
        highlighted: false,
      },
    }
  }

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'

  const { data, error } = await supabase.rpc('accept_proposal', {
    p_proposal_id: proposal.id,
    p_ip_address: ip,
    p_content_patch: contentPatch,
  })

  if (error) {
    console.error('Error accepting proposal:', error)
    return NextResponse.json({ error: 'Erro ao aceitar proposta' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Não foi possível aceitar a proposta' }, { status: 400 })
  }

  return NextResponse.json({ success: true, status: 'accepted' })
}
