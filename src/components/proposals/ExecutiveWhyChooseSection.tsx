'use client'

import { EmpresarialDynamicIcon } from '@/components/proposals/EmpresarialDynamicIcon'
import type { ExecutivePage5, ExecutiveWhyCard } from '@/types/executiveProposal'

function cardIsVisible(c: ExecutiveWhyCard): boolean {
  return Boolean(c.title.trim() || c.description.trim())
}

export function ExecutiveWhyChooseSection({
  page5,
  neonRgb,
}: {
  page5: ExecutivePage5
  neonRgb: string
}) {
  const visibleWithIndex = page5.cards
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => cardIsVisible(card))
  const hasTitle = Boolean(page5.sectionTitle.trim())
  if (!hasTitle && visibleWithIndex.length === 0) return null

  return (
    <section
      className="relative overflow-hidden border-t border-white/10 bg-black py-14 sm:py-20"
      aria-labelledby="executive-why-heading"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(90vw,720px)] w-[min(90vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] opacity-[0.35]"
        style={{
          background: `radial-gradient(circle, rgba(${neonRgb}, 0.55) 0%, rgba(${neonRgb}, 0.12) 45%, transparent 70%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,rgba(255,255,255,0.04),transparent_55%)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {hasTitle ? (
          <h2
            id="executive-why-heading"
            className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl"
          >
            {page5.sectionTitle}
          </h2>
        ) : (
          <h2 id="executive-why-heading" className="sr-only">
            Destaques
          </h2>
        )}

        {visibleWithIndex.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {visibleWithIndex.map(({ card, index }) => (
              <article
                key={index}
                className="group flex flex-col rounded-2xl border border-white/[0.08] bg-zinc-950/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-sm transition-[box-shadow,border-color] duration-300 hover:border-white/[0.14]"
                style={{
                  boxShadow: `0 0 40px -12px rgba(${neonRgb}, 0.25), 0 20px 50px -28px rgba(0,0,0,0.85)`,
                }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-white">
                  <EmpresarialDynamicIcon iconKey={card.iconKey} size={22} className="text-white" />
                </div>
                <h3 className="text-base font-semibold leading-snug text-white sm:text-lg">{card.title}</h3>
                {card.description.trim() ? (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{card.description}</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
