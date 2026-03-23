'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { CleanPage4 } from '@/types/cleanProposal'
function columnHeadingLine(col: CleanPage4['columns'][number]) {
  const pref = col.prefix.trim()
  const pfx = pref.endsWith('.') ? pref.slice(0, -1) : pref
  return `${pfx}. ${col.title}`.trim()
}

function RevealOnScroll({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode
  className?: string
  delayMs?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true)
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'will-change-transform transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10',
        className
      )}
      style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

function ImageSlot({ url, alt, emptyLabel }: { url: string | null; alt: string; emptyLabel: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
        decoding="async"
      />
    )
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/[0.04] px-4 text-center text-xs text-white/35">
      {emptyLabel}
    </div>
  )
}

type Props = {
  id?: string
  page: CleanPage4
}

export function CleanPage4Section({ id = 'clean-pagina-4', page }: Props) {
  return (
    <section id={id} className="w-full bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-14">
        <h2 className="max-w-[min(42rem,100%)] text-balance text-[clamp(1.85rem,5.2vw,3.35rem)] font-bold leading-[1.1] tracking-[-0.02em] text-white">
          {page.introHeadline}
        </h2>

        <div className="mt-16 grid gap-12 sm:mt-[4.5rem] sm:grid-cols-2 lg:mt-24 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-14">
          {page.columns.map((col, i) => (
            <div key={i} className="text-left">
              <h3 className="text-base font-bold tracking-tight text-white sm:text-lg">{columnHeadingLine(col)}</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-[0.9375rem]">{col.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 space-y-5 sm:mt-28 sm:space-y-6">
          <RevealOnScroll>
            <div className="relative min-h-[180px] overflow-hidden rounded-sm border border-white/10 bg-white/[0.02] aspect-[2/1] sm:min-h-[220px] lg:aspect-[2.2/1]">
              <ImageSlot
                url={page.largeImageUrl}
                alt=""
                emptyLabel="Imagem grande (editor — Pág. 4)"
              />
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <RevealOnScroll delayMs={90}>
              <div className="relative overflow-hidden rounded-sm border border-white/10 bg-white/[0.02] aspect-square min-h-[200px]">
                <ImageSlot url={page.bottomLeftImageUrl} alt="" emptyLabel="Imagem inferior esquerda" />
              </div>
            </RevealOnScroll>
            <RevealOnScroll delayMs={180}>
              <div className="relative overflow-hidden rounded-sm border border-white/10 bg-white/[0.02] aspect-square min-h-[200px]">
                <ImageSlot url={page.bottomRightImageUrl} alt="" emptyLabel="Imagem inferior direita" />
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  )
}
