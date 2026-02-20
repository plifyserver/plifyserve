import { createClient } from '@/lib/supabase/client'
import type { Profile, AccountType, PlanType } from '@/contexts/AuthContext'

const supabase = createClient()

export const profileService = {
  async getProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !data) return null

    return {
      ...data,
      account_type: data.account_type || 'usuario',
      templates_count: data.templates_count || 0,
      is_pro: data.plan === 'pro',
      is_socio: data.account_type === 'socio' || data.account_type === 'admin',
      is_admin: data.account_type === 'admin',
    } as Profile
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async upgradeToSocio(): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/profile/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ upgrade_type: 'socio' }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao processar upgrade')
    }

    return { success: true, message: data.message }
  },

  async upgradePlan(plan: PlanType): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/profile/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ upgrade_type: plan }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao processar upgrade')
    }

    return { success: true, message: data.message }
  },

  async uploadAvatar(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    await supabase
      .from('profiles')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return publicUrl
  },
}
