'use client'

import { useMemo, type CSSProperties } from 'react'
import { ArrowUp, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { planBillingSuffix, type Plan } from '@/components/proposals/PlanCard'
import { normalizeExternalUrl } from '@/lib/empresarialContactLinks'
import type { ExecutiveNeonAccent, ExecutivePage3 } from '@/types/executiveProposal'
import { executiveNeonHex, executiveNeonRgb } from '@/types/executiveProposal'

function fmtBrl(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function PlansStarfield() {
  const dots = useMemo(() => {
    const out: { x: number; y: number; s: number; o: number }[] = []
    let seed = 22441
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < 70; i++) {
      out.push({
        x: rnd() * 100,
        y: rnd() * 100,
        s: 0.5 + rnd() * 1.2,
        o: 0.12 + rnd() * 0.45,
      })
    }
    return out
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.s,
            height: d.s,
            opacity: d.o,
          }}
        />
      ))}
    </div>
  )
}

export type ExecutivePlansSectionProps = {
  plans: Plan[]
  p3: ExecutivePage3
  neonAccent: ExecutiveNeonAccent
  selectedPlanId?: string | null
  onSelectPlan?: (planId: string) => void
  onOpenPlanAccept?: (planId: string) => void
}

export function ExecutivePlansSection({
  plans,
  p3,
  neonAccent,
  selectedPlanId,
  onSelectPlan,
  onOpenPlanAccept,
}: ExecutivePlansSectionProps) {
  const rgb = executiveNeonRgb(neonAccent)
  const hex = executiveNeonHex(neonAccent)
  const isWhite = neonAccent === 'white'
  const canInteract = Boolean(onOpenPlanAccept || onSelectPlan)

  const yearlyRaw = p3.yearlyBillingUrl.trim()
  const yearlyHref = yearlyRaw.startsWith('#')
    ? yearlyRaw
    : normalizeExternalUrl(yearlyRaw)

  const gridClass =
    plans.length <= 1
      ? 'mx-auto grid max-w-md grid-cols-1 gap-6'
      : plans.length === 2
        ? 'mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2'
        : plans.length === 3
          ? 'mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3'
          : 'mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4'

  const glowStyle: CSSProperties = {
    background: `radial-gradient(ellipse 70% 55% at 50% 108%, rgba(${rgb}, 0.38) 0%, rgba(${rgb}, 0.08) 42%, transparent 68%)`,
  }

  const handleSelect = (planId: string) => {
    if (onOpenPlanAccept) onOpenPlanAccept(planId)
    else onSelectPlan?.(planId)
  }

  if (plans.length === 0) return null

  return (
    <section
      id="executive-planos"
      className="relative overflow-hidden border-t border-white/5 bg-black py-16 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0" style={glowStyle} aria-hidden />
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <PlansStarfield />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <header className="mb-12 text-center md:mb-16">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-white md:text-4xl">
            {p3.sectionTitle}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-white/55 md:text-lg">
            {p3.sectionDescription}
          </p>
        </header>

        <div className={gridClass}>
          {plans.map((plan) => {
            const hi = Boolean(plan.highlighted)
            const billing = planBillingSuffix(plan.priceType)
            const isSelected = selectedPlanId != null && selectedPlanId === plan.id
            const cmp = plan.compareAtPrice
            const showStrike = typeof cmp === 'number' && cmp > 0 && cmp !== plan.price

            const cardShadow = hi
              ? ({ boxShadow: `0 0 52px -12px rgba(${rgb}, 0.5)` } as CSSProperties)
              : undefined

            const btnSolid: CSSProperties = isWhite
              ? {
                  background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                  color: '#0f172a',
                  boxShadow: `0 0 24px rgba(${rgb}, 0.35)`,
                }
              : {
                  background: `linear-gradient(135deg, ${hex} 0%, rgba(${rgb}, 0.82) 100%)`,
                  color: '#0f172a',
                  boxShadow: `0 0 28px rgba(${rgb}, 0.4)`,
                }

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex min-h-0 flex-col rounded-2xl border p-6 md:p-7',
                  hi ? 'z-10 border-white/15 bg-zinc-900/95 md:scale-[1.04]' : 'border-white/10 bg-black/35',
                  isSelected && 'ring-2 ring-white/40 ring-offset-2 ring-offset-black'
                )}
                style={hi ? cardShadow : undefined}
              >
                {hi ? (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-30 blur-2xl"
                    style={{ background: `radial-gradient(circle at 50% 0%, rgba(${rgb}, 0.55), transparent 55%)` }}
                    aria-hidden
                  />
                ) : null}

                <div className="relative flex flex-1 flex-col">
                  <h3 className="text-lg font-bold text-white md:text-xl">{plan.name || 'Plano'}</h3>
                  <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-white/50">{plan.description}</p>

                  <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {showStrike ? (
                      <span className="text-lg text-white/35 line-through">R$ {fmtBrl(cmp)}</span>
                    ) : null}
                    <span className="text-3xl font-bold tabular-nums text-white md:text-4xl">
                      R$ {fmtBrl(plan.price)}
                    </span>
                    {billing ? <span className="text-sm font-medium text-white/45">{billing}</span> : null}
                  </div>

                  <button
                    type="button"
                    disabled={!canInteract}
                    onClick={() => handleSelect(plan.id)}
                    className={cn(
                      'mt-6 w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-opacity',
                      hi
                        ? ''
                        : 'border border-white/35 bg-transparent text-white hover:bg-white/5',
                      !canInteract && 'cursor-not-allowed opacity-50'
                    )}
                    style={hi ? btnSolid : undefined}
                  >
                    {isSelected ? 'Plano selecionado' : 'Selecionar plano'}
                  </button>

                  {yearlyHref ? (
                    <a
                      href={yearlyHref}
                      target={yearlyHref.startsWith('#') ? undefined : '_blank'}
                      rel={yearlyHref.startsWith('#') ? undefined : 'noopener noreferrer'}
                      className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white/80"
                    >
                      {p3.yearlyBillingLabel}
                      <ArrowUp className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <div className="mt-3 h-5" aria-hidden />
                  )}

                  <hr className="my-6 border-white/10" />

                  <ul className="flex flex-1 flex-col gap-3">
                    {plan.benefits
                      .filter((b) => b.trim())
                      .map((benefit, i) => (
                        <li key={i} className="flex gap-2.5 text-sm leading-snug text-white/80">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0"
                            style={{ color: hex }}
                            strokeWidth={2.5}
                          />
                          <span>{benefit}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
