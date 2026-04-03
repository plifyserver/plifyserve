'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { ArrowRight, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { whatsappHref } from '@/lib/empresarialContactLinks'
import type { ExecutiveNeonAccent, ExecutivePage4 } from '@/types/executiveProposal'
import { executiveNeonHex, executiveNeonRgb } from '@/types/executiveProposal'

function faqTitleStyle(accent: ExecutiveNeonAccent): CSSProperties {
  const h = executiveNeonHex(accent)
  if (accent === 'white') {
    return {
      backgroundImage: 'linear-gradient(105deg, #ffffff 0%, #e2e8f0 55%, #94a3b8 100%)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
    }
  }
  return {
    backgroundImage: `linear-gradient(105deg, #ffffff 0%, ${h} 45%, ${h} 100%)`,
    filter: `drop-shadow(0 0 24px rgba(${executiveNeonRgb(accent)}, 0.3))`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  }
}

export type ExecutiveFaqSectionProps = {
  p4: ExecutivePage4
  neonAccent: ExecutiveNeonAccent
  /** Telefone da empresa (fallback do WhatsApp se `p4.whatsappPhone` vazio) */
  companyPhone: string
}

export function ExecutiveFaqSection({ p4, neonAccent, companyPhone }: ExecutiveFaqSectionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const rgb = executiveNeonRgb(neonAccent)
  const hex = executiveNeonHex(neonAccent)
  const isWhite = neonAccent === 'white'

  const visibleRows = useMemo(() => {
    return p4.faqItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.question.trim().length > 0)
  }, [p4.faqItems])

  const waSource = p4.whatsappPhone.trim().length > 0 ? p4.whatsappPhone : companyPhone
  const waLink = whatsappHref(waSource)

  const btnStyle: CSSProperties = isWhite
    ? {
        background: 'linear-gradient(90deg, #ffffff 0%, #e2e8f0 100%)',
        color: '#0f172a',
        boxShadow: `0 0 28px rgba(${rgb}, 0.35)`,
      }
    : {
        background: `linear-gradient(90deg, ${hex} 0%, rgba(${rgb}, 0.85) 100%)`,
        color: '#ffffff',
        boxShadow: `0 0 28px rgba(${rgb}, 0.4)`,
      }

  return (
    <section className="border-t border-white/5 bg-black py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2
              className="mb-5 text-balance text-3xl font-bold leading-tight tracking-tight md:text-4xl"
              style={faqTitleStyle(neonAccent)}
            >
              {p4.sectionTitle}
            </h2>
            <p className="mb-8 max-w-md text-pretty text-base leading-relaxed text-white/55 md:text-lg">
              {p4.sectionSubtitle}
            </p>
            {waLink !== '#' ? (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold tracking-wide transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={btnStyle}
              >
                {p4.ctaButtonLabel}
                <ArrowRight className="h-4 w-4 shrink-0" />
              </a>
            ) : (
              <p className="text-sm text-white/45">
                Adicione número de WhatsApp (FAQ · pág. 4) ou telefone na empresa para ativar o botão.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {visibleRows.length === 0 ? (
              <p className="text-sm text-white/40">Adicione perguntas na secção FAQ · pág. 4 do editor.</p>
            ) : (
              visibleRows.map(({ item, index }) => {
                const open = openIdx === index
                return (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIdx(open ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="text-sm font-medium leading-snug text-white md:text-base">
                        {item.question.trim()}
                      </span>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white">
                        {open ? <Minus className="h-4 w-4" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={2} />}
                      </span>
                    </button>
                    <div
                      className={cn(
                        'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
                        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      )}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="border-t border-white/10 px-5 pb-5 pt-2 text-sm leading-relaxed text-white/65 md:text-[15px]">
                          {item.answer.trim() || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
