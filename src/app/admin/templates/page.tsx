'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface AdminProposal {
  id: string
  title: string
  user_id: string
  status: string
  created_at: string
  public_slug: string | null
  slug: string | null
  user: { email: string | null; full_name: string | null } | null
}

const ITEMS_PER_PAGE = 20

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<AdminProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const fetchProposals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (search.trim()) params.set('q', search.trim())
      const res = await fetch(`/api/admin/proposals?${params}`, { credentials: 'include' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(typeof json.error === 'string' ? json.error : 'Erro ao carregar propostas')
        setProposals([])
        setTotalCount(0)
      } else {
        setProposals(json.proposals || [])
        setTotalCount(json.totalCount ?? 0)
      }
    } catch {
      toast.error('Erro de rede')
      setProposals([])
      setTotalCount(0)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => {
    void fetchProposals()
  }, [fetchProposals])

  useEffect(() => {
    setPage(0)
  }, [search])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Propostas</h1>
          <p className="text-slate-400">Todas as propostas criadas no sistema</p>
        </div>
        <Button
          onClick={() => void fetchProposals()}
          variant="outline"
          className="!gap-2 !border-white/25 !bg-slate-600 !text-white hover:!bg-slate-500 hover:!text-white shadow-md shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou cliente…"
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-20 text-slate-400">Nenhuma proposta encontrada</div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-slate-400">
                  <th className="p-3 font-medium">Título</th>
                  <th className="p-3 font-medium">Usuário</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Criada</th>
                  <th className="p-3 font-medium w-24">Ação</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="p-3 text-white font-medium max-w-[200px] truncate">{p.title}</td>
                    <td className="p-3 text-slate-300">
                      <div className="truncate max-w-[180px]">
                        {p.user?.full_name || p.user?.email || p.user_id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="p-3 text-slate-400">{p.status}</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="!border-white/20 !bg-slate-600 !text-white hover:!bg-slate-500"
                        onClick={() => window.open(`/dashboard/propostas/editar/${p.id}`, '_blank')}
                        title="Abrir no painel"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-400">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="!border-white/20 !bg-slate-600 !text-white hover:!bg-slate-500 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="!border-white/20 !bg-slate-600 !text-white hover:!bg-slate-500 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
