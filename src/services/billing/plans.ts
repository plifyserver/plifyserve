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
    templatesLimit: 10,
    price: 49.9,
    features: [
      '1 usuário',
      'Até 20 clientes',
      '5 propostas e 5 contratos por mês',
      '1 modelo de template de proposta (3 modelos no Pro)',
      'Dashboard padrão',
      'Agenda (sem integrações externas)',
      'Gestão de projetos, tarefas e Kanban (até 5 quadros)',
      'Até 5 mapas mentais',
      'Gastos pessoais e calculadora',
      'Chat IA',
      'Suporte por e-mail',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para profissionais que precisam de mais',
    templatesLimit: null,
    price: 89.9,
    features: [
      'Até 5 usuários',
      'Clientes ilimitados',
      'Propostas e contratos ilimitados',
      '3 modelos de template de proposta (4º em desenvolvimento)',
      'Dashboard personalizável (cores, logo, white label)',
      'Agenda com integrações (ex.: Google)',
      'Kanban e mapas mentais ilimitados',
      'Gestão de Ads (tráfego) e métricas avançadas',
      'Gastos pessoais, calculadora e Chat IA',
      'Suporte via WhatsApp',
    ],
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
