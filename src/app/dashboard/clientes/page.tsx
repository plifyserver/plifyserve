'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DASH_SURFACE_CARD, SITE_CONTAINER_LG } from '@/lib/siteLayout'

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
  payment_type?: 'recorrente' | 'pontual'
  recurring_amount?: number | null
  recurring_end_date?: string | null
  billing_due_date?: string | null
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'lead',
    notes: '',
    source: '',
    responsible: '',
    payment_type: 'pontual' as 'recorrente' | 'pontual',
    recurring_amount: '' as string | number,
    recurring_end_date: '' as string,
    billing_due_date: '' as string,
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
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
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
        payment_type: (client.payment_type === 'recorrente' ? 'recorrente' : 'pontual'),
        recurring_amount: client.recurring_amount != null ? client.recurring_amount : '',
        recurring_end_date: client.recurring_end_date || '',
        billing_due_date: client.billing_due_date || '',
      })
    } else {
      setSelected(null)
      setForm({ name: '', email: '', phone: '', company: '', status: 'lead', notes: '', source: '', responsible: '', payment_type: 'pontual', recurring_amount: '', recurring_end_date: '', billing_due_date: '' })
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelected(null)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
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
          payment_type: form.payment_type,
          recurring_amount:
            (form.payment_type === 'recorrente' || form.payment_type === 'pontual') && form.recurring_amount !== ''
              ? Number(form.recurring_amount)
              : null,
          recurring_end_date: form.payment_type === 'recorrente' && form.recurring_end_date ? form.recurring_end_date : null,
          billing_due_date: form.billing_due_date ? form.billing_due_date : null,
        }),
      })
      if (res.ok) {
        await fetchClients()
        closeDialog()
      }
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (client: Client) => {
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setClientToDelete(null)
  }

  const deleteClient = async () => {
    if (!clientToDelete) return
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        await fetchClients()
        closeDeleteDialog()
        if (selected?.id === clientToDelete.id) closeDialog()
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleActiveInactive = async (client: Client) => {
    if (client.status !== 'active' && client.status !== 'inactive') return
    setTogglingId(client.id)
    try {
      const newStatus = client.status === 'active' ? 'inactive' : 'active'
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        await fetchClients()
        if (selected?.id === client.id) setForm((f) => ({ ...f, status: newStatus }))
      }
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className={`space-y-6 ${SITE_CONTAINER_LG}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500">Gerencie sua base de clientes</p>
        </div>
        <button
          onClick={() => openDialog(null)}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--primary-color, #3B82F6)' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Novo Cliente
        </button>
      </div>

      <div className={`p-4 ${DASH_SURFACE_CARD}`}>
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

      <div className={`${DASH_SURFACE_CARD} overflow-hidden`}>
        <table className="w-full table-fixed md:table-auto text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-[34%] px-4 sm:px-5 py-3.5 font-semibold text-slate-700">Nome</th>
              <th className="w-[40%] px-4 sm:px-5 py-3.5 font-semibold text-slate-700">Contato</th>
              <th className="px-5 py-3.5 font-semibold text-slate-700">Status</th>
              <th className="px-5 py-3.5 font-semibold text-slate-700">Responsável</th>
              <th className="px-5 py-3.5 font-semibold text-slate-700">Data</th>
              <th className="w-12 px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 sm:px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 break-words">{client.name}</p>
                      {client.payment_type === 'recorrente' && client.recurring_amount != null && (
                        <p className="text-sm text-slate-500 break-words">
                          R$ {Number(client.recurring_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                          {client.recurring_end_date && (
                            <> · Válido até {format(new Date(client.recurring_end_date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</>
                          )}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-5 py-3.5">
                    <div className="min-w-0 space-y-1">
                      {client.email && <p className="text-sm text-slate-600 break-all leading-snug">{client.email}</p>}
                      {client.phone && <p className="text-sm text-slate-600 break-all leading-snug">{client.phone}</p>}
                      {!client.email && !client.phone && '—'}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {(client.status === 'active' || client.status === 'inactive') ? (
                      <button
                        type="button"
                        onClick={() => toggleActiveInactive(client)}
                        disabled={togglingId === client.id}
                        title={client.status === 'active' ? 'Clique para marcar como Inativo' : 'Clique para marcar como Ativo'}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60 ${statusConfig[client.status]?.color || 'bg-slate-100 text-slate-700'}`}
                      >
                        {togglingId === client.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        {statusConfig[client.status]?.label || client.status}
                      </button>
                    ) : (
                      <span className={`inline-flex px-2 py-1 rounded-lg text-sm font-medium ${statusConfig[client.status]?.color || 'bg-slate-100 text-slate-700'}`}>
                        {statusConfig[client.status]?.label || client.status}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{client.responsible || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {client.created_at ? format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openDialog(client)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(client)}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
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
                {form.payment_type === 'recorrente' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Valor recorrente (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={form.recurring_amount === '' ? '' : Number(form.recurring_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '')
                          setForm((f) => ({ ...f, recurring_amount: v === '' ? '' : Number(v) / 100 }))
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      />
                      <p className="text-xs text-slate-500 mt-0.5">Soma na receita mensal do dashboard (clientes ativos)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Válido até</label>
                      <input
                        type="date"
                        value={form.recurring_end_date}
                        onChange={(e) => setForm((f) => ({ ...f, recurring_end_date: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      />
                      <p className="text-xs text-slate-500 mt-0.5">Até quando esse valor entra no MMR (vazio = sem fim)</p>
                    </div>
                  </>
                )}
                {form.payment_type === 'pontual' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor para receita mensal (R$)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={form.recurring_amount === '' ? '' : Number(form.recurring_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '')
                        setForm((f) => ({ ...f, recurring_amount: v === '' ? '' : Number(v) / 100 }))
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                    <p className="text-xs text-slate-500 mt-0.5">
                      Opcional: valor esperado que entra na receita total mensal do dashboard (igual ao recorrente, para clientes ativos)
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Próxima cobrança / vencimento</label>
                  <input
                    type="date"
                    value={form.billing_due_date}
                    onChange={(e) => setForm((f) => ({ ...f, billing_due_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <p className="text-xs text-slate-500 mt-0.5">
                    Usamos para avisos no dashboard e em Gastos Pessoais (até 5 dias antes, inclusive hoje e amanhã)
                  </p>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de pagamento</label>
                  <select
                    value={form.payment_type}
                    onChange={(e) => setForm((f) => ({ ...f, payment_type: e.target.value as 'recorrente' | 'pontual' }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="pontual">Pontual (pagamento único)</option>
                    <option value="recorrente">Recorrente (pagamento mensal)</option>
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
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--primary-color, #3B82F6)' }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                      Salvando...
                    </>
                  ) : selected ? (
                    'Salvar'
                  ) : (
                    'Criar Cliente'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteDialogOpen && clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Excluir cliente</h2>
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja excluir <strong>{clientToDelete.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteDialog}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={deleteClient}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
