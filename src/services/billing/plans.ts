export type PlanType = 'essential' | 'pro' | 'admin'
export type PlanStatus = 'active' | 'inactive' | 'trial' | 'cancelled'

export interface Plan {
  id: PlanType
  name: string
  description: string
  templatesLimit: number | null
  price: number
  priceId?: string
  features: string[]
  popular?: boolean
}

export const PLANS: Record<Exclude<PlanType, 'admin'>, Plan> = {
  essential: {
    id: 'essential',
    name: 'Essential',
    description: 'Ideal para começar',
    templatesLimit: 50,
    price: 29,
    features: [
      'Até 50 templates',
      'Upload de imagens',
      'Suporte por email',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para profissionais que precisam de mais',
    templatesLimit: null,
    price: 79,
    features: [
      'Templates ilimitados',
      'Upload de imagens ilimitado',
      'Suporte prioritário',
      'Recursos exclusivos',
    ],
    popular: true,
  },
}

export const PLAN_LIMITS = {
  essential: 50,
  pro: null,
  admin: null,
} as const

export function getPlan(planType: PlanType): Plan | null {
  if (planType === 'admin') return null
  return PLANS[planType] || null
}

export function getPlanLimit(planType: PlanType): number | null {
  return PLAN_LIMITS[planType] ?? 50
}

export function isPlanUnlimited(planType: PlanType): boolean {
  return planType === 'pro' || planType === 'admin'
}

export function canUpgradeTo(currentPlan: PlanType, targetPlan: PlanType): boolean {
  if (currentPlan === 'admin') return false
  if (currentPlan === targetPlan) return false
  if (targetPlan === 'admin') return false
  if (currentPlan === 'pro' && targetPlan === 'essential') return false
  return true
}
