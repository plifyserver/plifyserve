'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, MoreHorizontal, Edit, Archive } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Inativo', color: 'bg-slate-100 text-slate-700' },
  lead: { label: 'Lead', color: 'bg-blue-100 text-blue-700' },
  archived: { label: 'Arquivado', color: 'bg-red-100 text-red-700' },
}

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  status: string
  responsible: string | null
  created_at: string
  notes?: string | null
  source?: string | null
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Client | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'lead',
    notes: '',
    source: '',
    responsible: '',
  })

  const fetchClients = async () => {
    const res = await fetch('/api/clients', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setClients(data)
    }
  }

  useEffect(() => {
    fetchClients().finally(() => setLoading(false))
  }, [])

  const filtered = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openDialog = (client: Client | null) => {
    if (client) {
      setSelected(client)
      setForm({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        status: client.status,
        notes: client.notes || '',
        source: client.source || '',
        responsible: client.responsible || '',
      })
    } else {
      setSelected(null)
      setForm({ name: '', email: '', phone: '', company: '', status: 'lead', notes: '', source: '', responsible: '' })
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelected(null)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = selected ? `/api/clients/${selected.id}` : '/api/clients'
    const method = selected ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        company: form.company || null,
        status: form.status,
        notes: form.notes || null,
        source: form.source || null,
        responsible: form.responsible || null,
      }),
    })
    if (res.ok) {
      await fetchClients()
      closeDialog()
    }
  }

  const archive = async (client: Client) => {
    await fetch(`/api/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'archived' }),
    })
    await fetchClients()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500">Gerencie sua base de clientes</p>
        </div>
        <button
          onClick={() => openDialog(null)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--primary-color, #3B82F6)' }}
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      <div className="p-4 rounded-2xl border-0 shadow-sm bg-white">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white"
          />
        </div>
      </div>

      <div className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 font-semibold text-slate-700">Nome</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Contato</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Responsável</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Data</th>
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
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{client.name}</p>
                      {client.company && <p className="text-sm text-slate-500">{client.company}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {client.email && <p className="text-sm text-slate-600">{client.email}</p>}
                      {client.phone && <p className="text-sm text-slate-600">{client.phone}</p>}
                      {!client.email && !client.phone && '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-sm font-medium ${statusConfig[client.status]?.color || 'bg-slate-100 text-slate-700'}`}>
                      {statusConfig[client.status]?.label || client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{client.responsible || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {client.created_at ? format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openDialog(client)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => archive(client)}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                        title="Arquivar"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
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
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {selected ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="lead">Lead</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Origem</label>
                  <input
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                    placeholder="Ex: Indicação, Instagram, Google..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                  <input
                    value={form.responsible}
                    onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeDialog} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-medium"
                  style={{ backgroundColor: 'var(--primary-color, #3B82F6)' }}
                >
                  {selected ? 'Salvar' : 'Criar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
