'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, ListChecks, Loader2 } from 'lucide-react'

type ShareBarProps = {
  onEditQuestions?: () => void
}

/** Barra superior: link público para copiar + atalho ao CRM. */
export function WakeQuizShareBar(props?: ShareBarProps) {
  const onEditQuestions = props?.onEditQuestions
  const [href, setHref] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/dashboard/wake-quiz/public-link', { credentials: 'include' })
        const data = (await res.json()) as {
          url?: string | null
          path?: string
          error?: string
        }
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao carregar link')
        }
        const fallback =
          typeof window !== 'undefined' && typeof data.path === 'string'
            ? `${window.location.origin}${data.path}`
            : ''
        const next =
          typeof data.url === 'string' && data.url.length > 0 ? data.url : fallback || ''
        if (!cancelled) setHref(next)
      } catch (e) {
        if (!cancelled) {
          setHref('')
          toast.error(e instanceof Error ? e.message : 'Erro ao carregar link público.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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

  return (
    <div className="absolute top-3 left-3 right-3 z-[100]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 rounded-2xl border border-orange-100/90 bg-white/90 p-3 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">Link para colocar na bio do Instagram</p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
            Utilize esse recurso para atrair mais clientes colocando em sua bio do instagram.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <div className="flex w-full items-center gap-2 rounded-xl border border-orange-100/90 bg-white/95 px-2 py-1 shadow-sm sm:w-[min(520px,52vw)]">
            <input
              readOnly
              aria-label="Link público do quiz"
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
  )
}
