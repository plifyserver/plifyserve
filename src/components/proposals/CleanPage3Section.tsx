'use client'

import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CleanPage3 } from '@/types/cleanProposal'

const CAROUSEL_INTERVAL_MS = 4000

function keywordLine(s: string) {
  const x = s.trim()
  if (!x) return null
  const text = x.replace(/^\*\s*/, '').trim()
  return text.length > 0 ? text : null
}

type TopBarProps = {
  logoSrc: string | null
  companyName: string
  contactLabel: string
  onContact: () => void
}

export function CleanTopBar({ logoSrc, companyName, contactLabel, onContact }: TopBarProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-8 sm:py-6">
      <div className="min-w-0 flex-1">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={companyName || 'Logo'}
            className="h-8 w-auto max-w-[200px] object-contain sm:h-9"
          />
        ) : (
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Logo</span>
        )}
      </div>
      <button
        type="button"
        onClick={onContact}
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/10"
      >
        {contactLabel}
        <Menu className="h-4 w-4 opacity-90" strokeWidth={2} />
      </button>
    </header>
  )
}

function CleanCarousel({ images }: { images: string[] }) {
  const n = images.length
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (n < 3) return
    if (n <= 3) return
    const id = window.setInterval(() => {
      setOffset((o) => (o + 1) % n)
    }, CAROUSEL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [n])

  if (n < 3) {
    return (
      <div className="flex min-h-[220px] w-full items-center justify-center border border-white/10 bg-zinc-950/80 px-6 py-12 text-center text-sm text-zinc-500">
        Adicione pelo menos 3 imagens no carrossel (editor — página 3).
      </div>
    )
  }

  const triple = [0, 1, 2].map((i) => images[(offset + i) % n])

  return (
    <div className="w-full overflow-hidden">
      <div
        className="grid gap-3 sm:gap-4 md:grid-cols-3"
        style={{ transition: 'opacity 0.35s ease' }}
        key={offset}
      >
        {triple.map((src, i) => (
          <div key={`${offset}-${i}-${src}`} className="relative aspect-[3/4] overflow-hidden bg-zinc-900">
            <img
              src={src}
              alt=""
              className="h-full w-full object-contain"
              draggable={false}
              decoding="async"
            />
          </div>
        ))}
      </div>
      {n > 3 ? (
        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: n }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                i === offset ? 'bg-white' : 'bg-white/25'
              )}
              aria-hidden
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

type Props = {
  page: CleanPage3
}

export function CleanPage3Section({ page }: Props) {
  const kws = page.keywords.map(keywordLine).filter(Boolean) as string[]

  return (
    <section id="clean-pagina-3" className="w-full bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 lg:items-start">
          <div className="lg:col-span-4">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
              {page.sectionTitle}
            </h2>
          </div>
          <div className="lg:col-span-8">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85 sm:text-base">
              {page.summary}
            </p>
            {kws.length > 0 ? (
              <ul className="mt-8 space-y-3">
                {kws.map((line, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/90 sm:text-base">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="mt-16 sm:mt-20">
          <CleanCarousel images={page.carouselImages} />
        </div>
      </div>
    </section>
  )
}
