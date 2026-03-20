'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Loader2, AlertCircle, PartyPopper } from 'lucide-react'
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
  return {
    template: c.template || 'modern',
    clientName: proposal.client_name || '',
    company: c.company || {
      name: '',
      document: '',
      logo: null,
      address: '',
      email: '',
      phone: '',
    },
    paymentType: c.paymentType || 'plans',
    plans: Array.isArray(c.plans) ? c.plans : [],
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
    <div className={`min-h-screen bg-slate-100 ${isEmpresarial ? 'py-0' : 'py-6 md:py-10'}`}>
      <div className={isEmpresarial ? 'w-full px-0' : 'max-w-4xl mx-auto px-4'}>
        {accepted && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <PartyPopper className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-emerald-800 mb-1">Proposta aceita</h2>
            <p className="text-sm text-emerald-600">Entraremos em contato em breve.</p>
          </div>
        )}

        <div
          className={isEmpresarial ? '' : 'rounded-2xl overflow-hidden shadow-xl'}
        >
          <ProposalPreview
            data={proposalData}
            className={`shadow-none ${isEmpresarial ? 'rounded-none' : ''}`}
            selectedPlanId={hasPlans ? selectedPlanId : undefined}
            onOpenPlanAccept={hasPlans && !accepted && proposal.status !== 'accepted' ? openPlanAcceptModal : undefined}
          />
        </div>

        {!accepted && proposal.status !== 'accepted' && hasPlans && (
          <p className="mt-6 text-center text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
            Clique em <strong className="text-slate-700">Selecionar plano</strong> no card desejado. Você poderá deixar um
            comentário opcional e aceitar a proposta na janela que abrir.
          </p>
        )}

        {!accepted && proposal.status !== 'accepted' && !hasPlans && (
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
              Revise o plano e, se quiser, envie um breve recado para quem preparou a proposta.
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
