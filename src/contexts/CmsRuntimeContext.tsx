'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CmsActiveVersion = 'v1' | 'v2'

type CmsRuntimeState = {
  activeVersion: CmsActiveVersion
  loading: boolean
  error: string | null
}

const CmsRuntimeContext = createContext<CmsRuntimeState | undefined>(undefined)

async function fetchCmsRuntime(): Promise<{ activeVersion: CmsActiveVersion }> {
  const res = await fetch('/api/cms/runtime', { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error('Falha ao carregar versão do CMS')
  const data = (await res.json()) as { activeVersion?: CmsActiveVersion }
  return { activeVersion: data.activeVersion === 'v2' ? 'v2' : 'v1' }
}

export function CmsRuntimeProvider({ children }: { children: React.ReactNode }) {
  const [activeVersion, setActiveVersion] = useState<CmsActiveVersion>('v1')
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
          const next = (payload.new as { active_version?: string } | null)?.active_version
          if (next === 'v2' || next === 'v1') setActiveVersion(next)
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  const value = useMemo<CmsRuntimeState>(() => ({ activeVersion, loading, error }), [activeVersion, loading, error])

  return <CmsRuntimeContext.Provider value={value}>{children}</CmsRuntimeContext.Provider>
}

export function useCmsRuntime() {
  const ctx = useContext(CmsRuntimeContext)
  if (!ctx) throw new Error('useCmsRuntime must be used within CmsRuntimeProvider')
  return ctx
}

