'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Upload, Palette, Check, Loader2, Trash2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { DASH_SURFACE_CARD, SITE_CONTAINER_SM } from '@/lib/siteLayout'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DEFAULT_PRIMARY = '#dc2626'
const DEFAULT_SECONDARY = '#121212'
const presetColors = [
  DEFAULT_PRIMARY,
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#06B6D4',
  '#6366F1',
]

type Props = {
  /** Em Configurações: sem título da página nem container largo */
  compact?: boolean
  /** Link do CTA quando o utilizador não é Pro (ex.: guia Planos em Configurações) */
  nonProPlanosHref?: string
}

export function DashboardPersonalizacaoForm({ compact = false, nonProPlanosHref = '/dashboard/planos' }: Props) {
  const { profile, loading: authLoading } = useAuth()
  const canCustomize = !!(profile?.is_pro || profile?.is_admin)

  const [form, setForm] = useState({
    app_name: '',
    logo_url: '',
    primary_color: DEFAULT_PRIMARY,
    secondary_color: DEFAULT_SECONDARY,
    theme: 'light',
    custom_domain: '',
    hide_branding: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const loadSettings = useCallback(() => {
    fetch('/api/app-settings', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setForm({
            app_name: data.app_name || '',
            logo_url: data.logo_url || '',
            primary_color: data.primary_color || DEFAULT_PRIMARY,
            secondary_color: data.secondary_color || DEFAULT_SECONDARY,
            theme: data.theme || 'light',
            custom_domain: data.custom_domain || '',
            hide_branding: data.hide_branding ?? false,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      fd.set('type', 'logo')
      const res = await fetch('/api/app-settings/upload', { method: 'POST', credentials: 'include', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Falha no upload')
      const url = (data as { url: string }).url
      const urlWithCache = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
      setForm((f) => ({ ...f, logo_url: urlWithCache }))
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar logo.')
    }
    setLogoUploading(false)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const logoUrlClean = (form.logo_url?.split('?')[0] ?? form.logo_url ?? '').trim()
      const payload = {
        app_name: form.app_name || null,
        logo_url: logoUrlClean || null,
        primary_color: form.primary_color || DEFAULT_PRIMARY,
        secondary_color: form.secondary_color || DEFAULT_SECONDARY,
        theme: form.theme || 'light',
        custom_domain: form.custom_domain || null,
        hide_branding: form.hide_branding ?? false,
      }
      const res = await fetch('/api/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'Falha ao salvar')
      }
      setForm((prev) => ({
        ...prev,
        app_name: (data as { app_name?: string }).app_name ?? prev.app_name,
        logo_url: (data as { logo_url?: string }).logo_url ?? prev.logo_url,
        primary_color: (data as { primary_color?: string }).primary_color ?? prev.primary_color,
        secondary_color: (data as { secondary_color?: string }).secondary_color ?? prev.secondary_color,
        theme: (data as { theme?: string }).theme ?? prev.theme,
        custom_domain: (data as { custom_domain?: string }).custom_domain ?? prev.custom_domain,
        hide_branding: (data as { hide_branding?: boolean }).hide_branding ?? prev.hide_branding,
      }))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-settings-updated'))
      }
      toast.success('Alterações salvas com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const executeResetToPlifyDefaults = async () => {
    setResetDialogOpen(false)
    setResetting(true)
    try {
      const payload = {
        app_name: null,
        logo_url: null,
        primary_color: DEFAULT_PRIMARY,
        secondary_color: DEFAULT_SECONDARY,
        theme: 'light',
        custom_domain: null,
        hide_branding: false,
      }
      const res = await fetch('/api/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'Falha ao restaurar')
      }
      setForm({
        app_name: '',
        logo_url: '',
        primary_color: DEFAULT_PRIMARY,
        secondary_color: DEFAULT_SECONDARY,
        theme: 'light',
        custom_domain: '',
        hide_branding: false,
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-settings-updated'))
      }
      toast.success('Padrões da Plify restaurados.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao restaurar')
    } finally {
      setResetting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
      </div>
    )
  }

  if (!canCustomize) {
    return (
      <div className={cn(!compact && SITE_CONTAINER_SM)}>
        <div className={cn(DASH_SURFACE_CARD, 'mx-auto max-w-lg p-8 text-center', compact && 'max-w-none')}>
          <Palette className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Personalização</h2>
          <p className="mb-6 text-sm text-slate-600">
            Cores, logo e nome do sistema estão disponíveis no plano <strong>Pro</strong>. No Essential você usa o
            visual padrão da Plify.
          </p>
          <Button asChild className="rounded-xl">
            <Link href={nonProPlanosHref}>{compact ? 'Ver guia Planos' : 'Ver planos'}</Link>
          </Button>
        </div>
      </div>
    )
  }

  const formBody = (
    <form onSubmit={save} className="space-y-6">
      <div className={cn(DASH_SURFACE_CARD, 'space-y-4 p-6')}>
        <h2 className="text-lg font-semibold text-slate-900">Identidade visual</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome do sistema</label>
          <input
            value={form.app_name}
            onChange={(e) => setForm((f) => ({ ...f, app_name: e.target.value }))}
            placeholder="Meu Negócio"
            className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Logo do sistema</label>
          <div className="mt-1 flex flex-col gap-2">
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded-xl border bg-white object-contain" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-slate-200">
                  <Upload className="h-6 w-6 text-slate-400" />
                </div>
              )}
              <div className="min-w-0 flex-1 flex-col gap-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={uploadLogo}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {logoUploading ? 'Enviando...' : 'Enviar do PC'}
                </button>
                {form.logo_url && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, logo_url: '' }))}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir logo
                  </button>
                )}
              </div>
            </div>
            <input
              type="url"
              value={form.logo_url}
              onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
              placeholder="Ou cole a URL do logo"
              className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className={cn(DASH_SURFACE_CARD, 'space-y-4 p-6')}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Palette className="h-5 w-5" />
          Cores
        </h2>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Cor primária</label>
          <div className="flex flex-wrap gap-2">
            {presetColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, primary_color: c }))}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  form.primary_color === c ? 'ring-2 ring-slate-400 ring-offset-2' : ''
                )}
                style={{ backgroundColor: c }}
              >
                {form.primary_color === c && <Check className="h-5 w-5 text-white" />}
              </button>
            ))}
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
              className="h-10 w-10 cursor-pointer rounded-xl p-1"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Cor secundária (sidebar)</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.secondary_color}
              onChange={(e) => setForm((f) => ({ ...f, secondary_color: e.target.value }))}
              className="h-10 w-10 cursor-pointer rounded-xl p-1"
            />
            <input
              value={form.secondary_color}
              onChange={(e) => setForm((f) => ({ ...f, secondary_color: e.target.value }))}
              className="w-28 rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => setResetDialogOpen(true)}
          disabled={resetting || saving}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Resetar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl px-4 py-2 font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: form.primary_color }}
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )

  const dialog = (
    <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
      <DialogContent className="rounded-2xl border-slate-200 shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Restaurar padrões da Plify?</DialogTitle>
          <DialogDescription className="text-slate-600">
            Nome do sistema, logo e cores voltam aos valores iniciais da Plify (vermelho padrão, sidebar escura, etc.).
            Você pode personalizar de novo depois.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-slate-200"
            onClick={() => setResetDialogOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-xl text-white"
            style={{ backgroundColor: DEFAULT_PRIMARY }}
            onClick={() => void executeResetToPlifyDefaults()}
            disabled={resetting}
          >
            {resetting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Restaurando…
              </>
            ) : (
              'Restaurar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (compact) {
    return (
      <>
        {formBody}
        {dialog}
      </>
    )
  }

  return (
    <div className={cn('space-y-6', SITE_CONTAINER_SM)}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Personalização</h1>
        <p className="text-slate-500">Personalize a aparência do seu sistema</p>
      </div>
      {formBody}
      {dialog}
    </div>
  )
}
