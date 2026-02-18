'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { TemplateEditor } from '@/components/TemplateEditor'
import { ArrowLeft } from 'lucide-react'
import type { Proposal } from '@/types'
import type { TemplateStructure } from '@/types'

export default function EditarProposalPage() {
  const params = useParams()
  const router = useRouter()
  const { profile, refreshProfile } = useAuth()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)

  const id = params.id as string
  const isPro = profile?.is_pro ?? false
  const editsRemaining = profile?.edits_remaining ?? 8

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

  const handleSave = async (
    content: TemplateStructure,
    confirmButtonText: string,
    colorPalette: string
  ) => {
    const res = await fetch(`/api/proposals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        content,
        confirm_button_text: confirmButtonText,
        color_palette: colorPalette,
        client_name: content.clientName || null,
        client_email: content.clientEmail || null,
        client_phone: content.clientPhone || null,
        proposal_value: content.value ?? null,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Erro ao salvar: ' + (err.error || 'Erro desconhecido'))
      return
    }

    router.push('/dashboard/propostas')
    router.refresh()
  }

  if (loading || !proposal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-avocado border-t-transparent rounded-full" />
      </div>
    )
  }

  const content = proposal.content as TemplateStructure

  return (
    <div>
      <Link
        href="/dashboard/propostas"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar às propostas
      </Link>

      <h1 className="text-2xl font-bold mb-6">Editar proposta</h1>

      <TemplateEditor
        initialContent={{
          ...content,
          companyLogo: content.companyLogo || profile?.avatar_url || undefined,
          clientName: content.clientName || proposal.client_name || undefined,
          clientEmail: content.clientEmail || proposal.client_email || undefined,
          clientPhone: content.clientPhone || proposal.client_phone || undefined,
          value: content.value ?? proposal.proposal_value ?? undefined,
        }}
        initialConfirmButtonText={proposal.confirm_button_text}
        initialColorPalette={proposal.color_palette}
        onSave={handleSave}
        isPro={isPro}
        editsRemaining={editsRemaining}
        proposalId={id}
      />
    </div>
  )
}
