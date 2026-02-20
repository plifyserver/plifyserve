'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export type AccountType = 'admin' | 'socio' | 'usuario'
export type PlanType = 'free' | 'essential' | 'pro' | 'admin'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  company_name: string | null
  phone: string | null
  avatar_url: string | null
  plan: PlanType
  plan_type?: PlanType
  account_type: AccountType
  banned?: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  edits_remaining: number
  templates_count: number
  created_at: string
  updated_at: string
  is_pro?: boolean
  is_socio?: boolean
  is_admin?: boolean
}


interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>
  canCreateTemplate: () => boolean
  getTemplateLimit: () => number | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!data) return null
    return {
      ...data,
      account_type: data.account_type || 'usuario',
      templates_count: data.templates_count || 0,
      is_pro: data.plan === 'pro',
      is_socio: data.account_type === 'socio' || data.account_type === 'admin',
      is_admin: data.account_type === 'admin',
    } as Profile
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u) {
        const p = await fetchProfile(u.id)
        setProfile(p)
      } else {
        setProfile(null)
      }
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const p = await fetchProfile(session.user.id)
          setProfile(p)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshProfile = async () => {
    if (!user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
  }

  const signOut = async () => {
    setUser(null)
    setProfile(null)
    try {
      await supabase.auth.signOut()
    } catch {
      // continua mesmo se falhar
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // continua mesmo se a API falhar
    }
  }

  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    if (!user) return false
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (error) {
      console.error('Error updating profile:', error)
      return false
    }
    await refreshProfile()
    return true
  }

  const getTemplateLimit = (): number | null => {
    if (!profile) return 0
    if (profile.plan === 'pro' || profile.is_admin) return null
    if (profile.plan === 'essential') return 50
    return 10
  }

  const canCreateTemplate = (): boolean => {
    if (!profile) return false
    const limit = getTemplateLimit()
    if (limit === null) return true
    return profile.templates_count < limit
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signOut, 
      refreshProfile,
      updateProfile,
      canCreateTemplate,
      getTemplateLimit,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
