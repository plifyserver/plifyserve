'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { ProposalTemplate3D } from '@/components/ProposalTemplate3D'
import { COLOR_PALETTES } from '@/types'
import type { Proposal, ProposalPlan } from '@/types'

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

  const handleConfirm = async (selectedPlan?: ProposalPlan) => {
    if (!proposal) return

    const res = await fetch(`/api/proposals/${proposal.id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: selectedPlan ? JSON.stringify({ selectedPlan }) : undefined,
    })
    if (res.ok) setConfirmed(true)
  }

  // Confetes com cores da paleta ao aceitar
  useEffect(() => {
    if (!confirmed || !proposal) return
    const palette = COLOR_PALETTES.find((p) => p.id === proposal.color_palette) || COLOR_PALETTES[0]
    const colors = [...palette.colors]

    const duration = 2500
    const end = Date.now() + duration
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [confirmed, proposal])

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
