import { PLAN_FEATURES_ESSENTIAL, PLAN_FEATURES_PRO } from '@/lib/planMarketingCopy'

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
    description: 'O essencial para organizar vendas e rotina',
    templatesLimit: 10,
    price: 49.9,
    features: [...PLAN_FEATURES_ESSENTIAL],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Ilimitado, marca própria e agenda no Google e no celular',
    templatesLimit: null,
    price: 89.9,
    features: [...PLAN_FEATURES_PRO],
    popular: true,
  },
}

export const PLAN_LIMITS = {
  essential: 10,
  pro: null,
  admin: null,
} as const

export function getPlan(planType: PlanType): Plan | null {
  if (planType === 'admin') return null
  return PLANS[planType] || null
}

export function getPlanLimit(planType: PlanType): number | null {
  return PLAN_LIMITS[planType] ?? 10
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
