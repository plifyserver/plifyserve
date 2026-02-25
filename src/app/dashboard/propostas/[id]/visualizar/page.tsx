'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { ProposalPreview, type ProposalData, type ColorPalette } from '@/components/proposals/ProposalPreview'
import type { Proposal } from '@/types'

const defaultPalette: ColorPalette = {
  primary: '#6366F1',
  secondary: '#1E293B',
  accent: '#F59E0B',
  background: '#FFFFFF',
  text: '#334155',
}

function buildProposalData(proposal: Proposal): ProposalData {
  const c = (proposal.content as unknown as Record<string, unknown>) || {}
  const company = (c.company as ProposalData['company']) || {
    name: '',
    document: '',
    logo: null,
    address: '',
    email: '',
    phone: '',
  }
  const delivery = c.delivery as { type?: string; date?: string } | undefined
  return {
    template: (c.template as ProposalData['template']) || 'modern',
    clientName: proposal.client_name || '',
    company,
    paymentType: (c.paymentType as ProposalData['paymentType']) || 'plans',
    plans: Array.isArray(c.plans) ? (c.plans as ProposalData['plans']) : [],
    singlePrice: typeof c.singlePrice === 'number' ? c.singlePrice : 0,
    deliveryType: delivery?.type === 'scheduled' ? 'scheduled' : 'immediate',
    deliveryDate: (delivery?.date as string) || '',
    description: (c.description as string) || '',
    blocks: Array.isArray(c.blocks) ? (c.blocks as ProposalData['blocks']) : [],
    colorPalette:
      c.colorPalette && typeof c.colorPalette === 'object'
        ? (c.colorPalette as ColorPalette)
        : defaultPalette,
  }
}

export default function VisualizarProposalPage() {
  const params = useParams()
  const id = params.id as string
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const proposalData = useMemo(() => (proposal ? buildProposalData(proposal) : null), [proposal])

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const res = await fetch(`/api/proposals/${id}`, { credentials: 'include' })
        if (!res.ok) {
          setError('Proposta não encontrada')
          return
        }
        const data = await res.json()
        setProposal(data as Proposal)
      } catch {
        setError('Erro ao carregar proposta')
      } finally {
        setLoading(false)
      }
    }
    fetchProposal()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    )
  }

  if (error || !proposal || !proposalData) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-slate-600 font-medium">{error || 'Proposta não encontrada'}</p>
        <Link
          href="/dashboard/propostas"
          className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar às propostas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/dashboard/propostas"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar às propostas
        </Link>
        <span className="text-sm text-slate-500">
          Visualização em modo leitura — como o cliente vê a proposta
        </span>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
          <ProposalPreview data={proposalData} className="shadow-none" />
        </div>
      </div>
    </div>
  )
}
