'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DASH_SURFACE_CARD, SITE_CONTAINER_LG } from '@/lib/siteLayout'
import { PlanQuotaInline, usePlanQuotaFull } from '@/components/billing/PlanQuotaInline'
import { useBilling } from '@/hooks/useBilling'

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
  billing_due_day?: number | null
  billing_due_date?: string | null
}

export default function ClientesPage() {
  const { refetch: refetchBilling } = useBilling()
  const clientsQuotaFull = usePlanQuotaFull('clients')

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const saveClientLockRef = useRef(false)
  const deleteClientLockRef = useRef(false)
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
    status: 'active',
    notes: '',
    source: '',
    responsible: '',
    payment_type: 'pontual' as 'recorrente' | 'pontual',
    recurring_amount: '' as string | number,
    billing_due_day: '' as string | number,
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
      const legacyDay =
        client.payment_type === 'recorrente' &&
        (client.billing_due_day == null || client.billing_due_day < 1) &&
        client.billing_due_date
          ? parseInt(String(client.billing_due_date).slice(8, 10), 10)
          : NaN
      const initialDay =
        client.billing_due_day != null && client.billing_due_day >= 1 && client.billing_due_day <= 31
          ? client.billing_due_day
          : Number.isFinite(legacyDay) && legacyDay >= 1 && legacyDay <= 31
            ? legacyDay
            : ''
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
        billing_due_day: initialDay === '' ? '' : initialDay,
        billing_due_date: client.payment_type === 'pontual' ? client.billing_due_date || '' : '',
      })
    } else {
      setSelected(null)
      setForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'active',
        notes: '',
        source: '',
        responsible: '',
        payment_type: 'pontual',
        recurring_amount: '',
        billing_due_day: '',
        billing_due_date: '',
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
    if (saveClientLockRef.current || saving) return
    saveClientLockRef.current = true
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
          recurring_end_date: null,
          billing_due_day:
            form.payment_type === 'recorrente' && form.billing_due_day !== ''
              ? Number(form.billing_due_day)
              : null,
          billing_due_date:
            form.payment_type === 'pontual' && form.billing_due_date ? form.billing_due_date : null,
        }),
      })
      if (res.ok) {
        await fetchClients()
        void refetchBilling()
        closeDialog()
      }
    } finally {
      saveClientLockRef.current = false
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
    if (!clientToDelete || deleteClientLockRef.current || saving) return
    deleteClientLockRef.current = true
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        await fetchClients()
        void refetchBilling()
        closeDeleteDialog()
        if (selected?.id === clientToDelete.id) closeDialog()
      }
    } finally {
      deleteClientLockRef.current = false
      setSaving(false)
    }
  }

  const renderClientBillingBlock = (client: Client) => (
    <>
      {client.payment_type === 'pontual' && client.recurring_amount != null && (
        <p className="text-sm text-slate-500 break-words">
          Fatura: R${' '}
          {Number(client.recurring_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      )}
      {client.payment_type === 'recorrente' && client.recurring_amount != null && (
        <p className="text-sm text-slate-500 break-words">
          Parcela: R${' '}
          {Number(client.recurring_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          {client.billing_due_day != null && client.billing_due_day >= 1 && (
            <> · vence dia {client.billing_due_day}</>
          )}
        </p>
      )}
      {client.payment_type === 'recorrente' &&
        (client.billing_due_day == null || client.billing_due_day < 1) &&
        client.billing_due_date && (
          <p className="text-xs text-amber-700 mt-0.5">
            Legado: data {format(new Date(client.billing_due_date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}{' '}
            — defina o dia do vencimento
          </p>
        )}
    </>
  )

  const renderStatusControl = (client: Client) =>
    client.status === 'active' || client.status === 'inactive' ? (
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
      <span
        className={`inline-flex px-2 py-1 rounded-lg text-sm font-medium ${statusConfig[client.status]?.color || 'bg-slate-100 text-slate-700'}`}
      >
        {statusConfig[client.status]?.label || client.status}
      </span>
    )

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
          <PlanQuotaInline kind="clients" className="mt-2" />
        </div>
        <button
          onClick={() => openDialog(null)}
          disabled={saving || clientsQuotaFull}
          title={clientsQuotaFull ? 'Limite de 20 clientes no plano Essential. Faça upgrade para o Pro.' : undefined}
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
        {loading ? (
          <div className="px-5 py-10 text-center text-slate-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-500">Nenhum cliente encontrado</div>
        ) : (
          <>
            {/* Mobile: cartões empilhados (evita colunas table-fixed sobrepostas) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((client) => (
                <div key={client.id} className="p-4 space-y-3">
                  <div className="flex gap-3 items-start justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium text-slate-900 break-words leading-snug">{client.name}</p>
                      <div className="space-y-0.5">{renderClientBillingBlock(client)}</div>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        type="button"
                        onClick={() => openDialog(client)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteDialog(client)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1 text-sm text-slate-600">
                    {client.email && <p className="break-all leading-snug">{client.email}</p>}
                    {client.phone && <p className="break-all leading-snug">{client.phone}</p>}
                    {!client.email && !client.phone && <p className="text-slate-400">—</p>}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="shrink-0">{renderStatusControl(client)}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span>
                        <span className="font-medium text-slate-600">Resp.:</span>{' '}
                        {client.responsible || '—'}
                      </span>
                      <span>
                        <span className="font-medium text-slate-600">Cadastro:</span>{' '}
                        {client.created_at
                          ? format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[720px] text-left lg:min-w-0 lg:table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="w-[28%] px-5 py-3.5 font-semibold text-slate-700">Nome</th>
                    <th className="w-[32%] px-5 py-3.5 font-semibold text-slate-700">Contato</th>
                    <th className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-700">Status</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-700">Responsável</th>
                    <th className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-700">Data</th>
                    <th className="w-24 whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-700">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 align-top">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 break-words">{client.name}</p>
                          <div className="mt-0.5 space-y-0.5">{renderClientBillingBlock(client)}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <div className="min-w-0 space-y-1">
                          {client.email && (
                            <p className="text-sm text-slate-600 break-all leading-snug">{client.email}</p>
                          )}
                          {client.phone && (
                            <p className="text-sm text-slate-600 break-all leading-snug">{client.phone}</p>
                          )}
                          {!client.email && !client.phone && '—'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-top whitespace-nowrap">{renderStatusControl(client)}</td>
                      <td className="px-5 py-3.5 align-top text-slate-600 break-words">{client.responsible || '—'}</td>
                      <td className="px-5 py-3.5 align-top text-slate-500 whitespace-nowrap">
                        {client.created_at ? format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                      </td>
                      <td className="px-5 py-3.5 align-top text-right">
                        <div className="inline-flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openDialog(client)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(client)}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de pagamento</label>
                  <select
                    value={form.payment_type}
                    onChange={(e) => {
                      const v = e.target.value as 'recorrente' | 'pontual'
                      setForm((f) => ({
                        ...f,
                        payment_type: v,
                        ...(v === 'recorrente' ? { billing_due_date: '' } : { billing_due_day: '' }),
                      }))
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="pontual">Pontual</option>
                    <option value="recorrente">Recorrente</option>
                  </select>
                </div>
                {form.payment_type === 'pontual' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor da fatura (R$)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={
                        form.recurring_amount === ''
                          ? ''
                          : Number(form.recurring_amount).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                      }
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '')
                        setForm((f) => ({ ...f, recurring_amount: v === '' ? '' : Number(v) / 100 }))
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                    <p className="text-xs text-slate-500 mt-0.5">
                      Entra na <strong>Receita total mês</strong> do dashboard no mês da <strong>data de vencimento</strong>{' '}
                      (se preenchida) ou no mês do cadastro, para clientes ativos.
                    </p>
                  </div>
                )}
                {form.payment_type === 'recorrente' && (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Valor da parcela (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={
                          form.recurring_amount === ''
                            ? ''
                            : Number(form.recurring_amount).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                        }
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '')
                          setForm((f) => ({ ...f, recurring_amount: v === '' ? '' : Number(v) / 100 }))
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Dia do vencimento (todo mês)</label>
                      <select
                        value={form.billing_due_day === '' ? '' : String(form.billing_due_day)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            billing_due_day: e.target.value === '' ? '' : Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="">— Escolha o dia —</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            Dia {d}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-0.5">
                        O <strong>valor da parcela</strong> entra no <strong>MMR</strong> e na <strong>Receita total mês</strong>{' '}
                        assim que o cliente está Ativo ou Lead. Aviso no dashboard no dia anterior e no dia do vencimento.
                      </p>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white sm:max-w-xs"
                  >
                    <option value="active">Ativo</option>
                    <option value="lead">Lead</option>
                    <option value="inactive">Inativo</option>
                    <option value="archived">Arquivado</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Receita e MMR do dashboard consideram apenas <strong>Ativo</strong> e <strong>Lead</strong>.
                  </p>
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
