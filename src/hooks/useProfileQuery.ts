'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/lib/services/profile'
import { activityLogService } from '@/lib/services/activityLog'
import { toast } from 'sonner'
import type { Profile } from '@/contexts/AuthContext'

export const PROFILE_QUERY_KEY = ['profile']

export function useProfileQuery() {
  const queryClient = useQueryClient()

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileService.getProfile,
    staleTime: 5 * 60 * 1000,
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Profile>) => profileService.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      toast.success('Perfil atualizado!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar perfil')
    },
  })

  const upgradeSocioMutation = useMutation({
    mutationFn: profileService.upgradeToSocio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      activityLogService.logUpgradeSocio()
      toast.success('Parabéns! Agora você é um sócio!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao processar upgrade')
    },
  })

  const upgradePlanMutation = useMutation({
    mutationFn: (plan: 'essential' | 'pro') => profileService.upgradePlan(plan),
    onSuccess: (_, plan) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      activityLogService.logUpgradePlan(plan)
      toast.success(`Plano atualizado para ${plan}!`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao processar upgrade')
    },
  })

  return {
    profile,
    isLoading,
    error,
    refetch,
    updateProfile: updateMutation.mutateAsync,
    upgradeToSocio: upgradeSocioMutation.mutateAsync,
    upgradePlan: upgradePlanMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isUpgrading: upgradeSocioMutation.isPending || upgradePlanMutation.isPending,
  }
}
