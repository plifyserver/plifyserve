'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProposalTemplate3D } from '@/components/ProposalTemplate3D'
import { ArrowLeft } from 'lucide-react'
import type { Proposal } from '@/types'

export default function VisualizarProposalPage() {
  const params = useParams()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)

  const id = params.id as string

  useEffect(() => {
    const fetchProposal = async () => {
      const res = await fetch(`/api/proposals/${id}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setProposal(data as Proposal)
      }
      setLoading(false)
    }
    fetchProposal()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-avocado border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Proposta não encontrada</p>
        <Link href="/dashboard/propostas" className="text-avocado mt-4 inline-block">
          Voltar às propostas
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/dashboard/propostas"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar às propostas aceitas
      </Link>

      <p className="text-zinc-500 text-sm mb-4">
        Visualização somente leitura. O link público não está mais ativo.
      </p>

      <ProposalTemplate3D
        content={proposal.content}
        confirmButtonText={proposal.confirm_button_text}
        colorPalette={proposal.color_palette}
        isViewMode
      />
    </div>
  )
}
