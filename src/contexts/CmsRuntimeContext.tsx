'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CmsActiveVersion = 'v1' | 'v2'
/** v1 = perfil sem Especialização; v2 = com Especialização */
export type ProfileCmsVersion = 'v1' | 'v2'
/** v1 = configurações atuais no app; v2 = hub (menu + planos) sem duplicar dados na página Perfil */
export type SettingsCmsVersion = 'v1' | 'v2'

type CmsRuntimeState = {
  activeVersion: CmsActiveVersion
  feedbackButtonEnabled: boolean
  profileCmsVersion: ProfileCmsVersion
  settingsCmsVersion: SettingsCmsVersion
  loading: boolean
  error: string | null
}

const CmsRuntimeContext = createContext<CmsRuntimeState | undefined>(undefined)

async function fetchCmsRuntime(): Promise<{
  activeVersion: CmsActiveVersion
  feedbackButtonEnabled: boolean
  profileCmsVersion: ProfileCmsVersion
  settingsCmsVersion: SettingsCmsVersion
}> {
  const res = await fetch('/api/cms/runtime', { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error('Falha ao carregar versão do CMS')
  const data = (await res.json()) as {
    activeVersion?: CmsActiveVersion
    feedbackButtonEnabled?: boolean
    profileCmsVersion?: ProfileCmsVersion
    settingsCmsVersion?: SettingsCmsVersion
  }
  return {
    activeVersion: data.activeVersion === 'v2' ? 'v2' : 'v1',
    feedbackButtonEnabled: data.feedbackButtonEnabled === true,
    profileCmsVersion: data.profileCmsVersion === 'v2' ? 'v2' : 'v1',
    settingsCmsVersion: data.settingsCmsVersion === 'v2' ? 'v2' : 'v1',
  }
}

export function CmsRuntimeProvider({ children }: { children: React.ReactNode }) {
  const [activeVersion, setActiveVersion] = useState<CmsActiveVersion>('v1')
  const [feedbackButtonEnabled, setFeedbackButtonEnabled] = useState(false)
  const [profileCmsVersion, setProfileCmsVersion] = useState<ProfileCmsVersion>('v1')
  const [settingsCmsVersion, setSettingsCmsVersion] = useState<SettingsCmsVersion>('v1')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    const load = async () => {
      try {
        const runtime = await fetchCmsRuntime()
        if (!mounted) return
        setActiveVersion(runtime.activeVersion)
        setFeedbackButtonEnabled(runtime.feedbackButtonEnabled)
        setProfileCmsVersion(runtime.profileCmsVersion)
        setSettingsCmsVersion(runtime.settingsCmsVersion)
        setError(null)
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Erro ao carregar CMS')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    load()

    const channel = supabase
      .channel('cms-runtime-settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cms_runtime_settings', filter: 'id=eq.1' },
        (payload) => {
          const nextRow = payload.new as {
            active_version?: string
            feedback_button_enabled?: boolean
            profile_cms_version?: string
            settings_cms_version?: string
          } | null
          const next = nextRow?.active_version
          if (next === 'v2' || next === 'v1') setActiveVersion(next)
          if (typeof nextRow?.feedback_button_enabled === 'boolean') {
            setFeedbackButtonEnabled(nextRow.feedback_button_enabled)
          }
          const pv = nextRow?.profile_cms_version
          if (pv === 'v2' || pv === 'v1') setProfileCmsVersion(pv)
          const sv = nextRow?.settings_cms_version
          if (sv === 'v2' || sv === 'v1') setSettingsCmsVersion(sv)
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  const value = useMemo<CmsRuntimeState>(
    () => ({
      activeVersion,
      feedbackButtonEnabled,
      profileCmsVersion,
      settingsCmsVersion,
      loading,
      error,
    }),
    [activeVersion, feedbackButtonEnabled, profileCmsVersion, settingsCmsVersion, loading, error]
  )

  return <CmsRuntimeContext.Provider value={value}>{children}</CmsRuntimeContext.Provider>
}

export function useCmsRuntime() {
  const ctx = useContext(CmsRuntimeContext)
  if (!ctx) throw new Error('useCmsRuntime must be used within CmsRuntimeProvider')
  return ctx
}

