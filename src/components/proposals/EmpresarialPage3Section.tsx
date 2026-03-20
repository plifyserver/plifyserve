'use client'

import { useEffect, useState } from 'react'
import { Check, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Plan } from '@/components/proposals/PlanCard'
import { planBillingSuffix } from '@/components/proposals/PlanCard'
import type { EmpresarialSiteMode } from '@/types/empresarialProposal'
import { mergeEmpresarialPage3 } from '@/types/empresarialProposal'
import { getEmpresarialSiteVisual } from '@/lib/empresarialSiteTheme'
import type { ColorPalette } from '@/components/proposals/ProposalPreview'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { fireProposalConfetti } from '@/lib/proposalConfetti'
import { toast } from 'sonner'

const defaultPalette: ColorPalette = {
  primary: '#6366F1',
  secondary: '#1E293B',
  accent: '#F59E0B',
  background: '#FFFFFF',
  text: '#334155',
}

function RevealPlanCard({
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
      { threshold: 0.06, rootMargin: '0px 0px -6% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [el])
  return (
    <div
      ref={setEl}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        on ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0',
        className
      )}
    >
      {children}
    </div>
  )
}

const EYEBROW_FIXED = 'nossos planos'

interface EmpresarialPage3SectionProps {
  siteMode: EmpresarialSiteMode
  rawPage3: unknown
  plans: Plan[]
  accentColor?: string
  colorPalette?: ColorPalette
  selectedPlanId?: string | null
  /** Link público: abre o fluxo real (modal na página /p/...). Se ausente, usa pré-visualização com confetes. */
  onOpenPlanAccept?: (planId: string) => void
}

export function EmpresarialPage3Section({
  siteMode,
  rawPage3,
  plans,
  accentColor = '#f97316',
  colorPalette,
  selectedPlanId,
  onOpenPlanAccept,
}: EmpresarialPage3SectionProps) {
  const p3 = mergeEmpresarialPage3(rawPage3)
  const ev = getEmpresarialSiteVisual(siteMode)
  const t = ev.p3

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewPlan, setPreviewPlan] = useState<Plan | null>(null)
  const [previewComment, setPreviewComment] = useState('')
  const [previewHighlightId, setPreviewHighlightId] = useState<string | null>(null)
  const [previewSubmitting, setPreviewSubmitting] = useState(false)

  const phraseLines = p3.motivationalPhrase.split('\n').map((l) => l.trim()).filter(Boolean)
  const displayPhrase =
    phraseLines.length > 0 ? phraseLines : [p3.motivationalPhrase.trim() || 'SEU PLANO']

  const openPlanFlow = (plan: Plan) => {
    if (onOpenPlanAccept) {
      onOpenPlanAccept(plan.id)
      return
    }
    setPreviewPlan(plan)
    setPreviewHighlightId(plan.id)
    setPreviewComment('')
    setPreviewOpen(true)
  }

  const handlePreviewConfirm = async () => {
    if (!previewPlan) return
    setPreviewSubmitting(true)
    try {
      await fireProposalConfetti({ ...defaultPalette, ...colorPalette })
      const note = previewComment.trim()
      toast.success(
        'Pré-visualização concluída. No link público, o aceite fica registrado na sua conta.',
        note ? { description: `Comentário (só simulado aqui): ${note.slice(0, 120)}${note.length > 120 ? '…' : ''}` } : undefined
      )
      setPreviewOpen(false)
      setPreviewPlan(null)
    } finally {
      setPreviewSubmitting(false)
    }
  }

  const effectiveSelectedId = selectedPlanId ?? previewHighlightId
  const previewBilling = previewPlan ? planBillingSuffix(previewPlan.priceType) : ''

  return (
    <section className={t.section} aria-label="Planos">
      <div
        className="pointer-events-none flex flex-col items-center justify-center gap-2 py-8"
        style={t.bridgeWrap}
      >
        <div className={cn('h-8 w-px bg-gradient-to-b', t.bridgeLine)} />
        <div
          className={cn(
            'flex animate-bounce flex-col items-center gap-1 text-[10px] font-medium uppercase tracking-[0.2em]',
            t.bridgeHint
          )}
        >
          <span>Planos</span>
          <span className={cn('text-lg leading-none', t.bridgeArrow)}>↓</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 md:px-8 md:pb-24 md:pt-8">
        <div className="mb-12 flex flex-col gap-8 md:mb-16 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-3xl space-y-4">
            <p
              className="font-serif text-xl italic tracking-wide md:text-2xl"
              style={{ color: accentColor }}
            >
              {EYEBROW_FIXED}
            </p>
            <h2
              className={cn(
                'text-3xl font-bold uppercase leading-[1.08] tracking-tight md:text-4xl lg:text-5xl',
                t.phraseTitle
              )}
            >
              {displayPhrase.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>
        </div>

        {plans.length === 0 ? (
          <p className={cn('py-12 text-center text-sm', t.emptyHint)}>
            Configure os planos ou o valor único na seção{' '}
            <strong className={t.emptyStrong}>Pagamento</strong> do editor.
          </p>
        ) : (
          <div
            className={cn(
              'grid gap-10 md:gap-x-10 md:gap-y-14',
              plans.length === 1 ? 'mx-auto max-w-xl' : 'grid-cols-1 md:grid-cols-2'
            )}
          >
            {plans.map((plan) => {
              const billingSuffix = planBillingSuffix(plan.priceType)
              return (
                <RevealPlanCard key={plan.id}>
                  <article className={t.planArticle}>
                    <div
                      className={cn(
                        'flex items-center justify-between gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] md:px-5 md:text-[11px]',
                        t.planHeader
                      )}
                    >
                      <span className="min-w-0 truncate">{plan.name || 'Plano'}</span>
                    </div>
                    {plan.image ? (
                      <div className={cn('relative aspect-[16/10] w-full overflow-hidden', t.planMediaBg)}>
                        <img
                          src={plan.image}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : null}
                    <div className="space-y-4 px-5 py-6 md:px-6 md:py-8">
                      {plan.description?.trim() ? (
                        <p className={cn('text-sm leading-relaxed md:text-base', t.planDesc)}>{plan.description}</p>
                      ) : null}
                      {plan.benefits.some((b) => b.trim()) ? (
                        <ul className={cn('space-y-2.5 border-t pt-4', t.planBenefitsBorder)}>
                          {plan.benefits
                            .filter((b) => b.trim())
                            .map((b, i) => (
                              <li key={i} className={cn('flex items-start gap-2.5 text-sm', t.planBenefit)}>
                                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accentColor }} />
                                <span>{b}</span>
                              </li>
                            ))}
                        </ul>
                      ) : null}
                      <div className={cn('border-t pt-5', t.investBorder)}>
                        <p className={cn('mb-1 text-[10px] font-semibold uppercase tracking-wider', t.investLabel)}>
                          Investimento
                        </p>
                        <p className={cn('text-2xl font-bold tracking-tight md:text-3xl', t.price)}>
                          R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {billingSuffix ? (
                            <span className={cn('text-base font-normal', t.priceSuffix)}> {billingSuffix}</span>
                          ) : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPlanFlow(plan)}
                        className={cn(
                          'mt-5 w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90',
                          ev.isLight && 'ring-1 ring-slate-900/10'
                        )}
                        style={{ backgroundColor: accentColor }}
                      >
                        {effectiveSelectedId === plan.id
                          ? onOpenPlanAccept
                            ? 'Plano escolhido — toque para confirmar'
                            : 'Plano escolhido — abrir confirmação'
                          : 'Selecionar plano'}
                      </button>
                    </div>
                  </article>
                </RevealPlanCard>
              )
            })}
          </div>
        )}
      </div>

      {!onOpenPlanAccept && (
        <Dialog
          open={previewOpen}
          onOpenChange={(open) => {
            setPreviewOpen(open)
            if (!open) {
              setPreviewPlan(null)
              setPreviewComment('')
            }
          }}
        >
          <DialogContent className="rounded-xl sm:max-w-md text-slate-900 [&_button[aria-label='Fechar']]:text-slate-600">
            <DialogHeader>
              <DialogTitle>Confirmar proposta</DialogTitle>
              <DialogDescription>
                {previewPlan
                  ? 'Revise o plano. Opcionalmente deixe um comentário — em pré-visualização o aceite não é salvo; no link público, sim.'
                  : ''}
              </DialogDescription>
            </DialogHeader>
            {previewPlan && (
              <div className="space-y-4 py-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plano</p>
                  <p className="font-semibold text-slate-900">{previewPlan.name || 'Plano'}</p>
                  <p className="mt-2 text-lg font-bold text-slate-800">
                    R$ {previewPlan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {previewBilling ? (
                      <span className="text-sm font-normal text-slate-500"> {previewBilling}</span>
                    ) : null}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-p3-preview-comment">Comentário (opcional)</Label>
                  <Textarea
                    id="emp-p3-preview-comment"
                    placeholder="Ex.: Gostei deste plano, mas gostaria de ajustar o prazo."
                    value={previewComment}
                    onChange={(e) => setPreviewComment(e.target.value)}
                    rows={3}
                    className="resize-none rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                    maxLength={2000}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                type="button"
                className="rounded-lg border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                disabled={previewSubmitting}
                onClick={() => setPreviewOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
                disabled={previewSubmitting || !previewPlan}
                onClick={() => void handlePreviewConfirm()}
              >
                {previewSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando…
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar (pré-visualização)
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}
