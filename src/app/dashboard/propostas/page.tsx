'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Copy, Edit, Trash2, Files, CheckCircle, XCircle, Plus, Search } from 'lucide-react'
import type { Proposal } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
  const [searchQuery, setSearchQuery] = useState('')

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

  const filteredProposals = searchQuery.trim()
    ? proposals.filter(
        (p) =>
          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.slug?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : proposals

  const filteredAccepted = searchQuery.trim()
    ? acceptedProposals.filter(
        (p) =>
          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.slug?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : acceptedProposals

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Propostas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie suas propostas: edite, duplique ou exclua</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar propostas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 rounded-lg border-slate-200 bg-white"
            />
          </div>
          <Button asChild size="default" className="h-9 rounded-lg gap-1.5 bg-slate-900 hover:bg-slate-800">
            <Link href="/dashboard/templates">
              <Plus className="w-4 h-4" />
              Nova proposta
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          Todas ({proposals.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('accepted')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'accepted' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <CheckCircle className="w-4 h-4" />
          Aceitas ({acceptedProposals.length})
        </button>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="rounded-2xl border-0 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeTab === 'all' ? (
        <div className="space-y-4">
          {filteredProposals.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500 mb-4">
                  {searchQuery ? 'Nenhuma proposta encontrada com esse filtro.' : 'Nenhuma proposta ainda.'}
                </p>
                {!searchQuery && (
                  <Button asChild variant="default" className="rounded-lg gap-2 bg-slate-900 hover:bg-slate-800">
                    <Link href="/dashboard/templates">Criar primeira proposta</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredProposals.map((proposal) => (
              <Card key={proposal.id} className="rounded-2xl border-0 shadow-sm overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{proposal.title}</h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-xs font-medium',
                            proposal.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {proposal.status === 'open' ? 'Aberta' : 'Ignorada'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 truncate max-w-md" title={typeof window !== 'undefined' ? `${window.location.origin}/p/${proposal.slug}` : undefined}>
                        /p/{proposal.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        onClick={() => copyLink(proposal.slug)}
                        title="Copiar link"
                      >
                        {copiedId === proposal.slug ? (
                          <span className="text-xs text-emerald-600 font-medium">Copiado!</span>
                        ) : (
                          <Copy className="w-4 h-4 text-slate-500" />
                        )}
                      </Button>
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg" title="Editar">
                        <Link href={`/dashboard/propostas/editar/${proposal.id}`}>
                          <Edit className="w-4 h-4 text-slate-500" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        onClick={() => duplicateProposal(proposal)}
                        title="Duplicar"
                      >
                        <Files className="w-4 h-4 text-slate-500" />
                      </Button>
                      {proposal.status === 'open' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => markAsIgnored(proposal)}
                          title="Marcar como ignorada"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteProposal(proposal.id)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAccepted.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-sm border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">
                  {searchQuery ? 'Nenhuma proposta aceita com esse filtro.' : 'Nenhuma proposta aceita ainda.'}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-slate-500 mt-1">
                    Quando seus clientes confirmarem pelo link, as propostas aparecerão aqui.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredAccepted.map((proposal) => (
              <Card key={proposal.id} className="rounded-2xl border-0 shadow-sm border-emerald-200/60 bg-emerald-50/30 overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{proposal.title}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Aceita em{' '}
                          {proposal.accepted_at
                            ? new Date(proposal.accepted_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })
                            : '—'}
                        </p>
                        <p className="text-sm font-medium text-emerald-600 mt-1">
                          Valor: R$ {Number(proposal.proposal_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="rounded-lg shrink-0 border-slate-200">
                      <Link href={`/dashboard/propostas/${proposal.id}/visualizar`}>Ver como era o template</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
