'use client'

import type { CSSProperties } from 'react'
import type { EmpresarialSiteMode } from '@/types/empresarialProposal'
import { mergeEmpresarialPage4 } from '@/types/empresarialProposal'
import { EmpresarialDynamicIcon } from '@/components/proposals/EmpresarialDynamicIcon'
import { getEmpresarialSiteVisual } from '@/lib/empresarialSiteTheme'
import { cn } from '@/lib/utils'

interface EmpresarialPage4SectionProps {
  siteMode: EmpresarialSiteMode
  raw: unknown
  accentColor?: string
  onBack: () => void
  /** Mesmo conteúdo da página “Sobre nós” no fluxo principal (sem barra voltar nem altura mínima de viewport) */
  embedded?: boolean
}

export function EmpresarialPage4Section({
  siteMode,
  raw,
  accentColor = '#f97316',
  onBack,
  embedded = false,
}: EmpresarialPage4SectionProps) {
  const p4 = mergeEmpresarialPage4(raw)
  const ev = getEmpresarialSiteVisual(siteMode)
  const t = ev.p4
  const L = ev.isLight
  const headlineLines = p4.headline.split('\n').map((l) => l.trim()).filter(Boolean)
  const displayHeadline =
    headlineLines.length > 0 ? headlineLines : [p4.headline.trim() || 'TÍTULO']

  const marqueeText =
    p4.marqueePhrases.length > 0
      ? p4.marqueePhrases.map((s) => s.toUpperCase()).join('  •  ') + '  •  '
      : ''

  /** Concatena cópias até ~largura mínima — evita faixa vazia em monitores largos (loop -50%). */
  const MARQUEE_MIN_CHARS = 1200
  const MARQUEE_REPEAT_GUARD = 800
  let marqueeLoopSegment = marqueeText
  if (marqueeText.length > 0) {
    let n = 0
    while (marqueeLoopSegment.length < MARQUEE_MIN_CHARS && n < MARQUEE_REPEAT_GUARD) {
      marqueeLoopSegment += marqueeText
      n++
    }
  }

  const marqueeSec = Math.max(
    14,
    Math.min(90, marqueeLoopSegment.length * 0.05)
  )

  const n = p4.quadrants.length

  return (
    <section
      className={cn(
        embedded
          ? L
            ? 'relative flex min-h-0 flex-col overflow-hidden border-t border-slate-200 text-slate-900'
            : 'relative flex min-h-0 flex-col overflow-hidden border-t border-white/10 text-white'
          : t.section
      )}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {p4.backgroundImage ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${p4.backgroundImage})` }}
              aria-hidden
            />
            <div className={cn('absolute inset-0', t.overlayStrong)} aria-hidden />
            <div className={cn('absolute inset-0', t.overlaySoft)} aria-hidden />
          </>
        ) : (
          <div className={cn('absolute inset-0', t.fallbackBg)} aria-hidden />
        )}

        <div
          className={cn(
            'relative z-10 flex min-h-full flex-col px-4 pb-6 md:px-10 md:pb-10',
            embedded ? 'pt-8 md:pt-12' : 'pt-6 md:pt-10'
          )}
        >
          {!embedded && (
            <button type="button" onClick={onBack} className={t.backBtn}>
              ← Voltar ao início
            </button>
          )}

          <div className="grid flex-1 gap-10 lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div className="max-w-xl space-y-5 lg:pr-4">
              <p
                className="empresarial-p4-eyebrow text-3xl md:text-4xl"
                style={{ color: accentColor }}
              >
                Sobre nós
              </p>
              <h2
                className={cn(
                  'text-3xl font-bold uppercase leading-[1.06] tracking-tight md:text-4xl lg:text-5xl xl:text-6xl',
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

            <div className="min-w-0 lg:pl-2">
              <div className={cn('grid grid-cols-2 gap-px', t.gridLine)}>
                {p4.quadrants.map((q, i) => {
                  const isLastOdd = n % 2 === 1 && i === n - 1
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        'relative min-h-[148px] p-5 backdrop-blur-sm md:min-h-[168px] md:p-7',
                        t.cell,
                        isLastOdd ? 'col-span-2' : ''
                      )}
                    >
                      <span
                        className={cn(
                          'absolute right-4 top-4 font-mono text-[10px] font-medium tabular-nums md:right-5 md:top-5 md:text-[11px]',
                          t.index
                        )}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex flex-col gap-3 pr-8">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full border md:h-11 md:w-11',
                            t.iconRing
                          )}
                          aria-hidden
                        >
                          <EmpresarialDynamicIcon iconKey={q.iconKey} size={20} className={t.iconClass} />
                        </div>
                        <h3
                          className={cn(
                            'text-xs font-bold uppercase leading-snug tracking-[0.12em] md:text-sm',
                            t.quadTitle
                          )}
                        >
                          {q.title || 'TÍTULO'}
                        </h3>
                        <p className={cn('text-xs font-light leading-relaxed md:text-sm', t.quadSub)}>
                          {q.subtitle}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {marqueeLoopSegment ? (
        <div
          className={cn(
            'relative z-20 w-full shrink-0 overflow-x-hidden overflow-y-visible py-3.5 md:py-4',
            t.marqueeBar
          )}
          style={{ backgroundColor: accentColor }}
        >
          <div className="min-h-[2.5rem] overflow-x-hidden">
            <div
              className="empresarial-marquee-track whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.18em] text-white md:text-xs"
              style={
                {
                  ['--marquee-sec' as string]: `${Number.isFinite(marqueeSec) ? marqueeSec : 40}s`,
                } as CSSProperties
              }
            >
              <span className="inline-block shrink-0 px-4">{marqueeLoopSegment}</span>
              <span className="inline-block shrink-0 px-4" aria-hidden>
                {marqueeLoopSegment}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
