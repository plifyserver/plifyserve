'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Building2, User, Calendar, Loader2, AlertCircle, FileText, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import confetti from 'canvas-confetti'

interface ProposalContent {
  company?: {
    name?: string
    logo?: string
    cnpj?: string
    address?: string
    email?: string
    phone?: string
  }
  description?: string
  plans?: Array<{
    name: string
    description?: string
    benefits?: string[]
    price: number
    type: 'single' | 'monthly'
  }>
  delivery?: {
    type: 'immediate' | 'scheduled'
    date?: string
  }
  blocks?: Array<{
    id: string
    type: 'text' | 'image'
    content: string
  }>
}

interface Proposal {
  id: string
  title: string
  client_name: string | null
  client_email: string | null
  content: ProposalContent
  status: string
  color_palette: string
  confirm_button_text: string
  views: number
  created_at: string
  accepted_at: string | null
  company: {
    full_name: string | null
    avatar_url: string | null
    company_name: string | null
    company_logo: string | null
  } | null
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
      // Silently fail
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
      
      // Confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao aceitar proposta')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando proposta...</p>
        </div>
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
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

  const companyName = proposal.content?.company?.name || proposal.company?.company_name || proposal.company?.full_name || 'Empresa'
  const companyLogo = proposal.content?.company?.logo || proposal.company?.company_logo || proposal.company?.avatar_url

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img src={companyLogo} alt="" className="h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-900">{companyName}</p>
              <p className="text-sm text-slate-500">Proposta comercial</p>
            </div>
          </div>
          {accepted && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Aceita
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Banner */}
        {accepted && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-in fade-in slide-in-from-top duration-500">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-emerald-800 mb-2">Proposta aceita com sucesso!</h2>
            <p className="text-emerald-600">Entraremos em contato em breve para os próximos passos.</p>
          </div>
        )}

        {/* Proposal Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{proposal.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                {proposal.client_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {proposal.client_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(proposal.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {proposal.content?.description && (
            <div 
              className="prose prose-slate max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: proposal.content.description }}
            />
          )}

          {/* Content Blocks */}
          {proposal.content?.blocks && proposal.content.blocks.length > 0 && (
            <div className="space-y-4 mb-6">
              {proposal.content.blocks.map((block) => (
                <div key={block.id}>
                  {block.type === 'text' ? (
                    <div 
                      className="prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ __html: block.content }}
                    />
                  ) : (
                    <img 
                      src={block.content} 
                      alt="" 
                      className="rounded-xl max-w-full h-auto"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plans */}
        {proposal.content?.plans && proposal.content.plans.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Planos disponíveis</h2>
            <div className={`grid gap-4 ${
              proposal.content.plans.length === 1 
                ? 'max-w-md mx-auto' 
                : proposal.content.plans.length === 2 
                  ? 'md:grid-cols-2' 
                  : 'md:grid-cols-3'
            }`}>
              {proposal.content.plans.map((plan, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                  )}
                  <p className="text-3xl font-bold text-slate-900 mb-4">
                    R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {plan.type === 'monthly' && (
                      <span className="text-base font-normal text-slate-500">/mês</span>
                    )}
                  </p>
                  {plan.benefits && plan.benefits.length > 0 && (
                    <ul className="space-y-2">
                      {plan.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery */}
        {proposal.content?.delivery && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Prazo de entrega</h2>
            <p className="text-slate-600">
              {proposal.content.delivery.type === 'immediate' 
                ? 'Entrega imediata após confirmação'
                : proposal.content.delivery.date 
                  ? `Entrega prevista para ${format(new Date(proposal.content.delivery.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
                  : 'A combinar'
              }
            </p>
          </div>
        )}

        {/* Accept Button */}
        {!accepted && proposal.status !== 'accepted' && (
          <div className="sticky bottom-4">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              size="lg"
              className="w-full h-14 text-lg rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {proposal.confirm_button_text || 'Aceitar Proposta'}
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>Documento gerado por {companyName}</p>
        </div>
      </footer>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar aceitação</DialogTitle>
            <DialogDescription>
              Ao aceitar esta proposta, você concorda com os termos apresentados.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600 mb-2">Proposta</p>
              <p className="font-semibold text-slate-900">{proposal.title}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={accepting}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
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
