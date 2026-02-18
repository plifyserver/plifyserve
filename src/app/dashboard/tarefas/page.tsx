'use client'

import { useEffect, useState } from 'react'
import { Plus, CheckSquare, Square, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em progresso' },
  { value: 'completed', label: 'Concluída' },
]
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
]

interface Task {
  id: string
  title: string
  client_id: string | null
  client_name: string | null
  responsible: string | null
  due_date: string | null
  status: string
  priority: string
  description: string | null
  created_at: string
}

interface Client {
  id: string
  name: string
}

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Task | null>(null)
  const [form, setForm] = useState({
    title: '',
    client_id: '',
    responsible: '',
    due_date: '',
    status: 'pending',
    priority: 'medium',
    description: '',
  })

  const fetchData = async () => {
    const base = '/api/tasks'
    const url = statusFilter ? `${base}?status=${statusFilter}` : base
    const [tRes, cRes] = await Promise.all([
      fetch(url, { credentials: 'include' }),
      fetch('/api/clients', { credentials: 'include' }),
    ])
    if (tRes.ok) setTasks(await tRes.json())
    if (cRes.ok) setClients(await cRes.json())
  }

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [statusFilter])

  const filtered = tasks

  const openDialog = (task: Task | null) => {
    if (task) {
      setSelected(task)
      setForm({
        title: task.title,
        client_id: task.client_id || '',
        responsible: task.responsible || '',
        due_date: task.due_date || '',
        status: task.status,
        priority: task.priority,
        description: task.description || '',
      })
    } else {
      setSelected(null)
      setForm({
        title: '',
        client_id: '',
        responsible: '',
        due_date: '',
        status: 'pending',
        priority: 'medium',
        description: '',
      })
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelected(null)
  }

  const clientName = form.client_id ? clients.find((c) => c.id === form.client_id)?.name ?? '' : ''

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = selected ? `/api/tasks/${selected.id}` : '/api/tasks'
    const method = selected ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: form.title,
        client_id: form.client_id || null,
        client_name: clientName || null,
        responsible: form.responsible || null,
        due_date: form.due_date || null,
        status: form.status,
        priority: form.priority,
        description: form.description || null,
      }),
    })
    if (res.ok) {
      await fetchData()
      closeDialog()
    }
  }

  const toggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...task, status: newStatus }),
    })
    if (res.ok) await fetchData()
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir esta tarefa?')) return
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) await fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tarefas</h1>
          <p className="text-slate-500">Organize e acompanhe suas atividades.</p>
        </div>
        <Button onClick={() => openDialog(null)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nova tarefa
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Label className="text-slate-600">Filtrar por status:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 rounded-xl">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Nenhuma tarefa. Clique em &quot;Nova tarefa&quot; para começar.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-4 p-4 hover:bg-slate-50/50 group"
              >
                <button
                  type="button"
                  onClick={() => toggleComplete(t)}
                  className="flex-shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {t.status === 'completed' ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${t.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}
                  >
                    {t.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    {t.client_name && <span>{t.client_name}</span>}
                    {t.due_date && (
                      <span>
                        Venc: {format(new Date(t.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : t.priority === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {PRIORITY_OPTIONS.find((p) => p.value === t.priority)?.label ?? t.priority}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-lg ${
                    t.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : t.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {STATUS_OPTIONS.find((s) => s.value === t.status)?.label ?? t.status}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => openDialog(t)} className="rounded-lg">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => remove(t.id)}
                      className="text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Revisar proposta"
                required
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Cliente</Label>
              <Select
                value={form.client_id}
                onValueChange={(v) => setForm({ ...form, client_id: v })}
              >
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Responsável</Label>
                <Input
                  value={form.responsible}
                  onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                  placeholder="Nome"
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="rounded-xl mt-1"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
