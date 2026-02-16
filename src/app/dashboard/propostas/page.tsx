'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Copy, Edit, Trash2, Files, CheckCircle, XCircle } from 'lucide-react'
import type { Proposal } from '@/types'

function getAcceptedValue(proposal: Proposal): number {
  const v = proposal.proposal_value
  if (v != null && !Number.isNaN(Number(v))) return Number(v)
  const plan = (proposal.content as { acceptedPlan?: { price?: number } })?.acceptedPlan
  if (plan && typeof plan.price === 'number') return plan.price
  return 0
}

export default function PropostasPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [acceptedProposals, setAcceptedProposals] = useState<Proposal[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'accepted'>('all')
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchProposals = async () => {
      const res = await fetch('/api/proposals', { credentials: 'include' })
      if (!res.ok) return

      const all = (await res.json()) as Proposal[]
      setProposals(all.filter((p) => p.status !== 'accepted').sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))
      setAcceptedProposals(all.filter((p) => p.status === 'accepted'))
      setLoading(false)
    }
    fetchProposals()
  }, [])

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(slug)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const duplicateProposal = async (proposal: Proposal) => {
    const newSlug = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        template_base_id: proposal.template_base_id,
        title: `${proposal.title} (cópia)`,
        slug: newSlug,
        status: 'open',
        content: proposal.content,
        color_palette: proposal.color_palette,
        confirm_button_text: proposal.confirm_button_text,
        client_name: proposal.client_name ?? null,
        client_email: proposal.client_email ?? null,
        client_phone: proposal.client_phone ?? null,
        proposal_value: proposal.proposal_value ?? null,
      }),
    })
    const data = await res.json().catch(() => null)
    if (res.ok && data) {
      setProposals((prev) => [data as Proposal, ...prev])
      return data as Proposal
    }
    alert((data as { error?: string })?.error || 'Erro ao duplicar proposta')
    return null
  }

  const deleteProposal = async (id: string) => {
    if (!confirm('Excluir esta proposta?')) return
    await fetch(`/api/proposals/${id}`, { method: 'DELETE', credentials: 'include' })
    setProposals((prev) => prev.filter((p) => p.id !== id))
    setAcceptedProposals((prev) => prev.filter((p) => p.id !== id))
  }

  const markAsIgnored = async (proposal: Proposal) => {
    const res = await fetch(`/api/proposals/${proposal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'ignored' }),
    })
    if (res.ok) {
      setProposals((prev) => prev.map((p) => (p.id === proposal.id ? { ...p, status: 'ignored' } as Proposal : p)))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Propostas</h1>
      <p className="text-gray-500 mb-6">
        Gerencie suas propostas: edite, duplique ou exclua. Você pode gerar várias propostas com o mesmo template — use Duplicar e edite depois o que quiser.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'all' ? 'bg-avocado text-white' : 'bg-gray-200 text-gray-700 hover:text-gray-900'
          }`}
        >
          Todas ({proposals.length})
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'accepted' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700 hover:text-gray-900'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Aceitas ({acceptedProposals.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'all' ? (
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <div className="p-12 rounded-xl bg-gray-100 border border-gray-200 text-center">
              <p className="text-gray-500 mb-4">Nenhuma proposta ainda</p>
              <Link
                href="/dashboard/templates"
                className="text-avocado hover:text-avocado-light font-medium"
              >
                Criar primeira proposta →
              </Link>
            </div>
          ) : (
            proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="p-4 rounded-xl bg-gray-100 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{proposal.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        proposal.status === 'open'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-600'
                      }`}
                    >
                      {proposal.status === 'open' ? 'Aberta' : 'Ignorada'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {window.location.origin}/p/{proposal.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyLink(proposal.slug)}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Copiar link"
                  >
                    {copiedId === proposal.slug ? (
                      <span className="text-emerald-400 text-sm">Copiado!</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <Link
                    href={`/dashboard/propostas/editar/${proposal.id}`}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => duplicateProposal(proposal)}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Duplicar proposta (nova com mesmo template)"
                  >
                    <Files className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => markAsIgnored(proposal)}
                    className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors"
                    title="Marcar como ignorada"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProposal(proposal.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {acceptedProposals.length === 0 ? (
            <div className="p-12 rounded-xl bg-gray-100 border border-gray-200 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma proposta aceita ainda</p>
              <p className="text-gray-500 text-sm mt-1">
                Quando seus clientes clicarem em confirmar, aparecerão aqui
              </p>
            </div>
          ) : (
            acceptedProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-semibold">{proposal.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Aceita em {proposal.accepted_at ? new Date(proposal.accepted_at).toLocaleDateString('pt-BR') : '-'}
                  </p>
                  <p className="text-sm text-emerald-400 mt-1">
                    Valor: R$ {Number(getAcceptedValue(proposal)).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/dashboard/propostas/${proposal.id}/visualizar`}
                    className="text-avocado hover:text-avocado-light text-sm font-medium"
                  >
                    Ver como era o template →
                  </Link>
                  <button
                    onClick={async () => {
                      const newP = await duplicateProposal(proposal)
                      if (newP) setActiveTab('all')
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium text-gray-700 transition-colors"
                    title="Duplicar e editar como nova proposta"
                  >
                    <Files className="w-4 h-4" />
                    Duplicar e editar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
