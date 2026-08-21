'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_PALHA_SITE_SETTINGS,
  PALHA_PAGE_BLOCKS,
  whatsappHref,
  type PalhaCopyBlock,
  type PalhaPhotoSlot,
  type PalhaSiteSettings,
} from '@/lib/palha/site-settings-shared'
import { PalhaFormatField } from '../PalhaFormatField'

export default function PalhaPaginaInicialAdmin() {
  const [settings, setSettings] = useState<PalhaSiteSettings>(DEFAULT_PALHA_SITE_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<PalhaPhotoSlot | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/palha/site')
      .then((r) => r.json())
      .then((data: PalhaSiteSettings) => setSettings(data))
      .catch(() => setError('Não foi possível carregar as configurações.'))
  }, [])

  function updateCopy(block: keyof PalhaSiteSettings['copy'], key: keyof PalhaCopyBlock, value: string) {
    setSettings((current) => ({
      ...current,
      copy: {
        ...current.copy,
        [block]: { ...current.copy[block], [key]: value },
      },
    }))
  }

  async function save() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/palha/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = (await res.json()) as PalhaSiteSettings & { error?: string }
      if (!res.ok) {
        setError(data.error || 'Não foi possível salvar.')
        return
      }
      setSettings(data)
      setMessage('Alterações salvas. Elas já aparecem no site.')
    } catch {
      setError('Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function onUpload(slot: PalhaPhotoSlot, file: File | undefined) {
    if (!file) return
    setUploading(slot)
    setError('')
    setMessage('')
    try {
      const form = new FormData()
      form.set('slot', slot)
      form.set('file', file)
      const res = await fetch('/api/palha/site/upload', { method: 'POST', body: form })
      const data = (await res.json()) as { settings?: PalhaSiteSettings; error?: string }
      if (!res.ok || !data.settings) {
        setError(data.error || 'Falha ao enviar a foto.')
        return
      }
      setSettings((current) => ({
        ...data.settings!,
        copy: current.copy,
        instagramUrl: current.instagramUrl,
        facebookUrl: current.facebookUrl,
        whatsapp: current.whatsapp,
        photos: data.settings!.photos,
      }))
      setMessage('Foto atualizada.')
    } catch {
      setError('Falha ao enviar a foto.')
    } finally {
      setUploading(null)
    }
  }

  const waPreview = whatsappHref(settings.whatsapp)

  return (
    <main className="palha-admin-page">
      <h1 className="palha-kicker" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: '0 0 0.4rem' }}>
        Página Inicial
      </h1>
      <p className="palha-copy" style={{ marginBottom: '2rem' }}>
        Redes, fotos e textos de cada bloco. Use N e I nos campos para negrito e itálico.
      </p>

      <form
        className="palha-admin-form"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <h2 className="palha-label">Redes</h2>
        <label>
          Instagram
          <input
            type="url"
            placeholder="https://instagram.com/seu-perfil"
            value={settings.instagramUrl}
            onChange={(e) => setSettings((s) => ({ ...s, instagramUrl: e.target.value }))}
          />
        </label>
        <label>
          Facebook
          <input
            type="url"
            placeholder="https://facebook.com/sua-pagina"
            value={settings.facebookUrl}
            onChange={(e) => setSettings((s) => ({ ...s, facebookUrl: e.target.value }))}
          />
        </label>
        <label>
          WhatsApp
          <input
            type="tel"
            placeholder="11999999999"
            value={settings.whatsapp}
            onChange={(e) => setSettings((s) => ({ ...s, whatsapp: e.target.value }))}
          />
        </label>
        <p className="palha-copy" style={{ fontSize: '0.92rem', color: 'var(--palha-muted)' }}>
          {waPreview ? `O ícone e o botão abrem: ${waPreview}` : 'Digite o DDD e o número.'}
        </p>

        {PALHA_PAGE_BLOCKS.map((block) => (
          <section key={block.id} className="palha-admin-block">
            <h2 className="palha-label">{block.label}</h2>
            <div className="palha-admin-block-photos">
              {block.photos.map((photo) => (
                <div key={photo.slot} className="palha-admin-photo-card">
                  <span>{photo.label}</span>
                  <img src={settings.photos[photo.slot]} alt="" />
                  <label className="palha-admin-file">
                    {uploading === photo.slot ? 'Enviando…' : 'Trocar foto'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploading === photo.slot}
                      onChange={(e) => {
                        void onUpload(photo.slot, e.target.files?.[0])
                        e.currentTarget.value = ''
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
            {block.fields.map((field) => (
              <PalhaFormatField
                key={field.key}
                label={field.label}
                multiline={field.multiline}
                value={settings.copy[block.id][field.key]}
                onChange={(value) => updateCopy(block.id, field.key, value)}
              />
            ))}
          </section>
        ))}

        {error ? <p className="palha-admin-error">{error}</p> : null}
        {message ? <p className="palha-copy">{message}</p> : null}
        <button type="submit" className="palha-btn" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar página'}
        </button>
      </form>
    </main>
  )
}
