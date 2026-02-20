'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  Search, MoreHorizontal, Shield, Crown, Ban, RefreshCw, 
  ChevronLeft, ChevronRight, Loader2, Check, X, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email: string | null
  full_name: string | null
  plan: string
  account_type: string
  templates_count: number
  banned: boolean
  created_at: string
}

const ITEMS_PER_PAGE = 20

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionModal, setActionModal] = useState<'plan' | 'type' | 'ban' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [newType, setNewType] = useState('')
  const [banReason, setBanReason] = useState('')

  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { data, count, error } = await query

    if (!error && data) {
      setUsers(data)
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [page, search, supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAction = async (action: string) => {
    if (!selectedUser) return
    setActionLoading(true)

    try {
      let updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

      if (action === 'plan' && newPlan) {
        updates.plan = newPlan
        updates.plan_type = newPlan
        updates.templates_limit = newPlan === 'pro' || newPlan === 'admin' ? null : 50
        updates.plan_status = 'active'
        updates.plan_started_at = new Date().toISOString()
      } else if (action === 'type' && newType) {
        updates.account_type = newType
        if (newType === 'admin') {
          updates.plan_type = 'admin'
          updates.templates_limit = null
        }
      } else if (action === 'ban') {
        updates.banned = !selectedUser.banned
        updates.banned_at = selectedUser.banned ? null : new Date().toISOString()
        updates.banned_reason = selectedUser.banned ? null : banReason
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedUser.id)

      if (!error) {
        await fetchUsers()
        setActionModal(null)
        setSelectedUser(null)
      }
    } catch {
      alert('Erro ao executar ação')
    } finally {
      setActionLoading(false)
    }
  }

  const openActionModal = (user: User, action: 'plan' | 'type' | 'ban') => {
    setSelectedUser(user)
    setNewPlan(user.plan)
    setNewType(user.account_type)
    setBanReason('')
    setActionModal(action)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-slate-400">{totalCount} usuários no total</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" className="gap-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Buscar por nome ou email..."
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-sm font-medium text-slate-400">Usuário</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Plano</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Tipo</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Templates</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-white">{user.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        user.plan === 'pro' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : user.plan === 'essential'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {user.plan === 'pro' && <Sparkles className="w-3 h-3" />}
                        {user.plan?.toUpperCase() || 'FREE'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        user.account_type === 'admin' 
                          ? 'bg-red-500/20 text-red-400' 
                          : user.account_type === 'socio'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {user.account_type === 'admin' && <Shield className="w-3 h-3" />}
                        {user.account_type === 'socio' && <Crown className="w-3 h-3" />}
                        {user.account_type?.toUpperCase() || 'USUARIO'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{user.templates_count || 0}</td>
                    <td className="p-4">
                      {user.banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400">
                          <Ban className="w-3 h-3" />
                          Banido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400">
                          <Check className="w-3 h-3" />
                          Ativo
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openActionModal(user, 'plan')}
                          className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                          title="Alterar plano"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openActionModal(user, 'type')}
                          className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                          title="Alterar tipo"
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openActionModal(user, 'ban')}
                          className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-red-400 transition-colors"
                          title={user.banned ? 'Desbanir' : 'Banir'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Página {page + 1} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modals */}
      <Dialog open={actionModal === 'plan'} onOpenChange={() => setActionModal(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-400 mb-3">
              Usuário: <span className="text-white">{selectedUser?.full_name || selectedUser?.email}</span>
            </p>
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="essential">Essential</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal(null)} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancelar
            </Button>
            <Button onClick={() => handleAction('plan')} disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700">
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionModal === 'type'} onOpenChange={() => setActionModal(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Alterar Tipo de Conta</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-400 mb-3">
              Usuário: <span className="text-white">{selectedUser?.full_name || selectedUser?.email}</span>
            </p>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="usuario">Usuário</SelectItem>
                <SelectItem value="socio">Sócio</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal(null)} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancelar
            </Button>
            <Button onClick={() => handleAction('type')} disabled={actionLoading} className="bg-amber-600 hover:bg-amber-700">
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionModal === 'ban'} onOpenChange={() => setActionModal(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{selectedUser?.banned ? 'Desbanir Usuário' : 'Banir Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-400 mb-3">
              Usuário: <span className="text-white">{selectedUser?.full_name || selectedUser?.email}</span>
            </p>
            {!selectedUser?.banned && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Motivo do ban</label>
                <Input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Descreva o motivo..."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            )}
            {selectedUser?.banned && (
              <p className="text-slate-300">Deseja reativar esta conta?</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal(null)} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancelar
            </Button>
            <Button 
              onClick={() => handleAction('ban')} 
              disabled={actionLoading}
              className={selectedUser?.banned ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {selectedUser?.banned ? 'Desbanir' : 'Banir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
