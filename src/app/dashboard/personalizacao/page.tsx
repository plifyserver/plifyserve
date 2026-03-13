'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Upload, Palette, Check, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const DEFAULT_PRIMARY = '#dc2626'
const DEFAULT_SECONDARY = '#000020'
const presetColors = [DEFAULT_PRIMARY, '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1']

export default function PersonalizacaoPage() {
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

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Personalização</h1>
        <p className="text-slate-500">Personalize a aparência do seu sistema</p>
      </div>

      <form onSubmit={save} className="space-y-6">
        <div className="rounded-2xl border-0 shadow-sm bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Identidade Visual</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Sistema</label>
            <input
              value={form.app_name}
              onChange={(e) => setForm((f) => ({ ...f, app_name: e.target.value }))}
              placeholder="Meu Negócio"
              className="w-full max-w-md px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-4">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-xl border bg-white" />
                ) : (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
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
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {logoUploading ? 'Enviando...' : 'Enviar do PC'}
                  </button>
                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, logo_url: '' }))}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-white text-red-600 text-sm font-medium hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
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
                className="w-full max-w-md px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-0 shadow-sm bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Cores
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cor Primária</label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, primary_color: c }))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.primary_color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                  style={{ backgroundColor: c }}
                >
                  {form.primary_color === c && <Check className="w-5 h-5 text-white" />}
                </button>
              ))}
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                className="w-10 h-10 p-1 rounded-xl cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cor Secundária (sidebar)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.secondary_color}
                onChange={(e) => setForm((f) => ({ ...f, secondary_color: e.target.value }))}
                className="w-10 h-10 p-1 rounded-xl cursor-pointer"
              />
              <input
                value={form.secondary_color}
                onChange={(e) => setForm((f) => ({ ...f, secondary_color: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 w-28"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: form.primary_color }}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
