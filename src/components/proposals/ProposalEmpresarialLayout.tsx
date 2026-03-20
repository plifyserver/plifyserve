'use client'

import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { ProposalData } from '@/components/proposals/ProposalPreview'
import type { Plan } from '@/components/proposals/PlanCard'
import { EmpresarialDynamicIcon } from '@/components/proposals/EmpresarialDynamicIcon'
import { mergeEmpresarialPage1 } from '@/types/empresarialProposal'
import { getEmpresarialSiteVisual } from '@/lib/empresarialSiteTheme'
import { EmpresarialPage2Section } from '@/components/proposals/EmpresarialPage2Section'
import { EmpresarialPage3Section } from '@/components/proposals/EmpresarialPage3Section'
import { EmpresarialPage31Section } from '@/components/proposals/EmpresarialPage31Section'
import { EmpresarialPage4Section } from '@/components/proposals/EmpresarialPage4Section'
import { EmpresarialPage5Section } from '@/components/proposals/EmpresarialPage5Section'

function buildEmpresarialVitrinePlans(data: ProposalData): Plan[] {
  if (data.paymentType === 'single' && data.singlePrice > 0) {
    return [
      {
        id: 'empresarial-valor-unico',
        name: 'VALOR DO PROJETO',
        description: '',
        benefits: [],
        price: data.singlePrice,
        priceType: 'unique',
        image: null,
      },
    ]
  }
  return Array.isArray(data.plans) ? data.plans : []
}

interface ProposalEmpresarialLayoutProps {
  data: ProposalData
  className?: string
  selectedPlanId?: string | null
  onSelectPlan?: (planId: string) => void
  onOpenPlanAccept?: (planId: string) => void
}

export function ProposalEmpresarialLayout({
  data,
  className,
  selectedPlanId,
  onSelectPlan: _onSelectPlan,
  onOpenPlanAccept,
}: ProposalEmpresarialLayoutProps) {
  const p1 = mergeEmpresarialPage1(data.empresarialPage1)
  const ev = getEmpresarialSiteVisual(p1.siteMode)
  const palette = {
    primary: data.colorPalette?.primary ?? '#6366F1',
    secondary: data.colorPalette?.secondary ?? '#1E293B',
    accent: data.colorPalette?.accent ?? '#F59E0B',
    background: data.colorPalette?.background ?? '#FFFFFF',
    text: data.colorPalette?.text ?? '#334155',
  }

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const goHome = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const headlineLines = p1.heroHeadline.split('\n').map((l) => l.trim()).filter(Boolean)
  const displayLines = headlineLines.length > 0 ? headlineLines : [p1.heroHeadline.trim() || 'TÍTULO']

  const logoOrName = (
    <button
      type="button"
      onClick={goHome}
      className="mx-auto flex max-w-[min(100%,280px)] items-center justify-center md:mx-0"
    >
      {data.company.logo ? (
        <img
          src={data.company.logo}
          alt={data.company.name || 'Logo'}
          className="h-8 w-auto max-w-[200px] object-contain object-center md:h-9"
        />
      ) : (
        <span className={ev.p1.logoText}>{data.company.name || 'Sua empresa'}</span>
      )}
    </button>
  )

  return (
    <div className={cn('w-full overflow-x-hidden', className)}>
      <div className={ev.p1.shell}>
        <div className="grid min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto]">
              <header className={cn(ev.p1.header, 'relative z-50 row-start-1')}>
                <div className="pointer-events-auto absolute left-1/2 top-1/2 w-[calc(100%-7rem)] max-w-md -translate-x-1/2 -translate-y-1/2 md:w-auto md:max-w-lg">
                  {logoOrName}
                </div>
                <button
                  type="button"
                  onClick={() => scrollToId('empresarial-contato')}
                  className={ev.p1.contactBtn}
                >
                  {p1.contactButtonLabel}
                </button>
              </header>

              <section
                className="relative row-start-2 flex min-h-0 flex-col"
                style={ev.p1.heroSection}
              >
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 py-6 md:gap-8 md:py-8">
                  <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-4 md:flex-row md:flex-wrap md:gap-5">
                    {p1.heroImageStart ? (
                      <img
                        src={p1.heroImageStart}
                        alt=""
                        className="h-14 w-auto max-w-[120px] rounded-lg object-cover shadow-lg md:h-16 md:max-w-[140px]"
                      />
                    ) : null}
                    <h1 className="max-w-3xl text-center text-2xl font-bold uppercase leading-tight tracking-tight md:text-4xl lg:text-5xl">
                      {displayLines.map((line, i) => (
                        <span key={i} className="block">
                          {line}
                        </span>
                      ))}
                    </h1>
                    {p1.heroImageEnd ? (
                      <img
                        src={p1.heroImageEnd}
                        alt=""
                        className="h-14 w-auto max-w-[120px] rounded-lg object-cover shadow-lg md:h-16 md:max-w-[140px]"
                      />
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollToId('empresarial-sobre-nos')}
                    className={ev.p1.sobreNosBtn}
                  >
                    {p1.sobreNosButtonLabel}
                  </button>
                </div>
              </section>

              <nav className={cn(ev.p1.bottomNav, 'row-start-3')}>
                {p1.bottomRow.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 py-4 md:gap-2 md:py-5',
                      ev.p1.bottomNavCell,
                      idx > 0 && 'border-l'
                    )}
                  >
                    <EmpresarialDynamicIcon iconKey={item.iconKey} size={22} className={ev.p1.bottomNavIcon} />
                    <span
                      className={cn(
                        'px-1 text-center text-[9px] font-semibold uppercase tracking-wide md:text-[10px]',
                        ev.p1.bottomNavLabel
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </nav>
        </div>

        <EmpresarialPage2Section siteMode={p1.siteMode} raw={data.empresarialPage2} accentColor={palette.primary} />

        <EmpresarialPage3Section
          siteMode={p1.siteMode}
          rawPage3={data.empresarialPage3}
          plans={buildEmpresarialVitrinePlans(data)}
          accentColor={palette.primary}
          colorPalette={data.colorPalette}
          selectedPlanId={selectedPlanId}
          onOpenPlanAccept={onOpenPlanAccept}
        />
        <EmpresarialPage31Section siteMode={p1.siteMode} raw={data.empresarialPage31} accentColor={palette.primary} />
      </div>

      <div className={cn(ev.proposalBand, 'p-8 md:p-12')}>
        {data.description && (
              <section className="mb-10">
                <h2
                  className={cn(
                    'mb-4 text-xl font-semibold',
                    ev.isLight ? 'text-slate-900' : 'text-white'
                  )}
                >
                  Sobre o Projeto
                </h2>
                <div
                  className={cn(
                    'prose max-w-none',
                    ev.isLight ? 'prose-slate' : 'prose-invert prose-p:text-white/85'
                  )}
                  dangerouslySetInnerHTML={{ __html: data.description }}
                />
              </section>
        )}

        {data.blocks.length > 0 && (
              <section className="mb-10 space-y-6">
                {data.blocks.map((block) => {
                  if (block.type === 'heading') {
                    return (
                      <h3
                        key={block.id}
                        className={cn(
                          'text-2xl font-bold',
                          ev.isLight ? 'text-slate-900' : 'text-white'
                        )}
                      >
                        {block.content}
                      </h3>
                    )
                  }
                  if (block.type === 'image' && block.content) {
                    return (
                      <img
                        key={block.id}
                        src={block.content}
                        alt=""
                        className="mx-auto w-full max-w-2xl rounded-xl"
                      />
                    )
                  }
                  if (block.type === 'divider') {
                    return (
                      <hr
                        key={block.id}
                        className={ev.isLight ? 'border-slate-200' : 'border-white/10'}
                      />
                    )
                  }
                  return (
                    <div
                      key={block.id}
                      className={cn(
                        'prose max-w-none',
                        ev.isLight ? 'prose-slate' : 'prose-invert prose-p:text-white/85'
                      )}
                      dangerouslySetInnerHTML={{ __html: block.content }}
                    />
                  )
                })}
              </section>
        )}

        <div
          id="empresarial-sobre-nos"
          className={cn(
            '-mx-8 w-[calc(100%+4rem)] max-w-none scroll-mt-6 md:-mx-12 md:w-[calc(100%+6rem)]'
          )}
        >
          <EmpresarialPage4Section
            siteMode={p1.siteMode}
            raw={data.empresarialPage4}
            accentColor={palette.primary}
            onBack={goHome}
            embedded
          />
        </div>
      </div>

      <div id="empresarial-contato" className="scroll-mt-6">
        <EmpresarialPage5Section
          siteMode={p1.siteMode}
          raw={data.empresarialPage5}
          companyName={data.company.name}
          companyLogo={data.company.logo}
          accentColor={palette.primary}
          onBack={goHome}
          embedded
        />
      </div>
    </div>
  )
}
