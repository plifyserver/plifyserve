'use client'

import { Check, Calendar, MapPin, Mail, Phone, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { proposalHtmlHasVisibleText } from '@/lib/proposalContent'
import { SITE_GUTTER_X } from '@/lib/siteLayout'
import { modernSectionShell } from '@/components/proposals/modernProposalSurface'
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml'
import { planBillingSuffix } from './PlanCard'
import type { ProposalData, ColorPalette } from './ProposalPreview'

const defaultPalette: ColorPalette = {
  primary: '#6366F1',
  secondary: '#1E293B',
  accent: '#F59E0B',
  background: '#FFFFFF',
  text: '#334155',
}

export type CommerceSectionStyles = {
  sectionRadius: string
  cardShadow: string
}

interface ProposalCommerceSectionsProps {
  data: ProposalData
  palette?: Partial<ColorPalette>
  styles: CommerceSectionStyles
  selectedPlanId?: string | null
  onSelectPlan?: (planId: string) => void
  onOpenPlanAccept?: (planId: string) => void
  /** Modelo Moderno: planos já aparecem na página 4 escura — evita bloco duplicado. */
  hidePlansSection?: boolean
  /** Modelo Moderno: sem linha de entrega no bloco claro (evita “Entrega imediata…”). */
  hideDeliverySection?: boolean
  /** Modelo Moderno: sem rodapé duplicado (empresa já está na página 8). */
  hideFooterSection?: boolean
  /** Integra fundo e texto ao tema da proposta Moderna (sem faixa branca). */
  embedModernSurface?: 'dark' | 'light'
  className?: string
}

/** Bloco claro: descrição, blocos, planos, entrega e rodapé — reutilizado no modelo Clean após as páginas escuras. */
export function ProposalCommerceSections({
  data,
  palette: palettePartial,
  styles,
  selectedPlanId,
  onSelectPlan,
  onOpenPlanAccept,
  hidePlansSection,
  hideDeliverySection,
  hideFooterSection,
  embedModernSurface,
  className,
}: ProposalCommerceSectionsProps) {
  const palette = { ...defaultPalette, ...data.colorPalette, ...palettePartial }
  const modernPalette = {
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
    background: palette.background,
    text: palette.text,
  }
  const shell = embedModernSurface
    ? modernSectionShell(embedModernSurface, modernPalette)
    : null
  const isModernDark = embedModernSurface === 'dark'
  const borderMuted = isModernDark ? 'border-white/10' : 'border-slate-100'
  const textMuted = isModernDark ? 'text-white/65' : 'text-slate-600'
  const textSoft = isModernDark ? 'text-white/50' : 'text-slate-500'
  const proseCls = isModernDark
    ? 'prose prose-invert max-w-none prose-headings:text-white prose-p:text-white/85 prose-li:text-white/85 prose-strong:text-white'
    : 'prose prose-slate max-w-none'

  return (
    <div
      className={cn(
        embedModernSurface && shell
          ? cn(shell.className, SITE_GUTTER_X, 'py-12 md:py-16 space-y-10')
          : 'bg-white p-8 md:p-12 space-y-10',
        className
      )}
      style={{
        ...(shell?.style ?? {}),
        ...(!embedModernSurface ? { color: palette.text } : isModernDark ? { color: 'rgba(255,255,255,0.92)' } : { color: palette.text }),
      }}
    >
      {proposalHtmlHasVisibleText(data.description) && (
        <section>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: isModernDark ? palette.accent : palette.secondary }}
          >
            Sobre o Projeto
          </h2>
          <div className={proseCls} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(data.description) }} />
        </section>
      )}

      {data.blocks.length > 0 && (
        <section className="space-y-6">
          {data.blocks.map((block) => {
            if (block.type === 'heading') {
              return (
                <h3
                  key={block.id}
                  className="text-2xl font-bold"
                  style={{ color: isModernDark ? palette.accent : palette.secondary }}
                >
                  {block.content}
                </h3>
              )
            }
            if (block.type === 'image' && block.content) {
              return (
                <img key={block.id} src={block.content} alt="" className="rounded-xl w-full max-w-2xl mx-auto" />
              )
            }
            if (block.type === 'divider') {
              return <hr key={block.id} className={isModernDark ? 'border-white/15' : 'border-slate-200'} />
            }
            return (
              <div
                key={block.id}
                className={proseCls}
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(block.content) }}
              />
            )
          })}
        </section>
      )}

      {data.paymentType === 'plans' && data.plans.length > 0 && !hidePlansSection && (
        <section>
          <h2
            className="text-xl font-semibold mb-6 text-center"
            style={{ color: isModernDark ? palette.accent : palette.secondary }}
          >
            Planos Disponíveis
          </h2>
          <div
            className={cn(
              'gap-6',
              data.plans.length === 1 && 'flex justify-center',
              data.plans.length === 2 && 'grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto',
              data.plans.length >= 3 && 'grid grid-cols-1 md:grid-cols-3'
            )}
          >
            {data.plans.map((plan) => {
              const isPublicPlanFlow = Boolean(onOpenPlanAccept)
              const isSelectableLegacy = Boolean(onSelectPlan) && !isPublicPlanFlow
              const isSelected = selectedPlanId === plan.id
              const PlanWrapper = isSelectableLegacy ? 'button' : 'div'
              const billingSuffix = planBillingSuffix(plan.priceType)
              return (
                <PlanWrapper
                  key={plan.id}
                  type={isSelectableLegacy ? 'button' : undefined}
                  onClick={isSelectableLegacy ? () => onSelectPlan?.(plan.id) : undefined}
                  className={cn(
                    'relative rounded-2xl border-2 p-6 transition-all bg-white text-left w-full',
                    styles.cardShadow,
                    plan.highlighted && !isSelected
                      ? 'border-current scale-105 z-10'
                      : 'border-slate-200',
                    isSelectableLegacy && 'cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
                    isSelected && 'ring-2 ring-offset-2'
                  )}
                  style={{
                    ...(plan.highlighted && !isSelected ? { borderColor: palette.primary } : undefined),
                    ...(isSelected ? { borderColor: palette.primary, boxShadow: `0 0 0 2px ${palette.primary}` } : undefined),
                    borderRadius: styles.sectionRadius,
                  }}
                >
                  {plan.highlighted && !isSelected && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
                      style={{ backgroundColor: palette.primary }}
                    >
                      Recomendado
                    </div>
                  )}
                  {isSelected && (
                    <div
                      className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: palette.primary }}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2" style={{ color: palette.secondary }}>
                    {plan.name || 'Plano'}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
                  <div className="mb-5">
                    <span className="text-4xl font-bold" style={{ color: palette.secondary }}>
                      R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {billingSuffix ? <span className="text-slate-500 text-sm">{billingSuffix}</span> : null}
                  </div>
                  <ul className="space-y-3">
                    {plan.benefits
                      .filter((b) => b.trim())
                      .map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: `${palette.primary}20` }}
                          >
                            <Check className="w-3 h-3" style={{ color: palette.primary }} />
                          </div>
                          <span style={{ color: palette.text }}>{benefit}</span>
                        </li>
                      ))}
                  </ul>
                  {isPublicPlanFlow && (
                    <button
                      type="button"
                      onClick={() => onOpenPlanAccept?.(plan.id)}
                      className="inline-block w-full mt-6 py-3 rounded-xl font-semibold text-white text-center transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: isSelected
                          ? palette.primary
                          : plan.highlighted
                            ? palette.primary
                            : palette.secondary,
                      }}
                    >
                      {isSelected ? 'Plano escolhido — aceitar abaixo' : 'Selecionar plano'}
                    </button>
                  )}
                  {isSelectableLegacy && (
                    <span
                      className="inline-block w-full mt-6 py-3 rounded-xl font-semibold text-white text-center transition-opacity hover:opacity-90 pointer-events-none"
                      style={{
                        backgroundColor: isSelected ? palette.primary : plan.highlighted ? palette.primary : palette.secondary,
                      }}
                    >
                      {isSelected ? 'Plano selecionado' : 'Selecionar'}
                    </span>
                  )}
                  {!isPublicPlanFlow && !isSelectableLegacy && (
                    <div
                      className="w-full mt-6 py-3 rounded-xl font-semibold text-white text-center"
                      style={{ backgroundColor: plan.highlighted ? palette.primary : palette.secondary }}
                    >
                      Selecionar
                    </div>
                  )}
                </PlanWrapper>
              )
            })}
          </div>
        </section>
      )}

      {data.paymentType === 'single' && data.singlePrice > 0 && (
        <section className="text-center">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: isModernDark ? palette.accent : palette.secondary }}
          >
            Valor do projeto
          </h2>
          <div
            className={cn(
              'inline-flex flex-col items-center justify-center rounded-2xl border-2 px-8 py-6',
              isModernDark ? 'bg-zinc-950/90 border-white/10' : 'bg-white',
              styles.cardShadow
            )}
            style={{ borderColor: isModernDark ? `${palette.primary}55` : `${palette.primary}40`, borderRadius: styles.sectionRadius }}
          >
            <span className={cn('text-sm mb-1', textSoft)}>Valor único</span>
            <span className="text-4xl font-bold" style={{ color: isModernDark ? '#fff' : palette.secondary }}>
              R$ {data.singlePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </section>
      )}

      {!hideDeliverySection && (
        <section className={cn('flex items-center justify-center gap-3 py-6 border-t', borderMuted)}>
          <Calendar className="w-5 h-5" style={{ color: palette.primary }} />
          <span className={textMuted}>
            {data.deliveryType === 'immediate'
              ? 'Entrega imediata após confirmação'
              : `Entrega prevista: ${
                  data.deliveryDate
                    ? new Date(data.deliveryDate).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'A definir'
                }`}
          </span>
        </section>
      )}

      {!hideFooterSection && (
      <footer className={cn('pt-8 border-t text-center', borderMuted)}>
        <div className={cn('flex items-center justify-center gap-2 text-sm flex-wrap', textSoft)}>
          <Building2 className="w-4 h-4" />
          <span>{data.company.name}</span>
          {data.company.document && (
            <>
              <span className="mx-2">•</span>
              <span>{data.company.document}</span>
            </>
          )}
        </div>
        {(data.company.email || data.company.phone || data.company.address) && (
          <div className={cn('mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm', textSoft)}>
            {data.company.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 shrink-0" />
                {data.company.email}
              </span>
            )}
            {data.company.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 shrink-0" />
                {data.company.phone}
              </span>
            )}
            {data.company.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 shrink-0" />
                {data.company.address}
              </span>
            )}
          </div>
        )}
      </footer>
      )}
    </div>
  )
}
