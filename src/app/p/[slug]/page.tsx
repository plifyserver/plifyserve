'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ProposalTemplate3D } from '@/components/ProposalTemplate3D'
import type { Proposal } from '@/types'

export default function PublicProposalPage() {
  const params = useParams()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)

  const slug = params.slug as string

  useEffect(() => {
    const fetchProposal = async () => {
      const res = await fetch(`/api/proposals/slug/${slug}`)
      if (res.ok) {
        const data = await res.json()
        setProposal(data as Proposal)
      }
      setLoading(false)
    }
    fetchProposal()
  }, [slug])

  const handleConfirm = async () => {
    if (!proposal) return

    const res = await fetch(`/api/proposals/${proposal.id}/accept`, {
      method: 'POST',
    })
    if (res.ok) setConfirmed(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-2 border-avocado border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold mb-2">Proposta não encontrada</h1>
        <p className="text-zinc-400">
          Este link pode ter expirado ou a proposta já foi aceita.
        </p>
      </div>
    )
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Proposta aceita!</h1>
        <p className="text-zinc-400 text-center">
          O contratante foi notificado. Em breve ele entrará em contato.
        </p>
      </div>
    )
  }

  return (
    <ProposalTemplate3D
      content={proposal.content}
      confirmButtonText={proposal.confirm_button_text}
      colorPalette={proposal.color_palette}
      onConfirm={handleConfirm}
    />
  )
}
