'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search,
  MoreHorizontal,
  Shield,
  Crown,
  Ban,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Sparkles,
  KeyRound,
  Trash2,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface User {
  id: string
  email: string | null
  full_name: string | null
  plan: string
  plan_type?: string | null
  account_type: string
  templates_count: number
  banned: boolean
  created_at: string
}

const ITEMS_PER_PAGE = 20

function userDisplayName(u: User | null): string {
  if (!u) return '—'
  const name = u.full_name?.trim()
  const mail = u.email?.trim()
  if (name) return name
  if (mail) return mail
  return `Usuário ${u.id.slice(0, 8)}…`
}

function planBadgeLabel(user: User): string {
  if (user.account_type === 'admin' || user.plan_type === 'admin') return 'ADMIN'
  const t = (user.plan_type || user.plan || 'free').toLowerCase()
  if (t === 'pro') return 'PRO'
  if (t === 'essential') return 'ESSENTIAL'
  return (user.plan || 'FREE').toUpperCase()
}

function planBadgeClass(user: User): string {
  if (user.account_type === 'admin' || user.plan_type === 'admin') {
    return 'bg-red-500/20 text-red-400'
  }
  const t = (user.plan_type || user.plan || '').toLowerCase()
  if (t === 'pro') return 'bg-purple-500/20 text-purple-400'
  if (t === 'essential') return 'bg-blue-500/20 text-blue-400'
  return 'bg-slate-500/20 text-slate-400'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionModal, setActionModal] = useState<'plan' | 'type' | 'ban' | 'password' | 'delete' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [newType, setNewType] = useState('')
  const [banReason, setBanReason] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [proposalByUser, setProposalByUser] = useState<Record<string, number>>({})

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

    if (error) {
      toast.error('Erro ao carregar usuários')
      setUsers([])
      setTotalCount(0)
    } else if (data) {
      setUsers(data as User[])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [page, search, supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (!users.length) {
      setProposalByUser({})
      return
    }
    const ids = users.map((u) => u.id)
    let cancelled = false
    ;(async () => {
      const res = await fetch('/api/admin/proposal-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids }),
      })
      const json = await res.json().catch(() => ({}))
      if (cancelled) return
      if (res.ok && json.counts && typeof json.counts === 'object') {
        setProposalByUser(json.counts as Record<string, number>)
      } else {
        setProposalByUser({})
      }
    })()
    return () => {
      cancelled = true
    }
  }, [users])

  const closeModals = () => {
    setActionModal(null)
    setSelectedUser(null)
    setNewPassword('')
    setConfirmPassword('')
  }

  const runPatch = async (payload: Record<string, unknown>) => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Erro ao atualizar')
        return
      }
      toast.success('Alteração salva')
      await fetchUsers()
      closeModals()
    } catch {
      toast.error('Erro de rede')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePlanSave = () => {
    if (!newPlan) return
    void runPatch({ plan: newPlan })
  }

  const handleTypeSave = () => {
    if (!newType) return
    void runPatch({ account_type: newType })
  }

  const handleBanSave = () => {
    if (!selectedUser) return
    void runPatch({
      banned: !selectedUser.banned,
      ban_reason: selectedUser.banned ? null : banReason,
    })
  }

  const handlePasswordSave = async () => {
    if (!selectedUser) return
    if (newPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Erro ao alterar senha')
        return
      }
      toast.success('Senha atualizada')
      closeModals()
    } catch {
      toast.error('Erro de rede')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Erro ao excluir')
        return
      }
      toast.success('Conta excluída')
      await fetchUsers()
      closeModals()
    } catch {
      toast.error('Erro de rede')
    } finally {
      setActionLoading(false)
    }
  }

  const openModal = (user: User, action: typeof actionModal) => {
    setSelectedUser(user)
    setNewPlan(user.plan === 'free' || user.plan === 'essential' || user.plan === 'pro' ? user.plan : 'essential')
    setNewType(user.account_type)
    setBanReason('')
    setNewPassword('')
    setConfirmPassword('')
    setActionModal(action)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciar usuários</h1>
          <p className="text-slate-400">{totalCount} usuários no total</p>
        </div>
        <Button
          onClick={fetchUsers}
          variant="outline"
          className="!gap-2 !border-white/25 !bg-slate-600 !text-white hover:!bg-slate-500 hover:!text-white shadow-md"
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
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            placeholder="Buscar por nome ou email..."
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-sm font-medium text-slate-400">Usuário</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Plano</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Tipo</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Modelos / propostas</th>
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
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${planBadgeClass(user)}`}
                      >
                        {(user.plan_type || user.plan) === 'pro' && <Sparkles className="w-3 h-3" />}
                        {planBadgeLabel(user)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          user.account_type === 'admin'
                            ? 'bg-red-500/20 text-red-400'
                            : user.account_type === 'socio'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {user.account_type === 'admin' && <Shield className="w-3 h-3" />}
                        {user.account_type === 'socio' && <Crown className="w-3 h-3" />}
                        {user.account_type?.toUpperCase() || 'USUARIO'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 text-sm leading-tight">
                      <span className="text-slate-400">Modelos:</span> {user.templates_count || 0}
                      <br />
                      <span className="text-slate-400">Propostas:</span>{' '}
                      {proposalByUser[user.id] ?? '…'}
                    </td>
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
                      <div className="flex items-center gap-0.5 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => openModal(user, 'ban')}
                          className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-amber-400 transition-colors"
                          title={user.banned ? 'Desbanir usuário' : 'Banir usuário'}
                          aria-label={user.banned ? 'Desbanir' : 'Banir'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(user, 'delete')}
                          className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-red-400 transition-colors"
                          title="Excluir conta"
                          aria-label="Excluir conta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <DropdownMenu>
                        <DropdownMenuTrigger
                          type="button"
                          className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors inline-flex"
                          aria-label="Mais ações"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="!bg-slate-800 !border-slate-500 !text-slate-100 min-w-[14rem] shadow-2xl"
                        >
                          <DropdownMenuItem
                            className={`hover:!bg-slate-700 focus:!bg-slate-700 hover:!text-white ${
                              user.account_type === 'admin'
                                ? 'opacity-40 pointer-events-none cursor-not-allowed'
                                : 'cursor-pointer'
                            }`}
                            onClick={() => openModal(user, 'plan')}
                          >
                            <CreditCard className="w-4 h-4 mr-2 shrink-0" />
                            Liberar / alterar plano
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                            onClick={() => openModal(user, 'type')}
                          >
                            <Shield className="w-4 h-4 mr-2 shrink-0" />
                            Tipo de conta (admin / sócio)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:!bg-slate-700 focus:!bg-slate-700 cursor-pointer hover:!text-white"
                            onClick={() => openModal(user, 'password')}
                          >
                            <KeyRound className="w-4 h-4 mr-2 shrink-0" />
                            Redefinir senha
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:!bg-slate-700 focus:!bg-slate-700 cursor-pointer hover:!text-white"
                            onClick={() => openModal(user, 'ban')}
                          >
                            <Ban className="w-4 h-4 mr-2 shrink-0" />
                            {user.banned ? 'Desbanir' : 'Banir'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="!bg-slate-600" />
                          <DropdownMenuItem
                            className="hover:!bg-red-950/60 focus:!bg-red-950/60 !text-red-300 cursor-pointer"
                            onClick={() => openModal(user, 'delete')}
                          >
                            <Trash2 className="w-4 h-4 mr-2 shrink-0" />
                            Excluir conta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

      <Dialog open={actionModal === 'plan'} onOpenChange={(o) => !o && closeModals()}>
        <DialogContent className="border-slate-600 bg-slate-900 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Liberar ou alterar plano</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-slate-200">
              <span className="font-medium text-white">Usuário:</span>{' '}
              <span className="text-white">{userDisplayName(selectedUser)}</span>
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Essential e Pro sem cartão: acesso liberado por 10 anos, assinatura Stripe desvinculada. Free remove
              o acesso pago do gate.
            </p>
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger className="!h-10 !border-slate-500 !bg-slate-800 !text-white [&>span]:!text-white">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent className="!border-slate-500 !bg-slate-800 !text-white">
                <SelectItem value="free" className="!text-slate-100 hover:!bg-slate-700 focus:!bg-slate-700">
                  Free
                </SelectItem>
                <SelectItem value="essential" className="!text-slate-100 hover:!bg-slate-700 focus:!bg-slate-700">
                  Essential
                </SelectItem>
                <SelectItem value="pro" className="!text-slate-100 hover:!bg-slate-700 focus:!bg-slate-700">
                  Pro
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeModals}
              className="!border-slate-500 !bg-slate-800 !text-white hover:!bg-slate-700 hover:!text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePlanSave}
              disabled={actionLoading}
              className="!bg-purple-600 !text-white hover:!bg-purple-700"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionModal === 'type'} onOpenChange={(o) => !o && closeModals()}>
        <DialogContent className="border-slate-600 bg-slate-900 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Tipo de conta</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-200 mb-3">
              <span className="font-medium text-white">Usuário:</span>{' '}
              <span className="text-white">{userDisplayName(selectedUser)}</span>
            </p>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              <strong className="text-white">Admin</strong>: acesso total ao SaaS sem pagamento e painel /admin.
              <strong className="text-white"> Usuário</strong>: acesso conforme plano e pagamento.
            </p>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="!h-10 !border-slate-500 !bg-slate-800 !text-white [&>span]:!text-white">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="!border-slate-500 !bg-slate-800 !text-white">
                <SelectItem value="usuario" className="!text-slate-100 hover:!bg-slate-700 focus:!bg-slate-700">
                  Usuário
                </SelectItem>
                <SelectItem value="socio" className="!text-slate-100 hover:!bg-slate-700 focus:!bg-slate-700">
                  Sócio
                </SelectItem>
                <SelectItem value="admin" className="!text-slate-100 hover:!bg-slate-700 focus:!bg-slate-700">
                  Admin
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeModals}
              className="!border-slate-500 !bg-slate-800 !text-white hover:!bg-slate-700 hover:!text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleTypeSave}
              disabled={actionLoading}
              className="!bg-amber-600 !text-white hover:!bg-amber-700"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionModal === 'ban'} onOpenChange={(o) => !o && closeModals()}>
        <DialogContent className="border-slate-600 bg-slate-900 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedUser?.banned ? 'Desbanir usuário' : 'Banir usuário'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-200 mb-3">
              <span className="font-medium text-white">Usuário:</span>{' '}
              <span className="text-white">{userDisplayName(selectedUser)}</span>
            </p>
            {!selectedUser?.banned && (
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">Motivo do ban</label>
                <Input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Descreva o motivo..."
                  className="!border-slate-500 !bg-slate-800 !text-white !placeholder:text-slate-400"
                />
              </div>
            )}
            {selectedUser?.banned && <p className="text-slate-200">Deseja reativar esta conta?</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeModals}
              className="!border-slate-500 !bg-slate-800 !text-white hover:!bg-slate-700 hover:!text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBanSave}
              disabled={actionLoading}
              className={
                selectedUser?.banned
                  ? '!bg-emerald-600 !text-white hover:!bg-emerald-700'
                  : '!bg-red-600 !text-white hover:!bg-red-700'
              }
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {selectedUser?.banned ? 'Desbanir' : 'Banir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionModal === 'password'} onOpenChange={(o) => !o && closeModals()}>
        <DialogContent className="border-slate-600 bg-slate-900 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Redefinir senha</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-slate-200">
              <span className="font-medium text-white">Conta:</span>{' '}
              <span className="text-white">{userDisplayName(selectedUser)}</span>
            </p>
            <p className="text-xs text-slate-300">
              A nova senha substitui a atual imediatamente. Mínimo 8 caracteres.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Nova senha</label>
              <Input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="!border-slate-500 !bg-slate-800 !text-white !placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">Confirmar senha</label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="!border-slate-500 !bg-slate-800 !text-white !placeholder:text-slate-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeModals}
              className="!border-slate-500 !bg-slate-800 !text-white hover:!bg-slate-700 hover:!text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handlePasswordSave()}
              disabled={actionLoading}
              className="!bg-slate-600 !text-white hover:!bg-slate-500"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionModal === 'delete'} onOpenChange={(o) => !o && closeModals()}>
        <DialogContent className="border-slate-600 bg-slate-900 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Excluir conta</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm text-slate-200">
              Tem certeza? Esta ação remove o login e os dados vinculados a{' '}
              <span className="font-semibold text-white">{userDisplayName(selectedUser)}</span> e não pode ser
              desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeModals}
              className="!border-slate-500 !bg-slate-800 !text-white hover:!bg-slate-700 hover:!text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleDeleteConfirm()}
              disabled={actionLoading}
              className="!bg-red-600 !text-white hover:!bg-red-700"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
