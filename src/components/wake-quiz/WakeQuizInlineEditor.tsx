'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { X, Save, Upload, Trash2, Bold, Italic, Underline } from 'lucide-react'
import type { WakeQuizHeroContent, WakeQuizHeroEditSection, WakeQuizPillar } from '@/lib/wakeQuizHero'
import { WAKE_QUIZ_SECTION_LABELS } from '@/lib/wakeQuizHero'

const FONT_OPTIONS: { value: NonNullable<WakeQuizHeroContent['badgeFontKey']>; label: string }[] = [
  { value: 'grotesk', label: 'Space Grotesk' },
  { value: 'inter', label: 'Inter' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'dmSans', label: 'DM Sans' },
  { value: 'playfair', label: 'Playfair Display' },
]

type Props = {
  section: WakeQuizHeroEditSection | null
  /** Controla quais sliders de logo aparecem no painel (hero vs perguntas). */
  logoSizingContext?: 'hero' | 'questions' | null
  onClose: () => void
  hero: WakeQuizHeroContent
  onHeroPatch: (patch: Partial<WakeQuizHeroContent>) => void
  logoUrl: string | null
  onLogoUrl: (url: string | null) => void
}

export function WakeQuizInlineEditor({
  section,
  logoSizingContext = null,
  onClose,
  hero,
  onHeroPatch,
  logoUrl,
  onLogoUrl,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/wake-quiz/hero', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        logoUrl?: string | null
      }
      if (!res.ok) throw new Error(data.error || 'Erro ao guardar')
      if (typeof data.logoUrl !== 'undefined') onLogoUrl(data.logoUrl ?? null)
      toast.success('Alterações guardadas.')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  const uploadLogo = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/dashboard/wake-quiz/logo', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      const data = (await res.json()) as { logoUrl?: string; error?: string }
      if (!res.ok) throw new Error(data.error || 'Falha no envio')
      if (data.logoUrl) onLogoUrl(data.logoUrl)
      toast.success('Logo atualizado.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro no upload')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeLogo = async () => {
    try {
      const res = await fetch('/api/dashboard/wake-quiz/logo', {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d.error || 'Erro ao remover')
      }
      onLogoUrl(null)
      toast.success('Logo removido.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao remover')
    }
  }

  const setPillar = (index: number, field: keyof WakeQuizPillar, value: string) => {
    const pillars = [...(hero.pillars ?? [])] as WakeQuizPillar[]
    while (pillars.length < 3) pillars.push({ icon: '✨', label: '' })
    pillars[index] = { ...pillars[index], [field]: value }
    onHeroPatch({ pillars })
  }

  if (!section) return null

  const title = WAKE_QUIZ_SECTION_LABELS[section]
  const showHeroLogoSlider = logoSizingContext !== 'questions'
  const showQuestionsLogoSlider = logoSizingContext !== 'hero'

  return (
    <>
      <div
        className="fixed inset-0 z-[190] bg-black/30 backdrop-blur-[2px]"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-[200] flex w-full max-w-md flex-col border-l border-orange-100 bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="wake-quiz-inline-editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3">
          <h2 id="wake-quiz-inline-editor-title" className="text-sm font-bold text-slate-900">
            Editar: {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-orange-50 hover:text-slate-800"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
          {section === 'logo' && (
            <>
              <p className="text-[11px] text-slate-500">
                Clique fora ou em Fechar para voltar. Use <strong>Guardar</strong> para gravar no servidor.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => void uploadLogo(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800 hover:bg-orange-100 disabled:opacity-50"
                >
                  <Upload className="size-4" />
                  {uploading ? 'A enviar…' : 'Carregar imagem como logo'}
                </button>
                {logoUrl ? (
                  <button
                    type="button"
                    onClick={() => void removeLogo()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                    Remover imagem (usar texto)
                  </button>
                ) : null}
              </div>
              {logoUrl && showHeroLogoSlider ? (
                <div className="rounded-xl border border-orange-100 bg-orange-50/50 px-3 py-3">
                  <label className="mb-2 flex items-center justify-between gap-2 text-xs font-medium text-slate-700">
                    <span>Tamanho da imagem no topo</span>
                    <span className="tabular-nums text-orange-600">
                      {Math.min(280, Math.max(40, hero.logoImageMaxHeightPx ?? 88))}px altura máx.
                    </span>
                  </label>
                  <input
                    type="range"
                    min={40}
                    max={280}
                    step={4}
                    value={Math.min(
                      280,
                      Math.max(40, hero.logoImageMaxHeightPx ?? 88)
                    )}
                    onChange={(e) =>
                      onHeroPatch({
                        logoImageMaxHeightPx: Math.min(280, Math.max(40, Number(e.target.value) || 88)),
                      })
                    }
                    className="h-2 w-full cursor-pointer accent-orange-500"
                  />
                  <p className="mt-2 text-[11px] text-slate-500">
                    Arraste para aumentar ou diminuir (imagens largas mantêm proporção).
                  </p>
                </div>
              ) : null}
              {logoUrl && showQuestionsLogoSlider ? (
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <label className="mb-2 flex items-center justify-between gap-2 text-xs font-medium text-slate-700">
                    <span>Tamanho da logo nas perguntas</span>
                    <span className="tabular-nums text-orange-600">
                      {Math.min(96, Math.max(24, hero.questionHeaderLogoMaxHeightPx ?? 44))}px altura máx.
                    </span>
                  </label>
                  <input
                    type="range"
                    min={24}
                    max={96}
                    step={2}
                    value={Math.min(96, Math.max(24, hero.questionHeaderLogoMaxHeightPx ?? 44))}
                    onChange={(e) =>
                      onHeroPatch({
                        questionHeaderLogoMaxHeightPx: Math.min(96, Math.max(24, Number(e.target.value) || 44)),
                      })
                    }
                    className="h-2 w-full cursor-pointer accent-orange-500"
                  />
                  <p className="mt-2 text-[11px] text-slate-500">
                    Este tamanho só afeta o cabeçalho das perguntas (não muda a logo do início).
                  </p>
                </div>
              ) : null}
              <p className="text-[11px] text-slate-500">
                Sem imagem, o texto abaixo aparece com o estilo gradiente laranja.
              </p>
              <label className="block text-xs font-medium text-slate-600">Texto do logo</label>
              <input
                value={hero.logoText ?? ''}
                onChange={(e) => onHeroPatch({ logoText: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="SILVA YARIN"
              />
              <label className="block text-xs font-medium text-slate-600">Linha pequena abaixo</label>
              <input
                value={hero.tagline ?? ''}
                onChange={(e) => onHeroPatch({ tagline: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Wake Aceleradora Digital"
              />
            </>
          )}

          {section === 'badge' && (
            <>
              <label className="block text-xs font-medium text-slate-600">Ícone (emoji)</label>
              <input
                value={hero.badgeIcon ?? ''}
                onChange={(e) => onHeroPatch({ badgeIcon: e.target.value.slice(0, 8) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg"
                placeholder="⚡"
                maxLength={8}
              />
              <label className="block text-xs font-medium text-slate-600">Texto</label>
              <input
                value={hero.badgeText ?? ''}
                onChange={(e) => onHeroPatch({ badgeText: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Tamanho (px)</label>
                  <input
                    type="number"
                    min={10}
                    max={36}
                    value={hero.badgeFontSizePx ?? 14}
                    onChange={(e) =>
                      onHeroPatch({
                        badgeFontSizePx: Math.min(36, Math.max(10, Number(e.target.value) || 14)),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Cor</label>
                  <input
                    type="color"
                    value={hero.badgeTextColor?.startsWith('#') ? hero.badgeTextColor : '#f97316'}
                    onChange={(e) => onHeroPatch({ badgeTextColor: e.target.value })}
                    className="h-10 w-full cursor-pointer rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <label className="block text-xs font-medium text-slate-600">Fonte</label>
              <select
                value={hero.badgeFontKey ?? 'grotesk'}
                onChange={(e) =>
                  onHeroPatch({
                    badgeFontKey: e.target.value as NonNullable<WakeQuizHeroContent['badgeFontKey']>,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              >
                {FONT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onHeroPatch({ badgeBold: !hero.badgeBold })}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    hero.badgeBold ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-slate-200'
                  }`}
                >
                  <Bold className="size-4" /> Negrito
                </button>
                <button
                  type="button"
                  onClick={() => onHeroPatch({ badgeItalic: !hero.badgeItalic })}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    hero.badgeItalic ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-slate-200'
                  }`}
                >
                  <Italic className="size-4" /> Itálico
                </button>
                <button
                  type="button"
                  onClick={() => onHeroPatch({ badgeUnderline: !hero.badgeUnderline })}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    hero.badgeUnderline ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-slate-200'
                  }`}
                >
                  <Underline className="size-4" /> Sublinhado
                </button>
              </div>
            </>
          )}

          {section === 'title' && (
            <>
              <label className="block text-xs font-medium text-slate-600">Linha 1 (escuro)</label>
              <input
                value={hero.titleLine1 ?? ''}
                onChange={(e) => onHeroPatch({ titleLine1: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <label className="block text-xs font-medium text-slate-600">Linha 2 (laranja)</label>
              <input
                value={hero.titleLine2 ?? ''}
                onChange={(e) => onHeroPatch({ titleLine2: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </>
          )}

          {section === 'subtitle' && (
            <textarea
              value={hero.subtitle ?? ''}
              onChange={(e) => onHeroPatch({ subtitle: e.target.value })}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          )}

          {section === 'pillars' && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={(hero.pillars?.[i] as WakeQuizPillar | undefined)?.icon ?? ''}
                    onChange={(e) => setPillar(i, 'icon', e.target.value)}
                    className="w-14 rounded-xl border border-slate-200 px-2 py-2 text-center text-lg"
                    placeholder="💈"
                  />
                  <input
                    value={(hero.pillars?.[i] as WakeQuizPillar | undefined)?.label ?? ''}
                    onChange={(e) => setPillar(i, 'label', e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
                    placeholder="Rótulo"
                  />
                </div>
              ))}
            </div>
          )}

          {section === 'cta' && (
            <input
              value={hero.ctaLabel ?? ''}
              onChange={(e) => onHeroPatch({ ctaLabel: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              placeholder="Texto do botão"
            />
          )}

          {section === 'footer' && (
            <>
              <label className="block text-xs font-medium text-slate-600">Emoji ou símbolo (opcional)</label>
              <input
                value={hero.footerIcon ?? ''}
                onChange={(e) => onHeroPatch({ footerIcon: e.target.value.slice(0, 8) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                maxLength={8}
              />
              <label className="block text-xs font-medium text-slate-600">Texto</label>
              <input
                value={hero.footerText ?? ''}
                onChange={(e) => onHeroPatch({ footerText: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </>
          )}

          {section === 'result_title' && (
            <>
              <label className="block text-xs font-medium text-slate-600">Linha 1 (escura)</label>
              <input
                value={hero.resultTitleLine1 ?? ''}
                onChange={(e) => onHeroPatch({ resultTitleLine1: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <label className="block text-xs font-medium text-slate-600">Linha 2 (laranja)</label>
              <input
                value={hero.resultTitleLine2 ?? ''}
                onChange={(e) => onHeroPatch({ resultTitleLine2: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <label className="block text-xs font-medium text-slate-600">Descrição</label>
              <textarea
                value={hero.resultSubtitle ?? ''}
                onChange={(e) => onHeroPatch({ resultSubtitle: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </>
          )}

          {section === 'result_contact' && (
            <>
              <label className="block text-xs font-medium text-slate-600">Título do bloco</label>
              <input
                value={hero.resultContactTitle ?? ''}
                onChange={(e) => onHeroPatch({ resultContactTitle: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <label className="block text-xs font-medium text-slate-600">Texto</label>
              <textarea
                value={hero.resultContactBody ?? ''}
                onChange={(e) => onHeroPatch({ resultContactBody: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </>
          )}

          {section === 'result_whatsapp' && (
            <>
              <label className="block text-xs font-medium text-slate-600">País</label>
              <select
                value={hero.whatsappCountry ?? 'BR'}
                onChange={(e) =>
                  onHeroPatch({ whatsappCountry: e.target.value as NonNullable<WakeQuizHeroContent['whatsappCountry']> })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              >
                <option value="BR">Brasil (+55)</option>
                <option value="PT">Portugal (+351)</option>
                <option value="US">EUA (+1)</option>
                <option value="MX">México (+52)</option>
                <option value="AR">Argentina (+54)</option>
                <option value="CL">Chile (+56)</option>
                <option value="CO">Colômbia (+57)</option>
              </select>
              <label className="block text-xs font-medium text-slate-600">Número (com DDD)</label>
              <input
                value={hero.whatsappNumber ?? ''}
                onChange={(e) => onHeroPatch({ whatsappNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Ex.: 11 99999-0000"
              />
              <label className="block text-xs font-medium text-slate-600">Texto do botão</label>
              <input
                value={hero.whatsappButtonLabel ?? ''}
                onChange={(e) => onHeroPatch({ whatsappButtonLabel: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <label className="block text-xs font-medium text-slate-600">Mensagem do WhatsApp</label>
              <textarea
                value={hero.whatsappMessage ?? ''}
                onChange={(e) => onHeroPatch({ whatsappMessage: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <p className="text-[11px] text-slate-500">
                No link público, o botão abre o WhatsApp automaticamente com este número e mensagem.
              </p>
            </>
          )}

          {section === 'result_badge' && (
            <>
              <label className="block text-xs font-medium text-slate-600">Ícone (emoji)</label>
              <input
                value={hero.resultBadgeIcon ?? ''}
                onChange={(e) => onHeroPatch({ resultBadgeIcon: e.target.value.slice(0, 8) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg"
                placeholder="🎉"
                maxLength={8}
              />
              <label className="block text-xs font-medium text-slate-600">Texto</label>
              <input
                value={hero.resultBadgeText ?? ''}
                onChange={(e) => onHeroPatch({ resultBadgeText: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Seu plano está pronto!"
              />
            </>
          )}

          {section === 'result_icon' && (
            <>
              <label className="block text-xs font-medium text-slate-600">Ícone principal (emoji)</label>
              <input
                value={hero.resultTopIcon ?? ''}
                onChange={(e) => onHeroPatch({ resultTopIcon: e.target.value.slice(0, 8) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg"
                placeholder="✨"
                maxLength={8}
              />
              <p className="text-[11px] text-slate-500">
                Este ícone aparece dentro do quadrado laranja no topo do resultado.
              </p>
            </>
          )}

          {section === 'result_stats' && (
            <div className="space-y-3">
              {(hero.resultStats ?? []).length === 3 ? null : (
                <p className="text-[11px] text-slate-500">
                  As estatísticas são 3 cards. Se estiver vazio, usamos o padrão.
                </p>
              )}
              {[0, 1, 2].map((i) => {
                const s = (hero.resultStats?.[i] ?? null) as any
                const icon = typeof s?.icon === 'string' ? s.icon : ''
                const label = typeof s?.label === 'string' ? s.label : ''
                const value = typeof s?.value === 'string' ? s.value : ''
                const barPct = typeof s?.barPct === 'number' ? s.barPct : 70
                const patchStat = (patch: Partial<{ icon: string; label: string; value: string; barPct: number }>) => {
                  const base = Array.isArray(hero.resultStats) && hero.resultStats.length === 3
                    ? hero.resultStats
                    : [
                        { icon: '📈', label: 'Potencial de crescimento', value: '+39%', barPct: 86 },
                        { icon: '👥', label: 'Novos clientes estimados/mês', value: '30+', barPct: 76 },
                        { icon: '⚡', label: 'Tempo para primeiros resultados', value: '30 dias', barPct: 66 },
                      ]
                  const next = base.map((x, idx) => (idx === i ? { ...x, ...patch } : x))
                  onHeroPatch({ resultStats: next as any })
                }
                return (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-700">Card {i + 1}</p>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Ícone</label>
                        <input
                          value={icon}
                          onChange={(e) => patchStat({ icon: e.target.value.slice(0, 8) })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-2 text-center text-lg"
                          placeholder="✨"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Título</label>
                        <input
                          value={label}
                          onChange={(e) => patchStat({ label: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="Potencial de crescimento"
                        />
                      </div>
                    </div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Valor</label>
                    <input
                      value={value}
                      onChange={(e) => patchStat({ value: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="+39%"
                    />
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Barra ({Math.min(100, Math.max(0, Math.round(barPct)))}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.min(100, Math.max(0, Math.round(barPct)))}
                      onChange={(e) => patchStat({ barPct: Number(e.target.value) || 0 })}
                      className="h-2 w-full cursor-pointer accent-orange-500"
                    />
                  </div>
                )
              })}
            </div>
          )}

          {section === 'result_footer' && (
            <>
              <label className="block text-xs font-medium text-slate-600">Texto abaixo do botão</label>
              <input
                value={hero.resultAfterWhatsappText ?? ''}
                onChange={(e) => onHeroPatch({ resultAfterWhatsappText: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <label className="block text-xs font-medium text-slate-600">Rodapé pequeno</label>
              <input
                value={hero.resultFooterSmallText ?? ''}
                onChange={(e) => onHeroPatch({ resultFooterSmallText: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </>
          )}
        </div>

        <div className="border-t border-orange-100 p-4 space-y-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-lg hover:bg-orange-600 disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving ? 'A guardar…' : 'Guardar alterações'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Fechar sem guardar
          </button>
        </div>
      </aside>
    </>
  )
}
