'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { SITE_GUTTER_X } from '@/lib/siteLayout'
import { toast } from 'sonner'

type Quiz = {
  id: string
  title: string
  slug: string
  logo_url: string | null
  is_published?: boolean
  intro_title: string | null
  intro_description: string | null
  thanks_title: string | null
  thanks_description: string | null
  thanks_badge_emoji: string | null
  thanks_badge_text: string | null
  thanks_title_top: string | null
  thanks_title_bottom: string | null
  thanks_highlights: unknown
  thanks_callout_title: string | null
  thanks_callout_text: string | null
  hero_badge_emoji: string | null
  hero_badge_text: string | null
  hero_title_top: string | null
  hero_title_bottom: string | null
  hero_description: string | null
  hero_floating_items: unknown
  start_button_label: string | null
  social_proof_text: string | null
}

type Question = {
  id: string
  order: number
  title: string
  description: string | null
  emoji?: string | null
  kind: 'select' | 'short_text' | 'long_text'
  required: boolean
  options: unknown
  placeholder: string | null
}

type SelectOption = { emoji?: string; title?: string; description?: string }

function asOptions(options: unknown): SelectOption[] {
  if (!Array.isArray(options)) return []
  const out: SelectOption[] = []
  for (const x of options) {
    if (typeof x === 'string') {
      const t = x.trim()
      if (t) out.push({ title: t })
      continue
    }
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const titleRaw = typeof o.title === 'string' ? o.title : (typeof o.label === 'string' ? o.label : '')
    const title = titleRaw.trim()
    if (!title) continue
    const description = typeof o.description === 'string' ? o.description : undefined
    const emoji = typeof o.emoji === 'string' ? o.emoji : undefined
    out.push({ emoji, title, description })
  }
  return out
}

type FloatingItem = { emoji: string; label: string }

function asFloatingItems(v: unknown): FloatingItem[] {
  if (!Array.isArray(v)) return []
  const out: FloatingItem[] = []
  for (const x of v) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const emoji = typeof o.emoji === 'string' ? o.emoji.trim() : ''
    const label = typeof o.label === 'string' ? o.label.trim() : (typeof o.title === 'string' ? o.title.trim() : '')
    if (!emoji || !label) continue
    out.push({ emoji, label })
  }
  return out.slice(0, 3)
}

type HighlightItem = { emoji: string; label: string; value: string }

function asHighlights(v: unknown): HighlightItem[] {
  if (!Array.isArray(v)) return []
  const out: HighlightItem[] = []
  for (const x of v) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const emoji = typeof o.emoji === 'string' ? o.emoji.trim() : ''
    const label = typeof o.label === 'string' ? o.label.trim() : ''
    const value = typeof o.value === 'string' ? o.value.trim() : ''
    if (!emoji || !label || !value) continue
    out.push({ emoji, label, value })
  }
  return out.slice(0, 3)
}

export default function PublicQuizPage() {
  const params = useParams()
  const search = useSearchParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [step, setStep] = useState<'intro' | number | 'processing' | 'done'>('intro')
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [isOwnerPreview, setIsOwnerPreview] = useState(false)
  const [brandName, setBrandName] = useState<string | null>(null)
  const [processingPct, setProcessingPct] = useState(0)

  const orderedQuestions = useMemo(
    () => questions.slice().sort((a, b) => a.order - b.order),
    [questions]
  )

  const utm = useMemo(() => {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
    const out: Record<string, string> = {}
    for (const k of keys) {
      const v = search.get(k)
      if (v) out[k] = v
    }
    return out
  }, [search])

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/q/${slug}`, { cache: 'no-store' })
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(data.error || 'Quiz não encontrado')
        }
        const data = (await res.json()) as { quiz: Quiz; questions: Question[]; isOwner?: boolean; brandName?: string | null }
        setQuiz(data.quiz)
        setQuestions(Array.isArray(data.questions) ? data.questions : [])
        setIsOwnerPreview(Boolean(data.isOwner))
        setBrandName(typeof data.brandName === 'string' && data.brandName.trim() ? data.brandName.trim() : null)
        setStep('intro')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar quiz')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [slug])

  const currentIndex = typeof step === 'number' ? step : null
  const currentQuestion = currentIndex != null ? orderedQuestions[currentIndex] : null
  const total = orderedQuestions.length
  const progress = typeof step === 'number' && total > 0 ? Math.round(((step + 1) / total) * 100) : 0
  const isLastQuestion = typeof step === 'number' && total > 0 && step === total - 1

  const UI = {
    bg: '#F9F1E8',
    surface: '#FFFFFF',
    border: '#E8DDCF',
    text: '#1F2937',
    muted: '#7C6F66',
    accent: '#D98E43',
    accentSoft: '#F3DCC4',
    shadow: '0 12px 36px rgba(30, 41, 59, 0.1)',
  }

  const canNext = () => {
    if (step === 'intro') return true
    if (currentIndex == null || !currentQuestion) return false
    if (!currentQuestion.required) return true
    const v = answers[currentQuestion.id]
    if (currentQuestion.kind === 'select') return typeof v === 'string' && v.trim().length > 0
    return typeof v === 'string' && v.trim().length > 0
  }

  const next = () => {
    if (step === 'intro') {
      setStep(total > 0 ? 0 : 'done')
      return
    }
    if (currentIndex == null) return
    if (currentIndex + 1 >= total) {
      finalize()
      return
    }
    setStep(currentIndex + 1)
  }

  const back = () => {
    if (step === 'intro') return
    if (step === 'done') {
      setStep(total > 0 ? total - 1 : 'intro')
      return
    }
    if (currentIndex == null) return
    if (currentIndex === 0) setStep('intro')
    else setStep(currentIndex - 1)
  }

  const submit = async (): Promise<boolean> => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/q/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, utm }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar')
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const finalize = async () => {
    setProcessingPct(0)
    setStep('processing')

    const minAnimMs = 5000
    const animateDone = new Promise<void>((resolve) => {
      const start = Date.now()
      const t = window.setInterval(() => {
        const elapsed = Date.now() - start
        const pct = Math.min(100, Math.round((elapsed / minAnimMs) * 100))
        setProcessingPct(pct)
        if (pct >= 100) {
          window.clearInterval(t)
          resolve()
        }
      }, 35)
    })

    const [ok] = await Promise.all([submit(), animateDone])
    if (ok) setStep('done')
    else setStep(total > 0 ? total - 1 : 'intro')
  }

  useEffect(() => {
    if (step !== 'processing') return
    setProcessingPct(0)
    return
  }, [step])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: UI.bg }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: UI.muted }} />
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: UI.bg }}>
        <div className="rounded-2xl shadow-sm p-8 max-w-md w-full text-center border" style={{ backgroundColor: UI.surface, borderColor: UI.border }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FEE2E2' }}>
            <AlertCircle className="w-8 h-8" style={{ color: '#DC2626' }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: UI.text }}>Quiz indisponível</h1>
          <p style={{ color: UI.muted }}>{error || 'O quiz solicitado não foi encontrado.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 sm:py-10" style={{ backgroundColor: UI.bg }}>
      <style jsx>{`
        @keyframes plify-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes plify-float-soft {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(0.8deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>
      <div className={cn('mx-auto max-w-[720px]', SITE_GUTTER_X)}>
        {/* Barra superior + progresso (só nas perguntas) */}
        {typeof step === 'number' ? (
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl border flex items-center justify-center"
                style={{
                  borderColor: '#F3DCC4',
                  backgroundColor: 'rgba(255, 247, 237, 0.85)',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.06)',
                }}
                onClick={back}
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" style={{ color: UI.text }} />
              </button>
              <div className="min-w-0 flex-1 text-center px-2">
                {quiz.logo_url ? (
                  <div className="flex justify-center">
                    <Image
                      src={quiz.logo_url}
                      alt=""
                      width={220}
                      height={72}
                      className="h-9 sm:h-10 w-auto object-contain"
                      priority={false}
                    />
                  </div>
                ) : (
                  <p className="text-[15px] sm:text-lg font-bold uppercase leading-snug tracking-wide" style={{ color: UI.accent }}>
                    {brandName || 'PLIFY'}
                  </p>
                )}
              </div>
              <div className="w-10" aria-hidden />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs font-medium" style={{ color: UI.muted }}>
              <span>{`Pergunta ${step + 1} de ${total}`}</span>
              <span>{`${progress}%`}</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full" style={{ backgroundColor: UI.accentSoft }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor: UI.accent,
                }}
              />
            </div>
          </div>
        ) : null}

        {isOwnerPreview && quiz.is_published === false ? (
          <div className="mb-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: '#F5D0A8', backgroundColor: '#FFF7ED', color: '#9A3412' }}>
            Este quiz está em <strong>rascunho</strong>. Só você consegue visualizar. Para liberar o link na bio, marque como{' '}
            <strong>Publicado</strong> no dashboard.
          </div>
        ) : null}

        <div
          className={cn(
            step === 'intro' || typeof step === 'number' || step === 'processing' || step === 'done'
              ? 'rounded-3xl border-0 p-0 sm:p-0'
              : 'rounded-3xl border p-7 sm:p-10'
          )}
          style={
            step === 'intro' || typeof step === 'number' || step === 'processing' || step === 'done'
              ? { backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: 'none' }
              : { backgroundColor: UI.surface, borderColor: UI.border, boxShadow: UI.shadow }
          }
        >
          {step === 'intro' ? (
            <div className="space-y-5 py-2 sm:py-6">
              <div className="flex flex-col items-center">
                {quiz.logo_url ? (
                  <div className="flex justify-center pb-2" style={{ animation: 'plify-float 3.4s ease-in-out infinite' }}>
                    <Image
                      src={quiz.logo_url}
                      alt=""
                      width={360}
                      height={180}
                      className="h-[9rem] sm:h-[10.5rem] w-auto max-w-[336px] sm:max-w-[448px] object-contain"
                    />
                  </div>
                ) : null}

                {quiz.hero_badge_emoji || quiz.hero_badge_text ? (
                  <div
                    className="mt-1 inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm"
                    style={{
                      borderColor: '#F3DCC4',
                      backgroundColor: 'rgba(255, 247, 237, 0.7)',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    {quiz.hero_badge_emoji ? (
                      <span className="text-lg leading-none" aria-hidden style={{ color: UI.accent }}>
                        {quiz.hero_badge_emoji}
                      </span>
                    ) : null}
                    <span className="font-medium" style={{ color: UI.accent }}>
                      {(quiz.hero_badge_text || '').trim()}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="pt-1">
                <h2 className="text-center text-[28px] sm:text-[40px] font-black leading-[1.05] tracking-tight px-2">
                  <span style={{ color: UI.text, fontWeight: 900 }}>
                    {(quiz.hero_title_top || quiz.intro_title || 'Vamos começar?').trim()}
                  </span>
                  {((quiz.hero_title_bottom || '').trim().length > 0) ? (
                    <>
                      <br />
                      <span style={{ color: UI.accent, fontWeight: 900 }}>
                        {(quiz.hero_title_bottom || '').trim()}
                      </span>
                    </>
                  ) : null}
                </h2>
              </div>

              {(quiz.hero_description || quiz.intro_description) ? (
                <p className="text-center text-sm sm:text-[15px] leading-relaxed px-1 max-w-[520px] mx-auto" style={{ color: UI.muted }}>
                  {(quiz.hero_description || quiz.intro_description || '').trim()}
                </p>
              ) : null}

              {asFloatingItems(quiz.hero_floating_items).length > 0 ? (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {asFloatingItems(quiz.hero_floating_items).map((it, idx) => (
                    <div
                      key={`${idx}-${it.emoji}-${it.label}`}
                      className="rounded-2xl border bg-white px-4 py-4 text-center"
                      style={{
                        borderColor: UI.border,
                        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
                        animation: 'plify-float-soft 3.6s ease-in-out infinite',
                        animationDelay: `${idx * 140}ms`,
                      }}
                    >
                      <div
                        className="mx-auto mb-2 h-11 w-11 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: '#F7F0E9', border: `1px solid ${UI.border}` }}
                        aria-hidden
                      >
                        <span className="text-2xl leading-none">{it.emoji}</span>
                      </div>
                      <p className="text-sm font-semibold leading-snug" style={{ color: UI.text }}>
                        {it.label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={next}
                  className="h-14 w-full max-w-md rounded-[1.125rem] text-[17px] font-semibold shadow-md active:translate-y-[1px]"
                  style={{
                    backgroundColor: UI.accent,
                    color: 'white',
                    boxShadow: '0 14px 28px rgba(217, 142, 67, 0.38)',
                  }}
                >
                  {(quiz.start_button_label || 'Iniciar').trim()}
                </button>
              </div>

              {quiz.social_proof_text ? (
                <p className="text-center text-xs sm:text-sm" style={{ color: UI.muted }}>
                  {quiz.social_proof_text}
                </p>
              ) : null}
            </div>
          ) : step === 'processing' ? (
            <div className="min-h-[64vh] flex flex-col items-center justify-center py-8 sm:py-10">
              {quiz.logo_url ? (
                <div className="flex justify-center mb-6">
                  <Image
                    src={quiz.logo_url}
                    alt=""
                    width={360}
                    height={180}
                    className="h-[9rem] sm:h-[10.5rem] w-auto max-w-[336px] sm:max-w-[448px] object-contain"
                    priority={false}
                  />
                </div>
              ) : null}

              <div className="flex items-center justify-center">
                <div
                  className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-full"
                  style={{
                    background: `conic-gradient(${UI.accent} ${processingPct * 3.6}deg, rgba(217, 142, 67, 0.18) 0deg)`,
                  }}
                >
                  <div
                    className="absolute inset-[12px] rounded-full flex items-center justify-center"
                    style={{ backgroundColor: UI.bg }}
                  >
                    <span className="text-2xl sm:text-3xl font-black" style={{ color: UI.accent }}>
                      {processingPct}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4 text-base sm:text-lg">
                <div className="flex items-center gap-3 transition-opacity" style={{ opacity: 1, transition: 'opacity 220ms ease' }}>
                  <span className="text-2xl" aria-hidden>🔎</span>
                  <span className="font-medium" style={{ color: UI.text }}>
                    Analisando suas respostas
                  </span>
                  {processingPct >= 35 ? <CheckCircle className="h-5 w-5" style={{ color: UI.accent }} /> : null}
                </div>
                <div
                  className="flex items-center gap-3 transition-opacity"
                  style={{ opacity: processingPct < 35 ? 0.45 : 1, transition: 'opacity 220ms ease' }}
                >
                  <span className="text-2xl" aria-hidden>💡</span>
                  <span className="font-medium" style={{ color: UI.text }}>
                    Identificando oportunidades
                  </span>
                  {processingPct >= 70 ? <CheckCircle className="h-5 w-5" style={{ color: UI.accent }} /> : null}
                </div>
                <div
                  className="flex items-center gap-3 transition-opacity"
                  style={{ opacity: processingPct < 70 ? 0.45 : 1, transition: 'opacity 220ms ease' }}
                >
                  <span className="text-2xl" aria-hidden>🚀</span>
                  <span className="font-medium" style={{ color: UI.text }}>
                    Criando seu plano personalizado
                  </span>
                  {processingPct >= 95 ? <CheckCircle className="h-5 w-5" style={{ color: UI.accent }} /> : null}
                </div>
              </div>
            </div>
          ) : step === 'done' ? (
            <div className="space-y-0 py-0 sm:py-0">
              <div className="flex flex-col items-center">
                {quiz.logo_url ? (
                  <div className="flex justify-center">
                    <Image
                      src={quiz.logo_url}
                      alt=""
                      width={360}
                      height={180}
                      className="h-[9rem] sm:h-[10.5rem] w-auto max-w-[336px] sm:max-w-[448px] object-contain"
                      priority={false}
                    />
                  </div>
                ) : null}

                {quiz.thanks_badge_emoji || quiz.thanks_badge_text ? (
                  <div
                    className="mt-0 inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm"
                    style={{
                      borderColor: '#F3DCC4',
                      backgroundColor: 'rgba(255, 247, 237, 0.75)',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    {quiz.thanks_badge_emoji ? (
                      <span className="text-lg leading-none" aria-hidden style={{ color: UI.accent }}>
                        {quiz.thanks_badge_emoji}
                      </span>
                    ) : null}
                    <span className="font-medium" style={{ color: UI.accent }}>
                      {(quiz.thanks_badge_text || '').trim()}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="pt-0">
                <h2 className="text-center text-[28px] sm:text-[40px] font-black leading-[1.05] tracking-tight px-2">
                  <span style={{ color: UI.text, fontWeight: 900 }}>
                    {(quiz.thanks_title_top || quiz.thanks_title || 'Obrigado!').trim()}
                  </span>
                  {((quiz.thanks_title_bottom || '').trim().length > 0) ? (
                    <>
                      <br />
                      <span style={{ color: UI.accent, fontWeight: 900 }}>
                        {(quiz.thanks_title_bottom || '').trim()}
                      </span>
                    </>
                  ) : null}
                </h2>
              </div>

              {(quiz.thanks_description || quiz.thanks_callout_text) ? (
                <p className="text-center text-sm sm:text-[15px] leading-relaxed px-1 max-w-[560px] mx-auto" style={{ color: UI.muted }}>
                  {(quiz.thanks_description || '').trim()}
                </p>
              ) : null}

              {asHighlights(quiz.thanks_highlights).length > 0 ? (
                <div className="pt-2 space-y-3">
                  {asHighlights(quiz.thanks_highlights).map((it, idx) => (
                    <div
                      key={`${idx}-${it.label}`}
                      className="rounded-2xl border px-5 py-4 bg-white/40"
                      style={{
                        borderColor: '#F3DCC4',
                        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: 'rgba(255, 247, 237, 0.9)', border: '1px solid #F3DCC4' }}
                            aria-hidden
                          >
                            <span className="text-xl leading-none">{it.emoji}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: UI.muted }}>{it.label}</p>
                            <p className="text-xl font-black" style={{ color: UI.text }}>{it.value}</p>
                          </div>
                        </div>
                        <div className="h-2 w-20 rounded-full" style={{ backgroundColor: 'rgba(217, 142, 67, 0.22)' }}>
                          <div className="h-2 rounded-full" style={{ width: '72%', backgroundColor: UI.accent }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {(quiz.thanks_callout_title || quiz.thanks_callout_text) ? (
                <div
                  className="mt-2 rounded-2xl border px-6 py-5 bg-white/35"
                  style={{
                    borderColor: '#F3DCC4',
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  {quiz.thanks_callout_title ? (
                    <p className="text-[15px] font-semibold text-center" style={{ color: UI.text }}>
                      {quiz.thanks_callout_title}
                    </p>
                  ) : null}
                  {quiz.thanks_callout_text ? (
                    <p className="text-sm text-center mt-2" style={{ color: UI.muted }}>
                      {quiz.thanks_callout_text}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="pt-1 text-center text-sm" style={{ color: UI.muted }}>
                  Suas respostas foram registradas.
                </div>
              )}
            </div>
          ) : currentQuestion ? (
            <div className="space-y-4 py-2 sm:py-4">
              <div>
                {currentQuestion.emoji ? (
                  <div className="mb-2">
                    <span className="text-2xl leading-none" aria-hidden>{currentQuestion.emoji}</span>
                  </div>
                ) : null}
                <h2 className="text-[22px] sm:text-[26px] font-semibold leading-tight" style={{ color: UI.text }}>
                  {currentQuestion.title}{' '}
                  {currentQuestion.required ? <span className="text-red-500">*</span> : null}
                </h2>
                {currentQuestion.description ? (
                  <p className="text-sm mt-2" style={{ color: UI.muted }}>{currentQuestion.description}</p>
                ) : null}
              </div>

              {currentQuestion.kind === 'select' ? (
                <div className="grid grid-cols-1 gap-3">
                  {asOptions(currentQuestion.options).map((opt, idx) => {
                    const value = (opt.title || '').trim()
                    const active = answers[currentQuestion.id] === value
                    return (
                      <button
                        key={`${idx}-${value}`}
                        type="button"
                        className="rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 text-left transition-colors flex items-center justify-between bg-white"
                        style={{
                          borderColor: active ? UI.accent : UI.border,
                          backgroundColor: UI.surface,
                          boxShadow: active ? '0 0 0 3px rgba(217,138,58,0.18)' : '0 6px 16px rgba(15, 23, 42, 0.06)',
                        }}
                        onClick={() => setAnswers((p) => ({ ...p, [currentQuestion.id]: value }))}
                      >
                        <div className="min-w-0 flex items-start gap-3">
                          {opt.emoji ? (
                            <div
                              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: '#F7F0E9', border: `1px solid ${UI.border}` }}
                              aria-hidden
                            >
                              <span className="text-xl leading-none">{opt.emoji}</span>
                            </div>
                          ) : null}
                          <div className="min-w-0">
                            <p className="font-semibold truncate text-[15px] sm:text-base" style={{ color: UI.text }}>{value}</p>
                            {opt.description ? (
                              <p className="text-[12px] sm:text-xs mt-0.5 truncate" style={{ color: UI.muted }}>
                                {opt.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <span
                          className="h-5 w-5 rounded-full border flex items-center justify-center shrink-0"
                          style={{ borderColor: active ? UI.accent : UI.border }}
                        >
                          {active ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: UI.accent }} /> : null}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : currentQuestion.kind === 'long_text' ? (
                <Textarea
                  className="rounded-2xl border-slate-200 focus-visible:ring-slate-300"
                  style={{ backgroundColor: '#F8FAFC', color: '#0F172A', caretColor: '#0F172A' }}
                  rows={5}
                  value={(answers[currentQuestion.id] as string) || ''}
                  onChange={(e) => setAnswers((p) => ({ ...p, [currentQuestion.id]: e.target.value }))}
                  placeholder={currentQuestion.placeholder || 'Digite sua resposta...'}
                />
              ) : (
                <Input
                  className="rounded-2xl border-slate-200 focus-visible:ring-slate-300"
                  style={{ backgroundColor: '#F8FAFC', color: '#0F172A', caretColor: '#0F172A' }}
                  value={(answers[currentQuestion.id] as string) || ''}
                  onChange={(e) => setAnswers((p) => ({ ...p, [currentQuestion.id]: e.target.value }))}
                  placeholder={currentQuestion.placeholder || 'Digite sua resposta...'}
                />
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={next}
                  disabled={!canNext()}
                  className="h-14 w-full rounded-2xl font-semibold disabled:cursor-not-allowed flex items-center justify-center"
                  style={{
                    backgroundColor: canNext() ? UI.accent : '#E5E7EB',
                    color: canNext() ? 'white' : '#9CA3AF',
                    boxShadow: canNext() ? '0 10px 20px rgba(217,138,58,0.25)' : undefined,
                  }}
                >
                  {isLastQuestion ? 'Finalizar →' : 'Continuar →'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: UI.muted }}>Sem perguntas.</div>
          )}
        </div>
      </div>
    </div>
  )
}

