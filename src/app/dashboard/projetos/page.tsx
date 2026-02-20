'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Users,
  FolderKanban,
  MoreHorizontal,
  Calendar,
  Target,
  TrendingUp,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react'
import { format, differenceInDays, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const statusConfig = {
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700', bgColor: 'bg-blue-500', icon: Play },
  paused: { label: 'Pausado', color: 'bg-amber-100 text-amber-700', bgColor: 'bg-amber-500', icon: Pause },
  completed: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700', bgColor: 'bg-emerald-500', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', bgColor: 'bg-red-500', icon: Clock },
} as const

type StatusType = keyof typeof statusConfig

interface Project {
  id: string
  name: string
  description: string | null
  client_id: string | null
  client_name: string | null
  status: StatusType
  progress: number
  start_date: string | null
  end_date: string | null
  responsible: string | null
  created_at: string
}

interface Client {
  id: string
  name: string
}

export default function ProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Project | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    client_id: '',
    status: 'in_progress' as StatusType,
    progress: 0,
    start_date: '',
    end_date: '',
    responsible: '',
  })

  const load = async () => {
    try {
      const [pr, cr] = await Promise.all([
        fetch('/api/projects', { credentials: 'include' }),
        fetch('/api/clients', { credentials: 'include' }),
      ])
      if (pr.ok) setProjects(await pr.json())
      if (cr.ok) setClients(await cr.json())
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          p.name?.toLowerCase().includes(s) ||
          p.client_name?.toLowerCase().includes(s) ||
          p.responsible?.toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [projects, filterStatus, search])

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.status === 'in_progress').length,
    paused: projects.filter((p) => p.status === 'paused').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    avgProgress: projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0,
  }), [projects])

  const openDialog = (project: Project | null) => {
    if (project) {
      setSelected(project)
      setForm({
        name: project.name,
        description: project.description || '',
        client_id: project.client_id || '',
        status: project.status,
        progress: project.progress || 0,
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        responsible: project.responsible || '',
      })
    } else {
      setSelected(null)
      setForm({
        name: '',
        description: '',
        client_id: '',
        status: 'in_progress',
        progress: 0,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: '',
        responsible: '',
      })
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelected(null)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()

    const clientName = form.client_id
      ? clients.find((c) => c.id === form.client_id)?.name || null
      : null

    const url = selected ? `/api/projects/${selected.id}` : '/api/projects'
    const method = selected ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          client_id: form.client_id || null,
          client_name: clientName,
          status: form.status,
          progress: form.progress,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          responsible: form.responsible || null,
        }),
      })

      if (!res.ok) throw new Error('Erro ao salvar')
      await load()
      closeDialog()
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar projeto')
    }
  }

  const confirmDelete = (project: Project) => {
    setSelected(project)
    setDeleteDialogOpen(true)
  }

  const remove = async () => {
    if (!selected) return

    try {
      const res = await fetch(`/api/projects/${selected.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Erro ao excluir')
      await load()
      setDeleteDialogOpen(false)
      setSelected(null)
    } catch (err) {
      console.error(err)
      alert('Erro ao excluir projeto')
    }
  }

  const getDeadlineStatus = (endDate: string | null) => {
    if (!endDate) return null
    const date = parseISO(endDate)
    const daysLeft = differenceInDays(date, new Date())
    if (isPast(date)) return { text: 'Atrasado', color: 'text-red-600', bg: 'bg-red-100' }
    if (daysLeft <= 3) return { text: `${daysLeft}d restantes`, color: 'text-amber-600', bg: 'bg-amber-100' }
    if (daysLeft <= 7) return { text: `${daysLeft}d restantes`, color: 'text-blue-600', bg: 'bg-blue-100' }
    return { text: format(date, 'dd/MM/yyyy', { locale: ptBR }), color: 'text-slate-600', bg: '' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projetos</h1>
          <p className="text-slate-500">Gerencie e acompanhe seus projetos</p>
        </div>
        <Button
          onClick={() => openDialog(null)}
          className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Em Andamento</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Play className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.active}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Total</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Concluídos</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.completed}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Progresso Médio</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.avgProgress}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar projetos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44 rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects List/Grid */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Projeto
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Progresso
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Prazo
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Nenhum projeto encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((project) => {
                    const StatusIcon = statusConfig[project.status]?.icon || Play
                    const deadline = getDeadlineStatus(project.end_date)

                    return (
                      <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">{project.name}</p>
                            {project.responsible && (
                              <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
                                <Users className="w-3 h-3" />
                                {project.responsible}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600">{project.client_name || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  project.progress >= 100
                                    ? 'bg-emerald-500'
                                    : project.progress >= 50
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, project.progress || 0)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-700 w-10">
                              {project.progress || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              statusConfig[project.status]?.color
                            }`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[project.status]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {deadline ? (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${deadline.bg} ${deadline.color}`}>
                              <Calendar className="w-3 h-3" />
                              {deadline.text}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openDialog(project)} className="gap-2">
                                <Edit2 className="w-4 h-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => confirmDelete(project)}
                                className="gap-2 text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              Nenhum projeto encontrado
            </div>
          ) : (
            filtered.map((project) => {
              const StatusIcon = statusConfig[project.status]?.icon || Play
              const deadline = getDeadlineStatus(project.end_date)

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
                      {project.client_name && (
                        <p className="text-sm text-slate-400 truncate">{project.client_name}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openDialog(project)} className="gap-2">
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => confirmDelete(project)}
                          className="gap-2 text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-slate-500">Progresso</span>
                        <span className="font-medium text-slate-700">{project.progress || 0}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            project.progress >= 100
                              ? 'bg-emerald-500'
                              : project.progress >= 50
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, project.progress || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          statusConfig[project.status]?.color
                        }`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[project.status]?.label}
                      </span>

                      {deadline && (
                        <span className={`text-xs ${deadline.color}`}>
                          {deadline.text}
                        </span>
                      )}
                    </div>

                    {project.responsible && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                          {project.responsible.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-500 truncate">{project.responsible}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Redesign do Site"
                className="mt-1.5 rounded-xl"
                required
              />
            </div>

            <div>
              <Label>Cliente</Label>
              <Select
                value={form.client_id}
                onValueChange={(v) => setForm({ ...form, client_id: v })}
              >
                <SelectTrigger className="mt-1.5 rounded-xl">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as StatusType })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="progress">Progresso (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                  className="mt-1.5 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Data Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="end_date">Data Término</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="mt-1.5 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="responsible">Responsável</Label>
              <Input
                id="responsible"
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                placeholder="Nome do responsável"
                className="mt-1.5 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição do projeto..."
                className="mt-1.5 rounded-xl resize-none"
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700">
                {selected ? 'Salvar Alterações' : 'Criar Projeto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Projeto</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Tem certeza que deseja excluir o projeto{' '}
            <strong>{selected?.name}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={remove}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
