'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Play, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700', icon: Play },
  paused: { label: 'Pausado', color: 'bg-amber-100 text-amber-700', icon: Play },
  completed: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
}

interface Project {
  id: string
  name: string
  client_name: string | null
  status: string
  progress: number
  end_date: string | null
  responsible: string | null
}

export default function ProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Project | null>(null)
  const [form, setForm] = useState({
    name: '',
    client_id: '',
    client_name: '',
    status: 'in_progress',
    progress: 0,
    start_date: '',
    end_date: '',
    responsible: '',
    description: '',
  })

  const load = async () => {
    const [pr, cr] = await Promise.all([
      fetch('/api/projects', { credentials: 'include' }),
      fetch('/api/clients', { credentials: 'include' }),
    ])
    if (pr.ok) setProjects(await pr.json())
    if (cr.ok) setClients(await cr.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = projects.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(search.toLowerCase())
  )
  const activeCount = projects.filter((p) => p.status === 'in_progress').length
  const completedCount = projects.filter((p) => p.status === 'completed').length

  const openDialog = (project: Project | null) => {
    if (project) {
      setSelected(project)
      setForm({
        name: project.name,
        client_id: '',
        client_name: project.client_name || '',
        status: project.status,
        progress: project.progress || 0,
        start_date: '',
        end_date: project.end_date || '',
        responsible: project.responsible || '',
        description: '',
      })
    } else {
      setSelected(null)
      setForm({ name: '', client_id: '', client_name: '', status: 'in_progress', progress: 0, start_date: '', end_date: '', responsible: '', description: '' })
    }
    setDialogOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = selected ? `/api/projects/${selected.id}` : '/api/projects'
    const method = selected ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: form.name,
        client_id: form.client_id || null,
        client_name: form.client_name || null,
        status: form.status,
        progress: form.progress,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        responsible: form.responsible || null,
        description: form.description || null,
      }),
    })
    if (res.ok) {
      await load()
      setDialogOpen(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir este projeto?')) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) await load()
  }

  const StatusIcon = (p: Project) => statusConfig[p.status]?.icon ?? Play

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projetos</h1>
          <p className="text-slate-500">Acompanhe suas entregas e projetos</p>
        </div>
        <button
          onClick={() => openDialog(null)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white"
          style={{ backgroundColor: 'var(--primary-color, #3B82F6)' }}
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border-0 shadow-sm bg-white">
          <p className="text-sm font-medium text-slate-500">Projetos Ativos</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{activeCount}</p>
        </div>
        <div className="p-6 rounded-2xl border-0 shadow-sm bg-white">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{projects.length}</p>
        </div>
        <div className="p-6 rounded-2xl border-0 shadow-sm bg-white">
          <p className="text-sm font-medium text-slate-500">Concluídos</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{completedCount}</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl border-0 shadow-sm bg-white">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Buscar projetos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 py-2 rounded-xl border border-slate-200"
          />
        </div>
      </div>

      <div className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 font-semibold text-slate-700 text-left">Projeto</th>
              <th className="px-4 py-3 font-semibold text-slate-700 text-left">Cliente</th>
              <th className="px-4 py-3 font-semibold text-slate-700 text-left">Progresso</th>
              <th className="px-4 py-3 font-semibold text-slate-700 text-left">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700 text-left">Prazo</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhum projeto encontrado</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    {p.responsible && <p className="text-sm text-slate-500">{p.responsible}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.client_name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                      </div>
                      <span className="text-sm text-slate-600">{p.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${statusConfig[p.status]?.color || 'bg-slate-100'}`}>
                      <StatusIcon {...p} className="w-3 h-3" />
                      {statusConfig[p.status]?.label || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.end_date ? format(new Date(p.end_date), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openDialog(p)} className="p-2 rounded-lg hover:bg-slate-100"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{selected ? 'Editar Projeto' : 'Novo Projeto'}</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Projeto *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <select
                  value={form.client_id}
                  onChange={(e) => {
                    const c = clients.find((x) => x.id === e.target.value)
                    setForm((f) => ({ ...f, client_id: e.target.value, client_name: c?.name || '' }))
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="in_progress">Em Andamento</option>
                    <option value="paused">Pausado</option>
                    <option value="completed">Concluído</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Progresso (%)</label>
                  <input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Término</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                <input value={form.responsible} onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: 'var(--primary-color, #3B82F6)' }}>{selected ? 'Salvar' : 'Criar Projeto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
