'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Edit, Trash2, Files, CheckCircle, XCircle, Plus, Search, Eye, Send, BarChart3, Loader2 } from 'lucide-react'
import type { Proposal } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { getAcceptanceClientComment } from '@/lib/proposalAcceptanceComment'
import { toast } from 'sonner'
import { TemplateSelector, type TemplateType } from '@/components/proposals/TemplateSelector'
import { AcceptedPlanCallout } from '@/components/proposals/AcceptedPlanCallout'

function getProposalPublicUrl(proposal: Proposal): string {
  const slug = proposal.public_slug || proposal.slug
  return `${window.location.origin}/p/${slug}`
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function PropostasPage() {
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [acceptedProposals, setAcceptedProposals] = useState<Proposal[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'accepted'>('all')
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteProposalId, setDeleteProposalId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)

  const handleSelectProposalTemplate = (template: TemplateType) => {
    const qs = new URLSearchParams({ template })
    router.push(`/dashboard/propostas/nova?${qs.toString()}`)
  }

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

  const shareProposalWhatsApp = (proposal: Proposal) => {
    const url = getProposalPublicUrl(proposal)
    const text = `Segue a proposta da nossa empresa:\n\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    toast.success('WhatsApp aberto — escolha o contato para enviar.')
  }

  const copyLink = (proposal: Proposal) => {
    const url = getProposalPublicUrl(proposal)
    navigator.clipboard.writeText(url)
    setCopiedId(proposal.id)
    toast.success('Link copiado!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const sendProposal = async (proposal: Proposal) => {
    if (proposal.status === 'accepted') {
      toast.error('Esta proposta já foi aceita')
      return
    }
    
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'sent' }),
      })
      
      if (res.ok) {
        setProposals((prev) => 
          prev.map((p) => (p.id === proposal.id ? { ...p, status: 'sent' } as Proposal : p))
        )
        copyLink(proposal)
        toast.success('Proposta enviada! Link copiado.')
      }
    } catch {
      toast.error('Erro ao enviar proposta')
    }
  }

  const duplicateProposal = async (proposal: Proposal, switchToAll = false) => {
    setDuplicatingId(proposal.id)
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: `${proposal.title || 'Proposta'} (cópia)`,
          client_name: proposal.client_name ?? null,
          client_email: proposal.client_email ?? null,
          content: proposal.content ?? {},
          status: 'draft',
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data) {
        setProposals((prev) => [data as Proposal, ...prev])
        if (switchToAll) setActiveTab('all')
        toast.success(switchToAll ? 'Proposta replicada. Ela está em Todas para você editar.' : 'Proposta duplicada.')
        return data as Proposal
      }
      toast.error((data as { error?: string })?.error || 'Erro ao duplicar proposta')
      return null
    } finally {
      setDuplicatingId(null)
    }
  }

  const deleteProposal = async (id: string) => {
    const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      setProposals((prev) => prev.filter((p) => p.id !== id))
      setAcceptedProposals((prev) => prev.filter((p) => p.id !== id))
      setDeleteProposalId(null)
      toast.success('Proposta excluída.')
    } else toast.error('Erro ao excluir proposta.')
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
          <Button 
            size="default" 
            className="h-9 rounded-lg gap-1.5 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setTemplateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Nova proposta
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
                  <Button 
                    variant="default" 
                    className="rounded-lg gap-2 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setTemplateModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Criar primeira proposta
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredProposals.map((proposal) => (
              <Card key={proposal.id} className="rounded-2xl border-0 shadow-sm overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{proposal.title}</h3>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                            proposal.status === 'draft' && 'bg-slate-100 text-slate-600',
                            proposal.status === 'sent' && 'bg-blue-100 text-blue-700',
                            proposal.status === 'viewed' && 'bg-amber-100 text-amber-700',
                            proposal.status === 'open' && 'bg-blue-100 text-blue-700',
                            proposal.status === 'ignored' && 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {proposal.status === 'draft' && 'Rascunho'}
                          {proposal.status === 'sent' && 'Enviada'}
                          {proposal.status === 'viewed' && (
                            <>
                              <Eye className="w-3 h-3" />
                              Visualizada
                            </>
                          )}
                          {proposal.status === 'open' && 'Aberta'}
                          {proposal.status === 'ignored' && 'Ignorada'}
                        </span>
                        {(proposal.views ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                            <BarChart3 className="w-3 h-3" />
                            {proposal.views} {(proposal.views ?? 0) === 1 ? 'view' : 'views'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500">
                        {proposal.client_name && (
                          <span>{proposal.client_name}</span>
                        )}
                        <span className="truncate max-w-[200px]" title={`/p/${proposal.public_slug || proposal.slug}`}>
                          /p/{proposal.public_slug || proposal.slug}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg gap-1.5 border-slate-200"
                        onClick={() => router.push(`/dashboard/propostas/${proposal.id}/visualizar`)}
                        title="Visualizar proposta"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                        <span className="hidden sm:inline">Visualizar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg gap-1.5 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        title="Editar proposta"
                        onClick={() => router.push(`/dashboard/propostas/nova?id=${proposal.id}`)}
                      >
                        <Edit className="w-4 h-4 text-slate-600" />
                        Editar
                      </Button>
                      {proposal.status === 'draft' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 rounded-lg gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => sendProposal(proposal)}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Enviar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        onClick={() => copyLink(proposal)}
                        title="Copiar link"
                      >
                        {copiedId === proposal.id ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-500" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        title="Enviar pelo WhatsApp"
                        onClick={() => shareProposalWhatsApp(proposal)}
                      >
                        <WhatsAppIcon className="h-[18px] w-[18px]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        onClick={() => duplicateProposal(proposal)}
                        title="Duplicar"
                        disabled={duplicatingId === proposal.id}
                      >
                        {duplicatingId === proposal.id ? (
                          <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                        ) : (
                          <Files className="w-4 h-4 text-slate-500" />
                        )}
                      </Button>
                      {(proposal.status === 'open' || proposal.status === 'sent' || proposal.status === 'viewed') && (
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
                        onClick={() => setDeleteProposalId(proposal.id)}
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
            filteredAccepted.map((proposal) => {
              const clientComment = getAcceptanceClientComment(proposal.content)
              return (
              <Card key={proposal.id} className="rounded-2xl border-0 shadow-sm border-emerald-200/60 bg-emerald-50/30 overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
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
                        <AcceptedPlanCallout content={proposal.content} compact />
                        {clientComment ? (
                          <div className="mt-3 rounded-lg border border-emerald-200/80 bg-white/70 px-3 py-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                              Comentário do cliente
                            </p>
                            <p className="mt-1 text-sm text-slate-700 line-clamp-4 whitespace-pre-wrap">
                              {clientComment}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-lg gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        onClick={() => router.push(`/dashboard/propostas/${proposal.id}/visualizar`)}
                      >
                        <Eye className="w-4 h-4" />
                        Visualizar proposta
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-slate-200 gap-1.5"
                        onClick={() => duplicateProposal(proposal, true)}
                        disabled={duplicatingId === proposal.id}
                      >
                        {duplicatingId === proposal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        Replicar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-red-200 text-red-700 hover:bg-red-50 gap-1.5"
                        onClick={() => setDeleteProposalId(proposal.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )
            })
          )}
        </div>
      )}

      {/* Modal confirmar exclusão de proposta */}
      <Dialog open={!!deleteProposalId} onOpenChange={(open) => !open && setDeleteProposalId(null)}>
        <DialogContent className="rounded-2xl border border-slate-200 shadow-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Excluir proposta?</DialogTitle>
            <DialogDescription className="text-slate-500">
              Esta ação não pode ser desfeita. A proposta será removida permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-lg" onClick={() => setDeleteProposalId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="rounded-lg bg-red-600 hover:bg-red-700"
              onClick={() => deleteProposalId && deleteProposal(deleteProposalId)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TemplateSelector
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSelect={handleSelectProposalTemplate}
      />
    </div>
  )
}
