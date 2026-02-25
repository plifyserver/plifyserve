'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Loader2, AlertCircle, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ProposalPreview, type ProposalData, type ColorPalette } from '@/components/proposals/ProposalPreview'
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
    paymentType?: ProposalData['paymentType']
    singlePrice?: number
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

  const proposalData = useMemo(() => proposal ? buildProposalData(proposal) : null, [proposal])

  const fetchProposal = useCallback(async () => {
    try {
      const res = await fetch(`/api/p/${slug}`)
      if (!res.ok) {
        throw new Error('Proposta não encontrada')
      }
      const data = await res.json()
      setProposal(data)
      setAccepted(data.status === 'accepted')
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

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const res = await fetch(`/api/p/${slug}/accept`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao aceitar proposta')
      }
      setAccepted(true)
      setShowConfirmDialog(false)
      const confetti = (await import('canvas-confetti')).default
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aceitar proposta')
    } finally {
      setAccepting(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-slate-100 py-6 md:py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Banner de aceita */}
        {accepted && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <PartyPopper className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-emerald-800 mb-1">Proposta aceita</h2>
            <p className="text-sm text-emerald-600">Entraremos em contato em breve.</p>
          </div>
        )}

        {/* Preview igual ao do editor: mesmo layout e cores */}
        <div className="rounded-2xl overflow-hidden shadow-xl">
          <ProposalPreview data={proposalData} className="shadow-none" />
        </div>

        {/* Botão aceitar */}
        {!accepted && proposal.status !== 'accepted' && (
          <div className="mt-8 sticky bottom-4 z-10">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              size="lg"
              className="w-full max-w-md mx-auto flex h-14 text-lg rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {proposal.confirm_button_text || 'Aceitar proposta'}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Confirmar aceitação</DialogTitle>
            <DialogDescription>
              Ao aceitar, você concorda com os termos desta proposta.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600 mb-1">Proposta</p>
              <p className="font-semibold text-slate-900">{proposal.title}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="rounded-lg">
              Cancelar
            </Button>
            <Button
              onClick={handleAccept}
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
