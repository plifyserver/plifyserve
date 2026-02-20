import { createClient } from '@/lib/supabase/client'
import { PlanType, PLAN_LIMITS, isPlanUnlimited } from './plans'

export interface UserBillingInfo {
  userId: string
  planType: PlanType
  planStatus: string
  templatesLimit: number | null
  templatesCount: number
  subscriptionId: string | null
  planStartedAt: string | null
  planExpiresAt: string | null
}

export interface CanCreateResult {
  canCreate: boolean
  currentCount: number
  maxLimit: number | null
  planType: PlanType
  reason?: 'LIMIT_REACHED' | 'PLAN_INACTIVE' | 'OK'
}

export const billingService = {
  async getUserBillingInfo(userId: string): Promise<UserBillingInfo | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        plan_type,
        plan_status,
        templates_limit,
        templates_count,
        subscription_id,
        plan_started_at,
        plan_expires_at
      `)
      .eq('id', userId)
      .single()

    if (error || !data) return null

    return {
      userId: data.id,
      planType: (data.plan_type as PlanType) || 'essential',
      planStatus: data.plan_status || 'active',
      templatesLimit: data.templates_limit,
      templatesCount: data.templates_count || 0,
      subscriptionId: data.subscription_id,
      planStartedAt: data.plan_started_at,
      planExpiresAt: data.plan_expires_at,
    }
  },

  async canUserCreateTemplate(userId: string): Promise<CanCreateResult> {
    const supabase = createClient()

    interface RpcResult {
      can_create: boolean
      current_count: number
      max_limit: number | null
      plan_type: string
    }

    const { data, error } = await supabase
      .rpc('check_user_template_limit', { p_user_id: userId })
      .single<RpcResult>()

    if (error || !data) {
      const billingInfo = await this.getUserBillingInfo(userId)
      if (!billingInfo) {
        return {
          canCreate: false,
          currentCount: 0,
          maxLimit: 50,
          planType: 'essential',
          reason: 'PLAN_INACTIVE',
        }
      }

      const limit = PLAN_LIMITS[billingInfo.planType]
      const canCreate = limit === null || billingInfo.templatesCount < limit

      return {
        canCreate,
        currentCount: billingInfo.templatesCount,
        maxLimit: limit,
        planType: billingInfo.planType,
        reason: canCreate ? 'OK' : 'LIMIT_REACHED',
      }
    }

    return {
      canCreate: data.can_create,
      currentCount: data.current_count,
      maxLimit: data.max_limit,
      planType: data.plan_type as PlanType,
      reason: data.can_create ? 'OK' : 'LIMIT_REACHED',
    }
  },

  async updateUserPlan(
    userId: string,
    planType: PlanType,
    subscriptionId?: string
  ): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase.rpc('update_user_plan', {
      p_user_id: userId,
      p_plan_type: planType,
      p_subscription_id: subscriptionId || null,
    })

    return !error
  },

  async getUsagePercentage(userId: string): Promise<number> {
    const billingInfo = await this.getUserBillingInfo(userId)
    if (!billingInfo) return 0
    
    if (isPlanUnlimited(billingInfo.planType)) return 0
    
    const limit = billingInfo.templatesLimit || PLAN_LIMITS.essential
    if (!limit) return 0
    
    return Math.min(100, (billingInfo.templatesCount / limit) * 100)
  },

  async getRemainingTemplates(userId: string): Promise<number | null> {
    const billingInfo = await this.getUserBillingInfo(userId)
    if (!billingInfo) return 0
    
    if (isPlanUnlimited(billingInfo.planType)) return null
    
    const limit = billingInfo.templatesLimit || PLAN_LIMITS.essential
    if (!limit) return null
    
    return Math.max(0, limit - billingInfo.templatesCount)
  },
}
