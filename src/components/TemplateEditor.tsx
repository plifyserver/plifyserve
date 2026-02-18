'use client'

import { useState, useRef, useEffect } from 'react'
import { Palette, Upload, Plus, Trash2 } from 'lucide-react'
import type { TemplateStructure, ProposalPlan } from '@/types'
import { COLOR_PALETTES } from '@/types'
import type { Client } from '@/types'

/** Parse BR format: "2.000" = 2000, "2.000,50" = 2000.50, "2000" = 2000 */
function parseCurrencyInput(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '')
  if (!s) return null
  const withoutDots = s.replace(/\./g, '')
  const withDotDecimal = withoutDots.replace(',', '.')
  const n = parseFloat(withDotDecimal)
  return Number.isNaN(n) ? null : n
}

/** Format number for BR input: 2000 -> "2.000", 2000.5 -> "2.000,5" */
function formatCurrencyInput(value: number): string {
  const [intPart, decPart] = value.toFixed(2).split('.')
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decPart && parseInt(decPart, 10) > 0 ? `${intFormatted},${decPart}` : intFormatted
}

interface TemplateEditorProps {
  initialContent: TemplateStructure
  onSave: (content: TemplateStructure, confirmButtonText: string, colorPalette: string) => void
  isPro: boolean
  editsRemaining: number
  /** Ao editar proposta existente, para uploads no bucket */
  proposalId?: string
  /** Valores iniciais ao editar (senão usa padrões) */
  initialConfirmButtonText?: string
  initialColorPalette?: string
}

export function TemplateEditor({
  initialContent,
  onSave,
  isPro,
  editsRemaining,
  proposalId,
  initialConfirmButtonText,
  initialColorPalette,
}: TemplateEditorProps) {
  const [content, setContent] = useState<TemplateStructure>(initialContent)
  const [confirmButtonText, setConfirmButtonText] = useState(initialConfirmButtonText ?? 'CONFIRMAR PROPOSTA')
  const [colorPalette, setColorPalette] = useState(initialColorPalette ?? 'default')
  const [showPalette, setShowPalette] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [uploadingProduct, setUploadingProduct] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const productInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const footerLogoInputRef = useRef<HTMLInputElement>(null)
  const middlePhoto1Ref = useRef<HTMLInputElement>(null)
  const middlePhoto2Ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (content.clientesGerais) return
    fetch('/api/clients', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then((data: Client[]) => setClients(data ?? []))
      .catch(() => setClients([]))
  }, [content.clientesGerais])

  const palette = COLOR_PALETTES.find((p) => p.id === colorPalette) || COLOR_PALETTES[0]
  const canEdit = true
  const emailsList = content.companyEmails?.length ? content.companyEmails : content.companyEmail ? [content.companyEmail] : ['']
  const phonesList = content.companyPhones?.length ? content.companyPhones : content.companyPhone ? [content.companyPhone] : ['']
  const phonesValue = phonesList.join('\n')
  const emailsValue = emailsList.join('\n')
  const social = content.socialLinks || {}
  const plans = (content.plans || []) as ProposalPlan[]

  const handleSave = () => {
    if (!canEdit) return
    onSave(content, confirmButtonText, colorPalette)
  }

  const uploadFile = async (file: File, type: 'gallery' | 'product' | 'logo') => {
    const fd = new FormData()
    fd.set('file', file)
    fd.set('type', type)
    if (proposalId) fd.set('proposalId', proposalId)
    const res = await fetch('/api/proposals/upload', { method: 'POST', credentials: 'include', body: fd })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Erro no upload')
    }
    const { url } = await res.json()
    return url
  }

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length || !canEdit) return
    setUploadingGallery(true)
    try {
      const urls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i], 'gallery')
        urls.push(url)
      }
      setContent((prev) => ({ ...prev, gallery: [...(prev.gallery || []), ...urls] }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar fotos')
    }
    setUploadingGallery(false)
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const handleProductPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !canEdit) return
    setUploadingProduct(true)
    try {
      const url = await uploadFile(file, 'product')
      const urlWithCache = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
      setContent((prev) => ({ ...prev, productPhotoUrl: urlWithCache }))
      setProductPhotoVersion((v) => v + 1)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar foto')
    }
    setUploadingProduct(false)
    if (productInputRef.current) productInputRef.current.value = ''
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !canEdit) return
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      fd.set('type', 'logo')
      if (proposalId) fd.set('proposalId', proposalId)
      const res = await fetch('/api/proposals/upload', { method: 'POST', credentials: 'include', body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro no upload')
      }
      const { url } = await res.json()
      const urlWithCache = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
      setContent((prev) => ({ ...prev, companyLogo: urlWithCache }))
      setLogoVersion((v) => v + 1)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar logo')
    }
    setUploadingLogo(false)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const handleFooterLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !canEdit) return
    setUploadingFooterLogo(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      fd.set('type', 'footer_logo')
      if (proposalId) fd.set('proposalId', proposalId)
      const res = await fetch('/api/proposals/upload', { method: 'POST', credentials: 'include', body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro no upload')
      }
      const { url } = await res.json()
      const urlWithCache = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
      setContent((prev) => ({ ...prev, footerLogo: urlWithCache }))
      setFooterLogoVersion((v) => v + 1)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar logo do rodapé')
    }
    setUploadingFooterLogo(false)
    if (footerLogoInputRef.current) footerLogoInputRef.current.value = ''
  }

  const handleMiddlePhotoChange = async (index: 0 | 1, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !canEdit) return
    setUploadingMiddle(true)
    try {
      const url = await uploadFile(file, 'gallery')
      const prev = content.middlePhotos || []
      const next = [...prev]
      next[index] = url
      setContent({ ...content, middlePhotos: next })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar foto')
    }
    setUploadingMiddle(false)
    if (index === 0 && middlePhoto1Ref.current) middlePhoto1Ref.current.value = ''
    if (index === 1 && middlePhoto2Ref.current) middlePhoto2Ref.current.value = ''
  }

  const setPlan = (index: number, upd: Partial<ProposalPlan>) => {
    const next = [...plans]
    const current = next[index] ?? { name: '', price: 0, includes: [] }
    next[index] = { ...current, ...upd }
    setContent({ ...content, plans: next, pricingMode: 'plans' })
  }

  const addPlan = () => {
    if (plans.length >= 6) return
    setContent({ ...content, plans: [...plans, { name: '', price: 0, includes: [] }], pricingMode: 'plans' })
  }

  const removePlan = (index: number) => {
    const next = plans.filter((_, i) => i !== index)
    setContent({ ...content, plans: next })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr,minmax(380px,440px)] gap-8 xl:gap-10 items-start">
      {/* Formulário */}
      <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Nome da empresa</label>
          <input
            type="text"
            value={content.companyName}
            onChange={(e) => setContent({ ...content, companyName: e.target.value })}
            disabled={!canEdit}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Logo da empresa</label>
          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} disabled={!canEdit || uploadingLogo} className="hidden" />
          <div className="flex items-center gap-4">
            {content.companyLogo && (
              <img
                src={`${content.companyLogo}${content.companyLogo.includes('?') ? '&' : '?'}v=${logoVersion}`}
                alt="Logo"
                className="h-14 w-auto object-contain rounded border border-gray-200"
              />
            )}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={!canEdit || uploadingLogo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              {uploadingLogo ? 'Enviando...' : <Upload className="w-4 h-4" />}
              {content.companyLogo ? 'Trocar logo' : 'Enviar logo'}
            </button>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Logo do rodapé (opcional, pode ser diferente)</label>
          <input ref={footerLogoInputRef} type="file" accept="image/*" onChange={handleFooterLogoChange} disabled={!canEdit || uploadingFooterLogo} className="hidden" />
          <div className="flex flex-wrap items-center gap-4">
            {content.footerLogo && (
              <img
                src={`${content.footerLogo}${content.footerLogo.includes('?') ? '&' : '?'}v=${footerLogoVersion}`}
                alt="Logo rodapé"
                className="h-14 w-auto object-contain rounded border border-gray-200"
              />
            )}
            <button
              type="button"
              onClick={() => footerLogoInputRef.current?.click()}
              disabled={!canEdit || uploadingFooterLogo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              {uploadingFooterLogo ? 'Enviando...' : <Upload className="w-4 h-4" />}
              {content.footerLogo ? 'Trocar logo do rodapé' : 'Enviar logo do rodapé'}
            </button>
            {content.footerLogo && canEdit && (
              <button
                type="button"
                onClick={() => setContent((prev) => ({ ...prev, footerLogo: undefined }))}
                className="text-sm text-red-500 hover:underline"
              >
                Remover
              </button>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Telefones de contato (um por linha)</label>
          <textarea
            value={phonesValue}
            onChange={(e) => {
              const raw = e.target.value
              const lines = raw.split('\n').map((s) => s.trim())
              const filled = lines.filter(Boolean)
              setContent({
                ...content,
                companyPhones: lines.length ? lines : undefined,
                companyPhone: filled[0] || content.companyPhone,
              })
            }}
            disabled={!canEdit}
            rows={4}
            placeholder={'(11) 99999-9999\n(11) 88888-8888'}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">E-mails de contato (um por linha)</label>
          <textarea
            value={emailsValue}
            onChange={(e) => {
              const raw = e.target.value
              const lines = raw.split('\n').map((s) => s.trim())
              const filled = lines.filter(Boolean)
              setContent({
                ...content,
                companyEmails: lines.length ? lines : undefined,
                companyEmail: filled[0] || content.companyEmail,
              })
            }}
            disabled={!canEdit}
            rows={5}
            placeholder={'contato@empresa.com\noutro@empresa.com'}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
          />
        </div>
        <div className="md:col-span-2 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!content.clientesGerais}
              onChange={(e) =>
                setContent({
                  ...content,
                  clientesGerais: e.target.checked,
                  clientName: e.target.checked ? undefined : content.clientName,
                })
              }
              disabled={!canEdit}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-zinc-300">Clientes gerais (não direcionar a um cliente)</span>
          </label>
        </div>
        {!content.clientesGerais && (
          <>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Cliente cadastrado</label>
              <select
                value=""
                onChange={(e) => {
                  const id = e.target.value
                  const c = clients.find((x) => x.id === id)
                  if (c) {
                    setContent({
                      ...content,
                      clientName: c.name,
                      clientEmail: c.email ?? undefined,
                      clientPhone: c.phone ?? undefined,
                    })
                  }
                }}
                disabled={!canEdit}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
              >
                <option value="">Selecionar cliente (opcional)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Nome do cliente</label>
              <input
                type="text"
                value={content.clientName || ''}
                onChange={(e) => setContent({ ...content, clientName: e.target.value || undefined })}
                disabled={!canEdit}
                placeholder="Opcional"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">E-mail do cliente</label>
              <input
                type="email"
                value={content.clientEmail || ''}
                onChange={(e) => setContent({ ...content, clientEmail: e.target.value || undefined })}
                disabled={!canEdit}
                placeholder="Opcional"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Telefone do cliente</label>
              <input
                type="text"
                value={content.clientPhone || ''}
                onChange={(e) => setContent({ ...content, clientPhone: e.target.value || undefined })}
                disabled={!canEdit}
                placeholder="Opcional"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Data da proposta</label>
          <input
            type="date"
            value={content.proposalDate || new Date().toISOString().slice(0, 10)}
            onChange={(e) => setContent({ ...content, proposalDate: e.target.value || undefined })}
            disabled={!canEdit}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Rolo de fotos (galeria)</label>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryChange}
            disabled={!canEdit || uploadingGallery}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={!canEdit || uploadingGallery}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            {uploadingGallery ? 'Enviando...' : <Upload className="w-4 h-4" />}
            Adicionar fotos do PC
          </button>
          {content.gallery?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {content.gallery.map((url, i) => (
                <div key={url} className="relative group">
                  <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() =>
                        setContent((prev) => ({
                          ...prev,
                          gallery: (prev.gallery || []).filter((_, j) => j !== i),
                        }))
                      }
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Tipo de proposta</label>
          <input
            type="text"
            value={content.proposalType}
            onChange={(e) => setContent({ ...content, proposalType: e.target.value })}
            disabled={!canEdit}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Tipo de serviço</label>
          <input
            type="text"
            value={content.serviceType}
            onChange={(e) => setContent({ ...content, serviceType: e.target.value })}
            disabled={!canEdit}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Descrição do serviço / produto</label>
          <textarea
            value={content.serviceDescription ?? content.productDescription ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setContent({ ...content, serviceDescription: v, productDescription: v })
            }}
            disabled={!canEdit}
            rows={4}
            placeholder="Descreva o que você está oferecendo..."
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Foto do produto</label>
          <input ref={productInputRef} type="file" accept="image/*" onChange={handleProductPhotoChange} disabled={!canEdit || uploadingProduct} className="hidden" />
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => productInputRef.current?.click()}
              disabled={!canEdit || uploadingProduct}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              {uploadingProduct ? 'Enviando...' : <Upload className="w-4 h-4" />}
              {content.productPhotoUrl ? 'Trocar foto' : 'Enviar foto do produto'}
            </button>
            {content.productPhotoUrl && (
              <div className="relative group w-40 h-40 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-100">
                <img
                  src={`${content.productPhotoUrl}${content.productPhotoUrl.includes('?') ? '&' : '?'}v=${productPhotoVersion}`}
                  alt="Foto do produto"
                  className="w-full h-full object-contain"
                />
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setContent((prev) => ({ ...prev, productPhotoUrl: undefined }))}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Textos do rolo (marquee) – até 3 frases que passam na tela</label>
          {[0, 1, 2].map((i) => {
            const texts = content.marqueeTexts?.length ? content.marqueeTexts : content.marqueeText ? [content.marqueeText] : []
            const value = texts[i] ?? ''
            return (
              <input
                key={i}
                type="text"
                value={value}
                onChange={(e) => {
                  const next = [...(content.marqueeTexts || content.marqueeText ? (content.marqueeTexts || [content.marqueeText!]) : [])]
                  next[i] = e.target.value.trim()
                  const filtered = next.filter(Boolean)
                  setContent({
                    ...content,
                    marqueeTexts: filtered.length ? filtered : undefined,
                    marqueeText: filtered[0] || content.marqueeText,
                  })
                }}
                disabled={!canEdit}
                placeholder={i === 0 ? 'Ex: 15% de desconto até o fim do mês' : `Texto ${i + 2} (opcional)`}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50 mt-2 first:mt-0"
              />
            )
          })}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">2 fotos (entre rolo de texto e planos)</label>
          <div className="flex flex-wrap gap-4 mt-2">
            {[0, 1].map((i) => {
              const ref = i === 0 ? middlePhoto1Ref : middlePhoto2Ref
              const url = content.middlePhotos?.[i]
              return (
                <div key={i} className="flex flex-col items-start gap-2">
                  <input
                    ref={ref}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleMiddlePhotoChange(i as 0 | 1, e)}
                    disabled={!canEdit || uploadingMiddle}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => ref.current?.click()}
                    disabled={!canEdit || uploadingMiddle}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  >
                    {uploadingMiddle ? 'Enviando...' : <Upload className="w-4 h-4" />}
                    {url ? `Trocar foto ${i + 1}` : `Enviar foto ${i + 1}`}
                  </button>
                  {url && (
                    <div className="relative group">
                      <img src={url} alt="" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...(content.middlePhotos || [])]
                            next.splice(i, 1)
                            setContent({ ...content, middlePhotos: next.length ? next : undefined })
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Forma de preço</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricingMode"
                checked={(content.pricingMode || 'single') === 'single'}
                onChange={() => setContent({ ...content, pricingMode: 'single', plans: undefined })}
                disabled={!canEdit}
              />
              <span className="text-sm">Valor único</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricingMode"
                checked={content.pricingMode === 'plans'}
                onChange={() => setContent({ ...content, pricingMode: 'plans', plans: plans.length ? plans : [{ name: '', price: 0, includes: [] }] })}
                disabled={!canEdit}
              />
              <span className="text-sm">Vários planos (até 6)</span>
            </label>
          </div>
        </div>
        {(content.pricingMode || 'single') === 'single' && (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Valor (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={content.value != null && !Number.isNaN(content.value) ? formatCurrencyInput(content.value) : ''}
                onChange={(e) => {
                  const parsed = parseCurrencyInput(e.target.value)
                  setContent({ ...content, value: parsed === null ? undefined : parsed })
                }}
                disabled={!canEdit}
                placeholder="Ex: 2.000,50"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
              />
            </div>
          </>
        )}
        {content.pricingMode === 'plans' && (
          <div className="md:col-span-2 space-y-4">
            <label className="block text-sm font-medium text-zinc-300">Planos (até 6)</label>
            {plans.map((plan, i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Nome do plano"
                    value={plan.name}
                    onChange={(e) => setPlan(i, { name: e.target.value })}
                    disabled={!canEdit}
                    className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-gray-300"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="R$ 0,00"
                    value={plan.price > 0 ? formatCurrencyInput(plan.price) : ''}
                    onChange={(e) => setPlan(i, { price: parseCurrencyInput(e.target.value) ?? 0 })}
                    disabled={!canEdit}
                    className="w-28 px-3 py-2 rounded-lg border border-gray-300"
                  />
                  <button type="button" onClick={() => removePlan(i)} disabled={!canEdit} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  placeholder="O que inclui (um por linha)"
                  value={(plan.includes || []).join('\n')}
                  onChange={(e) => setPlan(i, { includes: e.target.value.split('\n') })}
                  disabled={!canEdit}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>
            ))}
            {plans.length < 6 && (
              <button
                type="button"
                onClick={addPlan}
                disabled={!canEdit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-400 text-gray-600 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" /> Adicionar plano
              </button>
            )}
          </div>
        )}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Por que me escolher / utilizar meu serviço</label>
          <textarea
            value={content.whyChooseMe || ''}
            onChange={(e) => setContent({ ...content, whyChooseMe: e.target.value || undefined })}
            disabled={!canEdit}
            rows={3}
            placeholder="Diferenciais, garantias, experiência..."
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Contato e CTA (frase chamativa para aceitar)</label>
          <textarea
            value={content.contactCta || ''}
            onChange={(e) => setContent({ ...content, contactCta: e.target.value || undefined })}
            disabled={!canEdit}
            rows={2}
            placeholder="Ex: Fale conosco e feche seu projeto com condições especiais!"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Site da empresa (opcional)</label>
          <input
            type="url"
            placeholder="https://www.suaempresa.com.br"
            value={content.companyWebsite || ''}
            onChange={(e) => setContent({ ...content, companyWebsite: e.target.value.trim() || undefined })}
            disabled={!canEdit}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50 mb-3"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Redes sociais (links completos)</label>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              type="url"
              placeholder="Instagram (https://instagram.com/suaempresa)"
              value={social.instagram || ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  socialLinks: {
                    ...social,
                    instagram: e.target.value.trim() || undefined,
                  },
                })
              }
              disabled={!canEdit}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
            />
            <input
              type="url"
              placeholder="Facebook (https://facebook.com/suaempresa)"
              value={social.facebook || ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  socialLinks: {
                    ...social,
                    facebook: e.target.value.trim() || undefined,
                  },
                })
              }
              disabled={!canEdit}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
            />
            <input
              type="url"
              placeholder="TikTok (https://www.tiktok.com/@suaempresa)"
              value={social.tiktok || ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  socialLinks: {
                    ...social,
                    tiktok: e.target.value.trim() || undefined,
                  },
                })
              }
              disabled={!canEdit}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
            />
            <input
              type="url"
              placeholder="X / Twitter (https://x.com/suaempresa)"
              value={social.x || ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  socialLinks: {
                    ...social,
                    x: e.target.value.trim() || undefined,
                  },
                })
              }
              disabled={!canEdit}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
            />
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Esses links só aparecem na proposta se você preencher. Campos vazios são ignorados.
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Texto do botão de confirmação (valor único)
          </label>
          <input
            type="text"
            value={confirmButtonText}
            onChange={(e) => setConfirmButtonText(e.target.value)}
            disabled={!canEdit}
            placeholder="CONFIRMAR PROPOSTA, ACEITAR, ENTRE AGORA..."
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Texto do botão em cada plano (quando há vários planos)
          </label>
          <input
            type="text"
            value={content.acceptPlanButtonText ?? 'Aceitar plano'}
            onChange={(e) => setContent({ ...content, acceptPlanButtonText: e.target.value.trim() || undefined })}
            disabled={!canEdit}
            placeholder="Aceitar plano, Escolher este plano..."
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 disabled:opacity-50"
          />
        </div>
        <div className="md:col-span-2">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <Palette className="w-4 h-4" />
            Paleta de cores
          </button>
          {showPalette && (
            <div className="mt-4 flex flex-wrap gap-3">
              {COLOR_PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setColorPalette(p.id)
                    if (!canEdit) return
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    colorPalette === p.id
                      ? 'border-avocado bg-avocado/20'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex gap-1">
                    {p.colors.map((c, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="text-sm">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!canEdit}
        className="px-6 py-3 rounded-lg bg-avocado hover:bg-avocado-light text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Salvar e gerar link
      </button>
      </div>

      {/* Pré-visualização */}
      <div className="xl:sticky xl:top-6 space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
          <Eye className="w-4 h-4" />
          Pré-visualização
        </h3>
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-lg">
          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto">
            <ProposalTemplate3D
              content={{
                ...content,
                companyLogo: content.companyLogo
                  ? `${content.companyLogo}${content.companyLogo.includes('?') ? '&' : '?'}v=${logoVersion}`
                  : content.companyLogo,
                footerLogo: content.footerLogo
                  ? `${content.footerLogo}${content.footerLogo.includes('?') ? '&' : '?'}v=${footerLogoVersion}`
                  : content.footerLogo,
                productPhotoUrl: content.productPhotoUrl
                  ? `${content.productPhotoUrl}${content.productPhotoUrl.includes('?') ? '&' : '?'}v=${productPhotoVersion}`
                  : content.productPhotoUrl,
              }}
              confirmButtonText={confirmButtonText}
              colorPalette={colorPalette}
              isViewMode
            />
          </div>
        </div>
      </div>
    </div>
  )
}
