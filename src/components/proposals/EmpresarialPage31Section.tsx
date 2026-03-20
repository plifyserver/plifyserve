'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseEmpresarialStatValue } from '@/lib/empresarialStatAnim'
import type { EmpresarialSiteMode } from '@/types/empresarialProposal'
import { mergeEmpresarialPage31 } from '@/types/empresarialProposal'
import type { CSSProperties } from 'react'
import { getEmpresarialSiteVisual } from '@/lib/empresarialSiteTheme'

const STAT_ANIM_MS = 1200
const STAT_STAGGER_MS = 90

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

function EmpresarialAnimatedStatValue({
  value,
  label,
  active,
  delayMs,
  className,
}: {
  value: string
  label: string
  active: boolean
  delayMs: number
  className?: string
}) {
  const parsed = useMemo(() => parseEmpresarialStatValue(value), [value])
  const reducedMotion = usePrefersReducedMotion()
  const [display, setDisplay] = useState(() => {
    const p = parseEmpresarialStatValue(value)
    return p ? p.format(0) : value
  })

  useEffect(() => {
    if (!parsed) {
      setDisplay(value)
      return
    }
    if (reducedMotion) {
      setDisplay(value)
      return
    }
    if (!active) {
      setDisplay(parsed.format(0))
      return
    }

    let raf = 0
    let animStart: number | null = null

    const tick = (ts: number) => {
      if (animStart === null) animStart = ts
      const elapsed = ts - animStart
      if (elapsed < delayMs) {
        setDisplay(parsed.format(0))
        raf = requestAnimationFrame(tick)
        return
      }
      const t = elapsed - delayMs
      const p = Math.min(1, t / STAT_ANIM_MS)
      const eased = 1 - (1 - p) ** 3
      const current = parsed.end * eased
      setDisplay(parsed.format(current))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setDisplay(parsed.format(parsed.end))
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, parsed, value, delayMs, reducedMotion])

  if (!parsed) {
    return (
      <p className={className} aria-label={`${label}: ${value}`}>
        {value}
      </p>
    )
  }

  return (
    <p className={cn('tabular-nums', className)} aria-label={`${label}: ${value}`}>
      {display}
    </p>
  )
}

interface EmpresarialPage31SectionProps {
  siteMode: EmpresarialSiteMode
  raw: unknown
  accentColor?: string
}

export function EmpresarialPage31Section({
  siteMode,
  raw,
  accentColor: _accentColor = '#f97316',
}: EmpresarialPage31SectionProps) {
  const p31 = mergeEmpresarialPage31(raw)
  const t = getEmpresarialSiteVisual(siteMode).p31
  const list = p31.testimonials
  const [idx, setIdx] = useState(0)
  const statsAnchorRef = useRef<HTMLDivElement>(null)
  const [statsVisible, setStatsVisible] = useState(false)

  const len = list.length
  const safeIdx = len > 0 ? idx % len : 0
  const current = len > 0 ? list[safeIdx] : null

  const go = useCallback(
    (dir: -1 | 1) => {
      if (len <= 0) return
      setIdx((i) => (i + dir + len) % len)
    },
    [len]
  )

  useEffect(() => {
    if (len <= 1) return
    const t = window.setInterval(() => setIdx((i) => (i + 1) % len), 4000)
    return () => window.clearInterval(t)
  }, [len])

  useEffect(() => {
    if (!p31.showStats || p31.stats.length === 0) return
    const el = statsAnchorRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true)
          obs.disconnect()
        }
      },
      { root: null, rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [p31.showStats, p31.stats.length])

  const marqueeSec = Math.min(120, Math.max(18, (p31.marqueeText?.length || 20) * 0.12))

  return (
    <section className={t.section} style={t.dotGrid as CSSProperties} aria-label="Números e depoimentos">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        {p31.showStats && p31.stats.length > 0 && (
          <div ref={statsAnchorRef}>
            <div
              className={cn(
                'mb-20 grid gap-10 border-b pb-16 md:gap-12 md:pb-20',
                t.statsBorder,
                p31.stats.length === 1 && 'mx-auto max-w-xs justify-items-center text-center',
                p31.stats.length === 2 && 'grid-cols-2 md:mx-auto md:max-w-2xl',
                p31.stats.length === 3 && 'grid-cols-2 md:grid-cols-3',
                p31.stats.length >= 4 && 'grid-cols-2 lg:grid-cols-4'
              )}
            >
              {p31.stats.map((s, i) => (
                <div key={s.id} className="text-center md:text-left">
                  <EmpresarialAnimatedStatValue
                    value={s.value}
                    label={s.label}
                    active={statsVisible}
                    delayMs={i * STAT_STAGGER_MS}
                    className={cn('text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl', t.statValue)}
                  />
                  <p
                    className={cn(
                      'mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] md:text-xs',
                      t.statLabel
                    )}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {len > 0 && current && (
          <div className="relative mx-auto max-w-3xl px-2 py-8 md:py-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L55 45 L5 45 Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
                backgroundSize: '80px 80px',
              }}
            />
            <div className="relative flex items-stretch gap-2 md:gap-4">
              <button
                type="button"
                onClick={() => go(-1)}
                className={t.testimonialBtn}
                aria-label="Depoimento anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1 px-2 text-center md:px-6">
                <p
                  className={cn(
                    'text-sm font-medium lowercase leading-relaxed md:text-base lg:text-lg',
                    t.quote
                  )}
                >
                  &ldquo;{current.quote}&rdquo;
                </p>
                <p className={cn('mt-6 text-xs font-semibold uppercase tracking-[0.2em]', t.author)}>
                  — {current.clientName}
                </p>
                {len > 1 && (
                  <div
                    className={cn(
                      'mt-8 flex items-center justify-center gap-3 text-[11px] font-medium tabular-nums',
                      t.counter
                    )}
                  >
                    <span>{String(safeIdx + 1).padStart(2, '0')}</span>
                    <span className={cn('h-px w-16', t.counterLine)} />
                    <span>{String(len).padStart(2, '0')}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => go(1)}
                className={t.testimonialBtn}
                aria-label="Próximo depoimento"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {p31.marqueeText.trim() ? (
        <div className={cn('border-t py-6 md:py-8', t.marqueeBar)}>
          <div className="overflow-hidden">
            <div
              className="empresarial-marquee-track text-4xl font-black uppercase tracking-tight text-transparent md:text-6xl lg:text-7xl"
              style={
                {
                  WebkitTextStroke: t.marqueeStroke,
                  ['--marquee-sec' as string]: `${marqueeSec}s`,
                } as CSSProperties
              }
            >
              <span className="px-6">{p31.marqueeText}</span>
              <span className="px-6">{p31.marqueeText}</span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
