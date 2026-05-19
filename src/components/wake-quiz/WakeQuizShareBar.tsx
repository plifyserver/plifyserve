'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, ListChecks, Loader2, RefreshCw, Save } from 'lucide-react'
import { WAKE_QUIZ_SLUG_MAX_LENGTH, WAKE_QUIZ_SLUG_MIN_LENGTH } from '@/lib/wakeQuizSlug'

type ShareBarProps = {
  onEditQuestions?: () => void
}

type PublicLinkJson = {
  slug?: string
  url?: string | null
  path?: string
  error?: string
}

/** Barra superior: link público para copiar + atalho ao CRM. */
export function WakeQuizShareBar(props?: ShareBarProps) {
  const onEditQuestions = props?.onEditQuestions
  const [href, setHref] = useState('')
  const [slugDraft, setSlugDraft] = useState('')
  const [savedSlug, setSavedSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadLink = useCallback(async () => {
    const res = await fetch('/api/dashboard/wake-quiz/public-link', { credentials: 'include' })
    const data = (await res.json()) as PublicLinkJson
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao carregar link')
    }
    const fallback =
      typeof window !== 'undefined' && typeof data.path === 'string'
        ? `${window.location.origin}${data.path}`
        : ''
    const next =
      typeof data.url === 'string' && data.url.length > 0 ? data.url : fallback || ''
    const slug = typeof data.slug === 'string' ? data.slug : ''
    return { next, slug }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { next, slug } = await loadLink()
        if (!cancelled) {
          setHref(next)
          setSlugDraft(slug)
          setSavedSlug(slug)
        }
      } catch (e) {
        if (!cancelled) {
          setHref('')
          setSlugDraft('')
          setSavedSlug('')
          toast.error(e instanceof Error ? e.message : 'Erro ao carregar link público.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadLink])

  const originPrefix = (() => {
    if (!href) {
      return typeof window !== 'undefined' ? window.location.origin : ''
    }
    try {
      const u = new URL(href)
      return `${u.protocol}//${u.host}`
    } catch {
      return typeof window !== 'undefined' ? window.location.origin : ''
    }
  })()

  const copy = async () => {
    if (!href) {
      toast.error('Link indisponível.')
      return
    }
    try {
      await navigator.clipboard.writeText(href)
      toast.success('Link copiado.')
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente.')
    }
  }

  const persistSlug = async (body: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/wake-quiz/public-link', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as PublicLinkJson
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível guardar.')
      }
      const fallback =
        typeof window !== 'undefined' && typeof data.path === 'string'
          ? `${window.location.origin}${data.path}`
          : ''
      const next =
        typeof data.url === 'string' && data.url.length > 0 ? data.url : fallback || ''
      const slug = typeof data.slug === 'string' ? data.slug : ''
      setHref(next)
      setSlugDraft(slug)
      setSavedSlug(slug)
      toast.success('Link atualizado.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  const saveCustomSlug = async () => {
    const trimmed = slugDraft.trim()
    if (trimmed === savedSlug) {
      toast.info('Nenhuma alteração no identificador.')
      return
    }
    await persistSlug({ slug: trimmed })
  }

  const generateNewRandomSlug = async () => {
    const ok =
      typeof window !== 'undefined'
        ? window.confirm(
            'O link atual deixará de funcionar (quem tiver o antigo na bio verá erro). Gerar um novo identificador curto?'
          )
        : true
    if (!ok) return
    await persistSlug({ random: true })
  }

  const slugDirty = slugDraft.trim() !== savedSlug

  return (
    <div className="sticky top-3 z-[100] px-3 pt-3 mb-4 sm:mb-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-2xl border border-orange-100/90 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">Link para colocar na bio do Instagram</p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
            Utilize esse recurso para atrair mais clientes colocando em sua bio do instagram. Pode
            escolher um identificador curto (único em toda a plataforma).
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-orange-100/80 bg-orange-50/40 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-900/70">
            Identificador do link
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center">
              <span className="shrink-0 text-[11px] text-slate-500 sm:max-w-[min(48%,220px)] sm:truncate">
                {loading ? '…' : `${originPrefix}/q/wake/`}
              </span>
              <input
                type="text"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={WAKE_QUIZ_SLUG_MAX_LENGTH}
                disabled={loading || saving}
                aria-label="Identificador do link do quiz"
                placeholder="ex.: fenix-quiz"
                value={loading ? '' : slugDraft}
                onChange={(e) => setSlugDraft(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-orange-200/80 bg-white px-2.5 py-2 font-mono text-[12px] text-slate-800 outline-none focus:border-orange-400 disabled:opacity-60"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveCustomSlug()}
                disabled={loading || saving || !slugDirty}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Guardar identificador
              </button>
              <button
                type="button"
                onClick={() => void generateNewRandomSlug()}
                disabled={loading || saving}
                title="Substitui por um código curto aleatório (o link antigo deixa de funcionar)"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-3 py-2 text-[11px] font-semibold text-orange-800 shadow-sm hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
              >
                <RefreshCw className="size-3.5" />
                Novo aleatório curto
              </button>
            </div>
          </div>
          <p className="text-[10px] leading-snug text-slate-500">
            {WAKE_QUIZ_SLUG_MIN_LENGTH}–{WAKE_QUIZ_SLUG_MAX_LENGTH} caracteres: letras, números e
            hífen; começar com letra. Não pode ser igual ao de outra conta.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex w-full items-center gap-2 rounded-xl border border-orange-100/90 bg-white/95 px-2 py-1 shadow-sm sm:w-[min(520px,52vw)] sm:max-w-full">
            <input
              readOnly
              aria-label="Link público completo do quiz"
              title={href || 'Gerando…'}
              value={loading ? 'Carregando link…' : href || '—'}
              className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-[11px] text-slate-700 outline-none focus:ring-0 sm:text-xs"
            />
            <button
              type="button"
              onClick={() => void copy()}
              disabled={loading || !href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Copiar link
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            {typeof onEditQuestions === 'function' ? (
              <button
                type="button"
                onClick={onEditQuestions}
                className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-white/95 px-3 py-2.5 text-center text-xs font-semibold text-orange-800 shadow-sm hover:bg-orange-50 sm:w-auto"
              >
                <ListChecks className="size-4" />
                Perguntas
              </button>
            ) : null}
            <Link
              href="/dashboard/quiz/crm"
              className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-white/95 px-3 py-2.5 text-center text-xs font-semibold text-orange-700 shadow-sm hover:bg-orange-50 sm:w-auto"
            >
              <ClipboardList className="size-4" />
              CRM — Leads
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
