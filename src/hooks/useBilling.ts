'use client'

import { useQuery } from '@tanstack/react-query'
import { PLANS, type PlanType } from '@/services/billing'

interface UsageData {
  planType: PlanType
  planStatus: string
  templatesUsed: number
  templatesLimit: number | null
  remaining: number | null
  usagePercentage: number
  isUnlimited: boolean
  subscriptionId: string | null
  planStartedAt: string | null
  planExpiresAt: string | null
}

interface CheckLimitData {
  canCreate: boolean
  currentCount: number
  maxLimit: number | null
  planType: PlanType
  planStatus: string
  isUnlimited: boolean
  reason: 'OK' | 'LIMIT_REACHED'
}

export const BILLING_USAGE_KEY = ['billing', 'usage']
export const BILLING_LIMIT_KEY = ['billing', 'limit']

async function fetchUsage(): Promise<UsageData> {
  const res = await fetch('/api/billing/usage', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch usage')
  return res.json()
}

async function fetchLimit(): Promise<CheckLimitData> {
  const res = await fetch('/api/billing/check-limit', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch limit')
  return res.json()
}

export function useBilling() {
  const usageQuery = useQuery({
    queryKey: BILLING_USAGE_KEY,
    queryFn: fetchUsage,
    staleTime: 1000 * 60 * 5,
  })

  const limitQuery = useQuery({
    queryKey: BILLING_LIMIT_KEY,
    queryFn: fetchLimit,
    staleTime: 1000 * 60,
  })

  const usage = usageQuery.data
  const limit = limitQuery.data

  const currentPlan = usage?.planType ? PLANS[usage.planType as keyof typeof PLANS] : null

  return {
    usage,
    limit,
    currentPlan,
    isLoading: usageQuery.isLoading || limitQuery.isLoading,
    error: usageQuery.error || limitQuery.error,
    canCreateTemplate: limit?.canCreate ?? true,
    isUnlimited: usage?.isUnlimited ?? false,
    templatesUsed: usage?.templatesUsed ?? 0,
    templatesLimit: usage?.templatesLimit ?? 50,
    usagePercentage: usage?.usagePercentage ?? 0,
    remaining: usage?.remaining ?? null,
    refetch: () => {
      usageQuery.refetch()
      limitQuery.refetch()
    },
  }
}
