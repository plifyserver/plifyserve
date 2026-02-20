'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  RefreshCw, ChevronLeft, ChevronRight, Loader2, 
  Activity, User, Calendar, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface Log {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  created_at: string
  user?: {
    email: string | null
    full_name: string | null
  }
}

const ITEMS_PER_PAGE = 50

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-emerald-500/20 text-emerald-400',
  logout: 'bg-slate-500/20 text-slate-400',
  register: 'bg-blue-500/20 text-blue-400',
  template_create: 'bg-purple-500/20 text-purple-400',
  template_delete: 'bg-red-500/20 text-red-400',
  template_update: 'bg-amber-500/20 text-amber-400',
  image_upload: 'bg-cyan-500/20 text-cyan-400',
  upgrade_plan: 'bg-pink-500/20 text-pink-400',
  upgrade_socio: 'bg-amber-500/20 text-amber-400',
  default: 'bg-slate-500/20 text-slate-400',
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [actionFilter, setActionFilter] = useState<string>('all')

  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        user:profiles!activity_logs_user_id_fkey(email, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)

    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter)
    }

    const { data, count, error } = await query

    if (!error && data) {
      setLogs(data as Log[])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [page, actionFilter, supabase])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const getActionColor = (action: string) => ACTION_COLORS[action] || ACTION_COLORS.default

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
          <p className="text-slate-400">{totalCount} eventos registrados</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" className="gap-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0) }}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filtrar por ação" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="register">Registro</SelectItem>
              <SelectItem value="template_create">Criar template</SelectItem>
              <SelectItem value="template_delete">Excluir template</SelectItem>
              <SelectItem value="image_upload">Upload de imagem</SelectItem>
              <SelectItem value="upgrade_plan">Upgrade de plano</SelectItem>
              <SelectItem value="upgrade_socio">Virar sócio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-sm font-medium text-slate-400">Data/Hora</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Usuário</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Ação</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Recurso</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Nenhum log encontrado
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300">
                          {new Date(log.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300 text-sm truncate max-w-[150px]">
                          {log.user?.full_name || log.user?.email || 'Sistema'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getActionColor(log.action)}`}>
                        <Activity className="w-3 h-3" />
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.resource_type && (
                        <span className="text-sm text-slate-400">
                          {log.resource_type}
                          {log.resource_id && (
                            <span className="text-slate-500 ml-1">
                              #{log.resource_id.slice(0, 8)}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-500 font-mono">
                        {log.ip_address || '-'}
                      </span>
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
    </div>
  )
}
