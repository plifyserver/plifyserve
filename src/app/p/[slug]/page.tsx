'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Loader2, AlertCircle, PartyPopper } from 'lucide-react'
import { SITE_GUTTER_X } from '@/lib/siteLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ProposalPreview, type ProposalData, type ColorPalette } from '@/components/proposals/ProposalPreview'
import {
  mergeEmpresarialPage1,
  mergeEmpresarialPage2,
  mergeEmpresarialPage3,
  mergeEmpresarialPage31,
  mergeEmpresarialPage4,
  mergeEmpresarialPage5,
} from '@/types/empresarialProposal'
import {
  mergeCleanPage1,
  mergeCleanPage2,
  mergeCleanPage3,
  mergeCleanPage4,
  mergeCleanPage5,
  mergeCleanPromotionCta,
} from '@/types/cleanProposal'
import {
  ensureModernPage4Stored,
  mergeModernPage1,
  mergeModernPage2,
  mergeModernPage3,
  mergeModernPage5,
  mergeModernPage6,
  mergeModernPage7,
  mergeModernPage8,
} from '@/types/modernProposal'
import { mergeModernSurfaceTheme } from '@/components/proposals/modernProposalSurface'
import {
  mergeExecutivePage1,
  mergeExecutivePage2,
  mergeExecutivePage3,
  mergeExecutivePage4,
  mergeExecutivePage5,
  mergeExecutivePage6,
} from '@/types/executiveProposal'
import { planBillingSuffix } from '@/components/proposals/PlanCard'
import { fireProposalConfetti } from '@/lib/proposalConfetti'
import { toast } from 'sonner'

const defaultPalette: ColorPalette = {
  primary: '#6366F1',
  secondary: '#1E293B',
  accent: '#F59E0B',
  background: '#FFFFFF',
  text: '#334155',
}

interface Proposal {
  id: string
  title: string
  client_name: string | null
  client_email: string | null
  content: {
    company?: ProposalData['company']
    description?: string
    plans?: ProposalData['plans']
    delivery?: { type: 'immediate' | 'scheduled'; date?: string }
    blocks?: ProposalData['blocks']
    colorPalette?: ColorPalette
    template?: ProposalData['template']
    empresarialPage1?: unknown
    empresarialPage2?: unknown
    empresarialPage3?: unknown
    empresarialPage31?: unknown
    empresarialPage4?: unknown
    empresarialPage5?: unknown
    cleanPage1?: unknown
    cleanPage2?: unknown
    cleanPage3?: unknown
    cleanPage4?: unknown
    cleanPage5?: unknown
    cleanPromotionCta?: unknown
    modernPage1?: unknown
    modernPage2?: unknown
    modernPage3?: unknown
    modernPage4?: unknown
    modernPage5?: unknown
    modernPage6?: unknown
    modernPage7?: unknown
    modernPage8?: unknown
    executivePage1?: unknown
    executivePage2?: unknown
    executivePage3?: unknown
    executivePage4?: unknown
    executivePage5?: unknown
    executivePage6?: unknown
    paymentType?: ProposalData['paymentType']
    singlePrice?: number
    acceptedPlanId?: string | null
  }
  status: string
  confirm_button_text?: string
  accepted_at: string | null
}

function buildProposalData(proposal: Proposal): ProposalData {
  const c = proposal.content || {}
  const plans = Array.isArray(c.plans) ? c.plans : []
  const company = c.company || {
    name: '',
    document: '',
    logo: null,
    address: '',
    email: '',
    phone: '',
  }
  return {
    template: c.template || 'modern',
    clientName: proposal.client_name || '',
    company,
    paymentType: c.paymentType || 'plans',
    plans,
    singlePrice: typeof c.singlePrice === 'number' ? c.singlePrice : 0,
    deliveryType: c.delivery?.type === 'scheduled' ? 'scheduled' : 'immediate',
    deliveryDate: c.delivery?.date || '',
    description: c.description || '',
    blocks: Array.isArray(c.blocks) ? c.blocks : [],
    colorPalette: c.colorPalette && typeof c.colorPalette === 'object' ? c.colorPalette : defaultPalette,
    empresarialPage1:
      c.template === 'empresarial'
        ? mergeEmpresarialPage1(c.empresarialPage1)
        : undefined,
    empresarialPage2:
      c.template === 'empresarial'
        ? mergeEmpresarialPage2(c.empresarialPage2)
        : undefined,
    empresarialPage3:
      c.template === 'empresarial'
        ? mergeEmpresarialPage3(c.empresarialPage3)
        : undefined,
    empresarialPage31:
      c.template === 'empresarial'
        ? mergeEmpresarialPage31(c.empresarialPage31)
        : undefined,
    empresarialPage4:
      c.template === 'empresarial' ? mergeEmpresarialPage4(c.empresarialPage4) : undefined,
    empresarialPage5:
      c.template === 'empresarial' ? mergeEmpresarialPage5(c.empresarialPage5) : undefined,
    cleanPage1: c.template === 'simple' ? mergeCleanPage1(c.cleanPage1) : undefined,
    cleanPage2: c.template === 'simple' ? mergeCleanPage2(c.cleanPage2) : undefined,
    cleanPage3: c.template === 'simple' ? mergeCleanPage3(c.cleanPage3) : undefined,
    cleanPage4: c.template === 'simple' ? mergeCleanPage4(c.cleanPage4) : undefined,
    cleanPage5: c.template === 'simple' ? mergeCleanPage5(c.cleanPage5) : undefined,
    cleanPromotionCta: c.template === 'simple' ? mergeCleanPromotionCta(c.cleanPromotionCta) : undefined,
    modernPage1: c.template === 'modern' ? mergeModernPage1(c.modernPage1) : undefined,
    modernPage2: c.template === 'modern' ? mergeModernPage2(c.modernPage2) : undefined,
    modernPage3: c.template === 'modern' ? mergeModernPage3(c.modernPage3) : undefined,
    modernPage4: c.template === 'modern' ? ensureModernPage4Stored(c.modernPage4, plans) : undefined,
    modernPage5: c.template === 'modern' ? mergeModernPage5(c.modernPage5) : undefined,
    modernPage6: c.template === 'modern' ? mergeModernPage6(c.modernPage6) : undefined,
    modernPage7: c.template === 'modern' ? mergeModernPage7(c.modernPage7) : undefined,
    modernPage8: c.template === 'modern' ? mergeModernPage8(c.modernPage8, company) : undefined,
    modernSurfaceTheme:
      c.template === 'modern' ? mergeModernSurfaceTheme((c as { modernSurfaceTheme?: unknown }).modernSurfaceTheme) : undefined,
    executivePage1: c.template === 'executive' ? mergeExecutivePage1(c.executivePage1) : undefined,
    executivePage2: c.template === 'executive' ? mergeExecutivePage2(c.executivePage2) : undefined,
    executivePage3: c.template === 'executive' ? mergeExecutivePage3(c.executivePage3) : undefined,
    executivePage4: c.template === 'executive' ? mergeExecutivePage4(c.executivePage4) : undefined,
    executivePage5: c.template === 'executive' ? mergeExecutivePage5(c.executivePage5) : undefined,
    executivePage6: c.template === 'executive' ? mergeExecutivePage6(c.executivePage6) : undefined,
  }
}

export default function PublicProposalPage() {
  const params = useParams()
  const slug = params.slug as string

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [planModalId, setPlanModalId] = useState<string | null>(null)
  const [planModalComment, setPlanModalComment] = useState('')
  const [singleAcceptComment, setSingleAcceptComment] = useState('')

  const proposalData = useMemo(() => (proposal ? buildProposalData(proposal) : null), [proposal])
  const isEmpresarial = proposalData?.template === 'empresarial'
  const isClean = proposalData?.template === 'simple'
  const isModern = proposalData?.template === 'modern'
  const isExecutive = proposalData?.template === 'executive'
  const fullBleedPublic = isEmpresarial || isClean || isModern || isExecutive

  const planCount = proposalData?.plans?.length ?? 0
  /** Inclui propostas com planos no JSON mesmo se paymentType vier vazio (default no build é 'plans'). */
  const hasPlans = Boolean(
    planCount > 0 && (proposalData?.paymentType ?? 'plans') === 'plans'
  )

  const fetchProposal = useCallback(async () => {
    try {
      const res = await fetch(`/api/p/${slug}`)
      if (!res.ok) {
        throw new Error('Proposta não encontrada')
      }
      const data = await res.json() as Proposal
      setProposal(data)
      const isAcc = data.status === 'accepted'
      setAccepted(isAcc)
      const aid = data.content?.acceptedPlanId
      if (isAcc && typeof aid === 'string' && aid.length > 0) {
        setSelectedPlanId(aid)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar proposta')
    } finally {
      setLoading(false)
    }
  }, [slug])

  const registerView = useCallback(async () => {
    try {
      await fetch(`/api/p/${slug}/view`, { method: 'POST' })
    } catch {
      // ignore
    }
  }, [slug])

  useEffect(() => {
    fetchProposal()
    registerView()
  }, [fetchProposal, registerView])

  const openPlanAcceptModal = useCallback((planId: string) => {
    setSelectedPlanId(planId)
    setPlanModalId(planId)
    setPlanModalComment('')
    setPlanModalOpen(true)
  }, [])

  const submitAccept = async (opts: { selectedPlanId: string | null; clientComment: string }) => {
    setAccepting(true)
    try {
      const payload: { clientComment: string; selectedPlanId?: string } = {
        clientComment: opts.clientComment.trim().slice(0, 2000),
      }
      if (hasPlans) {
        if (!opts.selectedPlanId) {
          toast.error('Selecione um plano para aceitar.')
          return
        }
        payload.selectedPlanId = opts.selectedPlanId
      }

      const res = await fetch(`/api/p/${slug}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao aceitar proposta')
      }
      setAccepted(true)
      setShowConfirmDialog(false)
      setPlanModalOpen(false)
      setPlanModalId(null)
      await fireProposalConfetti({ ...defaultPalette, ...proposalData?.colorPalette })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aceitar proposta')
    } finally {
      setAccepting(false)
    }
  }

  const planModalMeta = useMemo(() => {
    if (!planModalId || !proposalData?.plans?.length) return null
    return proposalData.plans.find((p) => p.id === planModalId) ?? null
  }, [planModalId, proposalData?.plans])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-slate-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando proposta...</p>
        </div>
      </div>
    )
  }

  if (error || !proposal || !proposalData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Proposta não disponível</h1>
          <p className="text-slate-600">{error || 'A proposta solicitada não foi encontrada.'}</p>
        </div>
      </div>
    )
  }

  const billingExample = planModalMeta ? planBillingSuffix(planModalMeta.priceType) : ''

  return (
    <div className={`min-h-screen bg-slate-100 ${fullBleedPublic ? 'py-0' : 'py-6 md:py-10'}`}>
      <div className={fullBleedPublic ? 'w-full px-0' : cn('max-w-4xl mx-auto', SITE_GUTTER_X)}>
        {accepted && !isClean && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <PartyPopper className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-emerald-800 mb-1">Proposta aceita</h2>
            <p className="text-sm text-emerald-600">Entraremos em contato em breve.</p>
          </div>
        )}

        <div className={fullBleedPublic ? '' : 'rounded-2xl overflow-hidden shadow-xl'}>
          <ProposalPreview
            data={proposalData}
            className={`shadow-none ${fullBleedPublic ? 'rounded-none' : ''}`}
            selectedPlanId={hasPlans ? selectedPlanId : undefined}
            onOpenPlanAccept={hasPlans && !accepted && proposal.status !== 'accepted' ? openPlanAcceptModal : undefined}
          />
        </div>

        {!accepted && proposal.status !== 'accepted' && hasPlans && (
          <p className="mt-6 text-center text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
            Primeiro escolha o plano em <strong className="text-slate-700">Selecionar plano</strong>. Depois abre-se a
            janela com o resumo do plano, um campo de comentário (opcional) e o botão para confirmar a aceitação.
          </p>
        )}

        {!accepted && proposal.status !== 'accepted' && !hasPlans && !isClean && (
          <div className="mt-8 sticky bottom-4 z-10">
            <Button
              onClick={() => {
                setSingleAcceptComment('')
                setShowConfirmDialog(true)
              }}
              size="lg"
              className="w-full max-w-md mx-auto flex h-14 text-lg rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {proposal.confirm_button_text || 'Confirmar proposta'}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Aceitar proposta</DialogTitle>
            <DialogDescription>
              Passo a passo: (1) o plano já foi selecionado ao abrir esta janela; (2) opcionalmente preencha o comentário;
              (3) confirme com &quot;Aceitar proposta&quot;.
            </DialogDescription>
          </DialogHeader>
          {planModalMeta && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plano</p>
                <p className="font-semibold text-slate-900">{planModalMeta.name || 'Plano'}</p>
                <p className="mt-2 text-lg font-bold text-slate-800">
                  R$ {planModalMeta.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {billingExample ? (
                    <span className="text-sm font-normal text-slate-500">{billingExample}</span>
                  ) : null}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-accept-comment">Comentário (opcional)</Label>
                <Textarea
                  id="plan-accept-comment"
                  placeholder="Ex.: Gostei deste plano, mas gostaria de ajustar o prazo de entrega."
                  value={planModalComment}
                  onChange={(e) => setPlanModalComment(e.target.value)}
                  rows={3}
                  className="resize-none rounded-xl"
                  maxLength={2000}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setPlanModalOpen(false)}
              className="rounded-lg"
              disabled={accepting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => planModalId && submitAccept({ selectedPlanId: planModalId, clientComment: planModalComment })}
              disabled={accepting || !planModalId}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aceitar proposta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          setShowConfirmDialog(open)
          if (!open) setSingleAcceptComment('')
        }}
      >
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Confirmar aceitação</DialogTitle>
            <DialogDescription>
              Ao aceitar, você concorda com os termos desta proposta. Você pode acrescentar um comentário opcional abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600 mb-1">Proposta</p>
              <p className="font-semibold text-slate-900">{proposal.title}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="single-accept-comment">Comentário (opcional)</Label>
              <Textarea
                id="single-accept-comment"
                placeholder="Alguma observação antes de confirmar?"
                value={singleAcceptComment}
                onChange={(e) => setSingleAcceptComment(e.target.value)}
                rows={3}
                className="resize-none rounded-xl"
                maxLength={2000}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="rounded-lg" disabled={accepting}>
              Cancelar
            </Button>
            <Button
              onClick={() => submitAccept({ selectedPlanId: null, clientComment: singleAcceptComment })}
              disabled={accepting}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
