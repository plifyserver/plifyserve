'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useMemo } from 'react'

export function useUser() {
  const { user, profile, loading, refreshProfile, updateProfile } = useAuth()

  const isPro = useMemo(() => profile?.plan === 'pro', [profile])
  const isSocio = useMemo(() => 
    profile?.account_type === 'socio' || profile?.account_type === 'admin', 
    [profile]
  )
  const isAdmin = useMemo(() => profile?.account_type === 'admin', [profile])
  const isAuthenticated = useMemo(() => !!user && !loading, [user, loading])

  const getDisplayName = () => {
    if (!profile) return 'Usuário'
    return profile.full_name || profile.email?.split('@')[0] || 'Usuário'
  }

  const getInitials = () => {
    const name = getDisplayName()
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return {
    user,
    profile,
    loading,
    isPro,
    isSocio,
    isAdmin,
    isAuthenticated,
    getDisplayName,
    getInitials,
    refreshProfile,
    updateProfile,
  }
}
