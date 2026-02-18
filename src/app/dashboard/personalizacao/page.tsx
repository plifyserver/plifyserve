'use client'

import { useEffect, useState } from 'react'
import { Upload, Palette, Check } from 'lucide-react'

const presetColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1']

export default function PersonalizacaoPage() {
  const [form, setForm] = useState({
    app_name: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E293B',
    theme: 'light',
    custom_domain: '',
    hide_branding: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/app-settings', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setForm({
            app_name: data.app_name || '',
            logo_url: data.logo_url || '',
            favicon_url: data.favicon_url || '',
            primary_color: data.primary_color || '#3B82F6',
            secondary_color: data.secondary_color || '#1E293B',
            theme: data.theme || 'light',
            custom_domain: data.custom_domain || '',
            hide_branding: data.hide_branding ?? false,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/app-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    })
    setSaving(false)
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
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
              <div className="flex items-center gap-4 mt-1">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-xl border bg-white" />
                ) : (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                  placeholder="URL do logo"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Favicon (URL)</label>
              <input
                type="url"
                value={form.favicon_url}
                onChange={(e) => setForm((f) => ({ ...f, favicon_url: e.target.value }))}
                placeholder="URL do favicon"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 mt-1"
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
            style={{ backgroundColor: 'var(--primary-color, #3B82F6)' }}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
