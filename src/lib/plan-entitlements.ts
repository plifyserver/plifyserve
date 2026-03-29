/**
 * Limites e flags por plano (Essential vs Pro). Admin = mesmo acesso que Pro para limites.
 */

export type EffectivePlan = 'essential' | 'pro' | 'admin'

export const ESSENTIAL_MAX_CLIENTS = 20
export const ESSENTIAL_MONTHLY_PROPOSALS = 5
export const ESSENTIAL_MONTHLY_CONTRACTS = 5
export const ESSENTIAL_MAX_MIND_MAPS = 5
export const ESSENTIAL_MAX_KANBAN_BOARDS = 5
/** Templates salvos pelo usuário (tabela templates), não confundir com modelos padrão de proposta. */
export const ESSENTIAL_CUSTOM_TEMPLATES_CAP = 10

export interface PlanProfileLike {
  plan_type?: string | null
  plan?: string | null
  account_type?: string | null
}

export function resolveEffectivePlan(p: PlanProfileLike | null | undefined): EffectivePlan {
  if (!p) return 'essential'
  if (p.account_type === 'admin') return 'admin'
  const t = (p.plan_type || p.plan || 'essential').toLowerCase()
  if (t === 'pro') return 'pro'
  return 'essential'
}

export function hasUnlimitedQuotas(plan: EffectivePlan): boolean {
  return plan === 'pro' || plan === 'admin'
}

export function startOfUtcMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0))
}

export function customTemplatesLimitForPlan(plan: EffectivePlan): number | null {
  if (hasUnlimitedQuotas(plan)) return null
  return ESSENTIAL_CUSTOM_TEMPLATES_CAP
}

export function effectiveCustomTemplateLimit(
  plan: EffectivePlan,
  profileTemplatesLimit: number | null | undefined
): number | null {
  const cap = customTemplatesLimitForPlan(plan)
  if (cap === null) return null
  if (profileTemplatesLimit == null) return cap
  return Math.min(cap, profileTemplatesLimit)
}
