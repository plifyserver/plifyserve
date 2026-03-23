'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { EmpresarialPage2, EmpresarialSiteMode } from '@/types/empresarialProposal'
import { mergeEmpresarialPage2 } from '@/types/empresarialProposal'
import { getEmpresarialSiteVisual } from '@/lib/empresarialSiteTheme'

function RevealCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setOn(true)
      },
      { threshold: 0.12, rootMargin: '0px 0px -4% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [el])
  return (
    <div
      ref={setEl}
      className={cn(
        'transition-[opacity,transform] duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        on
          ? 'translate-y-0 scale-100 opacity-100'
          : 'translate-y-14 scale-[0.97] opacity-0',
        'motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100',
        className
      )}
    >
      {children}
    </div>
  )
}

function CardStepBadge({
  index,
  accentColor,
  className,
}: {
  index: number
  accentColor: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full text-base font-bold shadow-lg md:right-4 md:top-4 md:h-12 md:w-12 md:text-lg',
        className
      )}
      style={{
        backgroundColor: accentColor,
        color: '#fff',
        boxShadow: `0 8px 24px -4px ${accentColor}66`,
      }}
      aria-hidden
    >
      {String(index + 1).padStart(2, '0')}
    </span>
  )
}

interface EmpresarialPage2SectionProps {
  siteMode: EmpresarialSiteMode
  raw: unknown
  accentColor?: string
}

export function EmpresarialPage2Section({
  siteMode,
  raw,
  accentColor = '#f97316',
}: EmpresarialPage2SectionProps) {
  const p2: EmpresarialPage2 = mergeEmpresarialPage2(raw)
  const t = getEmpresarialSiteVisual(siteMode).p2
  const rootRef = useRef<HTMLElement>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setEntered(true)
      },
      { threshold: 0.05, rootMargin: '0px 0px -2% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const headlineLines = p2.headline.split('\n').map((l) => l.trim()).filter(Boolean)
  const displayHeadline =
    headlineLines.length > 0 ? headlineLines : [p2.headline.trim() || 'TÍTULO']

  return (
    <section
      ref={rootRef}
      className={cn(t.section, 'relative min-h-[100dvh] scroll-mt-0')}
      aria-label="Trabalhos e processo"
    >
      <div
        className={cn(
          'transition-[opacity,transform,filter] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:duration-300',
          entered
            ? 'translate-y-0 scale-100 opacity-100 blur-0'
            : 'translate-y-20 scale-[0.98] opacity-0 blur-[2px]',
          'motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:blur-none'
        )}
      >
        <div
          className={cn(
            'pointer-events-none flex flex-col items-center justify-center gap-2 py-8 transition-transform duration-700 ease-out',
            entered ? 'translate-y-0 scale-100' : 'translate-y-3 scale-[0.97]',
            'motion-reduce:translate-y-0 motion-reduce:scale-100'
          )}
          style={t.bridgeWrap}
        >
          <div className={cn('h-8 w-px bg-gradient-to-b', t.bridgeLine)} />
          <div
            className={cn(
              'flex flex-col items-center gap-1 text-[10px] font-medium uppercase tracking-[0.2em]',
              entered ? 'animate-bounce' : '',
              t.bridgeHint
            )}
          >
            <span>Role</span>
            <span className={cn('text-lg leading-none', t.bridgeArrow)}>↓</span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 md:px-10 md:pb-28 md:pt-8">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-12 xl:gap-20">
          <div className="lg:sticky lg:top-24 lg:self-start lg:pr-2">
            <div
              className={cn(
                'mb-6 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] md:text-sm',
                t.eyebrowText
              )}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.7)]"
                style={{ backgroundColor: accentColor }}
              />
              {p2.eyebrow}
            </div>
            <h2
              className={cn(
                'text-3xl font-bold uppercase leading-[1.05] tracking-tight md:text-5xl xl:text-6xl',
                t.headline
              )}
            >
              {displayHeadline.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <div className="flex flex-col gap-8 md:gap-10 lg:gap-12">
            {p2.cards.map((card, index) => (
              <RevealCard key={card.id}>
                <article className={t.card}>
                  <div
                    className={cn(
                      'relative aspect-[16/10] w-full overflow-hidden md:aspect-[16/9]',
                      t.cardMediaBg
                    )}
                  >
                    {card.image ? (
                      <>
                        <img
                          src={card.image}
                          alt=""
                          className="h-full w-full object-contain"
                          decoding="async"
                        />
                        <CardStepBadge index={index} accentColor={accentColor} />
                      </>
                    ) : (
                      <div
                        className={cn(
                          'relative flex h-full w-full flex-col items-center justify-center gap-2',
                          t.cardPlaceholder
                        )}
                      >
                        <CardStepBadge index={index} accentColor={accentColor} />
                        <span className="text-xs uppercase tracking-wider">Imagem do serviço</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-5 md:p-6">
                    <h3
                      className={cn(
                        'text-lg font-bold uppercase tracking-wide md:text-xl',
                        t.cardTitle
                      )}
                    >
                      {card.title || `Card ${index + 1}`}
                    </h3>
                    <p className={cn('text-sm leading-relaxed md:text-base', t.cardDesc)}>{card.description}</p>
                  </div>
                </article>
              </RevealCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
  )
}
