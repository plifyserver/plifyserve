'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Play, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusConfig = {
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700', icon: Play },
  paused: { label: 'Pausado', color: 'bg-amber-100 text-amber-700', icon: Play },
  completed: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
} as const

type StatusType = keyof typeof statusConfig

interface Project {
  id: string
  name: string
  client_name: string | null
  status: StatusType
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
    status: 'in_progress' as StatusType,
    progress: 0,
    start_date: '',
    end_date: '',
    responsible: '',
    description: '',
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
      setForm({
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
    }
    setDialogOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = selected ? `/api/projects/${selected.id}` : '/api/projects'
    const method = selected ? 'PUT' : 'POST'

    try {
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

      if (!res.ok) throw new Error('Erro ao salvar')

      await load()
      setDialogOpen(false)
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar projeto')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir este projeto?')) return

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) throw new Error('Erro ao excluir')

      await load()
    } catch (err) {
      console.error(err)
      alert('Erro ao excluir projeto')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projetos</h1>
          <p className="text-slate-500">Acompanhe suas entregas e projetos</p>
        </div>

        <button
          onClick={() => openDialog(null)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl shadow-sm bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="px-4 py-3 text-left">Projeto</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Progresso</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Prazo</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Nenhum projeto encontrado
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const StatusIcon = statusConfig[p.status]?.icon ?? Play

                return (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.name}</p>
                      {p.responsible && (
                        <p className="text-sm text-slate-500">{p.responsible}</p>
                      )}
                    </td>

                    <td className="px-4 py-3">{p.client_name || '—'}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${p.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm">{p.progress || 0}%</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                          statusConfig[p.status]?.color
                        }`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[p.status]?.label}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {p.end_date
                        ? format(new Date(p.end_date), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })
                        : '—'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openDialog(p)}
                          className="p-2 rounded-lg hover:bg-slate-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => remove(p.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
