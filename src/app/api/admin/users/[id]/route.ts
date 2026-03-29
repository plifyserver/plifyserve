import { NextResponse, type NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireAdminSession, isUuid } from '@/lib/admin/require-admin'

const PLAN_KEYS = ['free', 'essential', 'pro'] as const
type PlanKey = (typeof PLAN_KEYS)[number]

function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === 'string' && (PLAN_KEYS as readonly string[]).includes(v)
}

const ACCOUNT_TYPES = ['usuario', 'socio', 'admin'] as const
type AccountTypeKey = (typeof ACCOUNT_TYPES)[number]

function isAccountType(v: unknown): v is AccountTypeKey {
  return typeof v === 'string' && (ACCOUNT_TYPES as readonly string[]).includes(v)
}

function planToProfilePatch(plan: PlanKey): Record<string, unknown> {
  const now = new Date().toISOString()
  const far = new Date(Date.now() + 10 * 365.25 * 24 * 60 * 60 * 1000).toISOString()

  if (plan === 'free') {
    return {
      plan: 'free',
      plan_type: 'essential',
      templates_limit: 10,
      plan_status: 'active',
      subscription_id: null,
      stripe_subscription_id: null,
      plan_expires_at: null,
      plan_started_at: now,
      payment_provider: 'manual',
      updated_at: now,
    }
  }

  if (plan === 'essential') {
    return {
      plan: 'essential',
      plan_type: 'essential',
      templates_limit: 10,
      plan_status: 'active',
      subscription_id: null,
      stripe_subscription_id: null,
      plan_expires_at: far,
      plan_started_at: now,
      payment_provider: 'manual',
      updated_at: now,
    }
  }

  return {
    plan: 'pro',
    plan_type: 'pro',
    templates_limit: null,
    plan_status: 'active',
    subscription_id: null,
    stripe_subscription_id: null,
    plan_expires_at: far,
    plan_started_at: now,
    payment_provider: 'manual',
    updated_at: now,
  }
}

type RouteContext = { params: Promise<{ id: string }> }

/** Excluir usuário (auth + profile em cascade). */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = await requireAdminSession()
  if (!admin.ok) return admin.response

  const { id } = await context.params
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  if (id === admin.userId) {
    return NextResponse.json({ error: 'Você não pode excluir a própria conta' }, { status: 400 })
  }

  const svc = createServiceRoleClient()

  const { count: adminCount, error: countErr } = await svc
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('account_type', 'admin')

  if (countErr) {
    return NextResponse.json({ error: 'Falha ao verificar administradores' }, { status: 500 })
  }

  const { data: target, error: targetErr } = await svc
    .from('profiles')
    .select('account_type')
    .eq('id', id)
    .maybeSingle()

  if (targetErr || !target) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  if (target.account_type === 'admin' && (adminCount ?? 0) <= 1) {
    return NextResponse.json(
      { error: 'Não é possível excluir o único administrador do sistema' },
      { status: 400 }
    )
  }

  const { error: delErr } = await svc.auth.admin.deleteUser(id)
  if (delErr) {
    return NextResponse.json({ error: delErr.message || 'Falha ao excluir usuário' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

/** Atualizar plano, tipo de conta ou banimento (perfil). */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = await requireAdminSession()
  if (!admin.ok) return admin.response

  const { id } = await context.params
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const svc = createServiceRoleClient()
  const { data: targetProfile, error: loadErr } = await svc
    .from('profiles')
    .select('account_type')
    .eq('id', id)
    .maybeSingle()

  if (loadErr || !targetProfile) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if ('plan' in body) {
    if (!isPlanKey(body.plan)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }
    if (targetProfile.account_type === 'admin') {
      return NextResponse.json({ error: 'Ajuste o tipo de conta antes de alterar plano de um admin' }, { status: 400 })
    }
    Object.assign(patch, planToProfilePatch(body.plan))
  }

  if ('account_type' in body && body.account_type !== undefined) {
    if (!isAccountType(body.account_type)) {
      return NextResponse.json({ error: 'Tipo de conta inválido' }, { status: 400 })
    }
    patch.account_type = body.account_type
    if (body.account_type === 'admin') {
      patch.plan_type = 'admin'
      patch.templates_limit = null
      patch.plan = 'pro'
      patch.plan_status = 'active'
      patch.subscription_id = null
      patch.stripe_subscription_id = null
      patch.plan_expires_at = null
      patch.payment_provider = 'manual'
    } else if (targetProfile.account_type === 'admin') {
      patch.plan_type = 'essential'
      patch.plan = 'essential'
      patch.templates_limit = 10
      patch.subscription_id = null
      patch.stripe_subscription_id = null
      patch.plan_expires_at = null
      patch.plan_status = 'active'
      patch.payment_provider = 'manual'
    }
  }

  if ('banned' in body && typeof body.banned === 'boolean') {
    patch.banned = body.banned
    patch.banned_at = body.banned ? new Date().toISOString() : null
    patch.banned_reason =
      body.banned && typeof body.ban_reason === 'string' && body.ban_reason.trim()
        ? body.ban_reason.trim()
        : null
  }

  const dataKeys = Object.keys(patch).filter((k) => k !== 'updated_at')
  if (dataKeys.length === 0) {
    return NextResponse.json({ error: 'Nenhuma alteração enviada' }, { status: 400 })
  }

  const { error: upErr } = await svc.from('profiles').update(patch).eq('id', id)
  if (upErr) {
    return NextResponse.json({ error: upErr.message || 'Falha ao atualizar perfil' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
