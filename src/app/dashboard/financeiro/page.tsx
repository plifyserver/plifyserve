'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import {
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  PieChart,
  Loader2,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, subMonths, addMonths, subWeeks, addWeeks, subDays, addDays, isWithinInterval, parseISO } from 'date-fns'
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
import { getNextBillingDueDateIso, shouldShowClientBillingReminderFromClient } from '@/lib/clientBillingReminder'

type FinanceType = 'income' | 'expense'

interface Transaction {
  id: string
  title: string
  type: FinanceType
  amount: number
  date: string
  category: string | null
  project_id: string | null
  project_name: string | null
  client_id: string | null
  client_name: string | null
  notes: string | null
  status: string
  created_at: string
}

interface Client {
  id: string
  name: string
  payment_type?: string | null
  billing_due_day?: number | null
  billing_due_date?: string | null
  created_at?: string | null
}

interface Project {
  id: string
  name: string
}

const CATEGORIES = [
  'Serviços',
  'Produtos',
  'Consultoria',
  'Assinatura',
  'Material',
  'Equipamentos',
  'Marketing',
  'Impostos',
  'Salários',
  'Outros',
]

const TYPE_LABELS: Record<FinanceType | 'all', string> = {
  all: 'Todos',
  income: 'Entradas',
  expense: 'Saídas',
}

const PERIOD_LABELS: Record<'month' | 'week' | 'day', string> = {
  month: 'Mensal',
  week: 'Semanal',
  day: 'Diário',
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | FinanceType>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'week' | 'day'>('month')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [transactionSaving, setTransactionSaving] = useState(false)
  const transactionSaveLockRef = useRef(false)

  const [form, setForm] = useState({
    title: '',
    type: 'income' as FinanceType,
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    category: '',
    client_id: '',
    project_id: '',
    notes: '',
  })

  const fetchData = async () => {
    const [tRes, cRes, pRes] = await Promise.all([
      fetch('/api/finance/transactions', { credentials: 'include' }),
      fetch('/api/clients', { credentials: 'include' }),
      fetch('/api/projects', { credentials: 'include' }),
    ])
    if (tRes.ok) setTransactions(await tRes.json())
    if (cRes.ok) setClients(await cRes.json())
    if (pRes.ok) setProjects(await pRes.json())
  }

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [])

  const { periodStart, periodEnd } = useMemo(() => {
    if (filterPeriod === 'day') {
      return { periodStart: startOfDay(currentMonth), periodEnd: endOfDay(currentMonth) }
    }
    if (filterPeriod === 'week') {
      return { periodStart: startOfWeek(currentMonth, { weekStartsOn: 0 }), periodEnd: endOfWeek(currentMonth, { weekStartsOn: 0 }) }
    }
    return { periodStart: startOfMonth(currentMonth), periodEnd: endOfMonth(currentMonth) }
  }, [currentMonth, filterPeriod])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = parseISO(t.date)
      const inRange = isWithinInterval(txDate, { start: periodStart, end: periodEnd })
      if (!inRange) return false

      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesTitle = t.title.toLowerCase().includes(search)
        const clientName = t.client_name || clients.find((c) => c.id === t.client_id)?.name
        const projectName = t.project_name || projects.find((p) => p.id === t.project_id)?.name
        const matchesClient = clientName?.toLowerCase().includes(search)
        const matchesProject = projectName?.toLowerCase().includes(search)
        const matchesCategory = t.category?.toLowerCase().includes(search)
        if (!matchesTitle && !matchesClient && !matchesProject && !matchesCategory) return false
      }
      return true
    })
  }, [transactions, clients, projects, filterType, filterCategory, searchTerm, periodStart, periodEnd])

  const monthlyIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0)
  }, [filteredTransactions])

  const monthlyExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0)
  }, [filteredTransactions])

  const monthlyBalance = monthlyIncome - monthlyExpense

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)

  const totalBalance = totalIncome - totalExpense

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}
    filteredTransactions.forEach((t) => {
      const cat = t.category || 'Sem categoria'
      breakdown[cat] = (breakdown[cat] || 0) + Number(t.amount)
    })
    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [filteredTransactions])

  const billingReminders = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayDiff = (dateStr: string) => {
      const d = new Date(dateStr + 'T12:00:00')
      d.setHours(0, 0, 0, 0)
      return Math.round((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    }
    return clients
      .filter((c) => shouldShowClientBillingReminderFromClient(c, today))
      .map((c) => {
        const nextDue = getNextBillingDueDateIso(c, today)!
        return { ...c, days: dayDiff(nextDue), nextBillingDue: nextDue }
      })
      .filter((c) => c.days >= 0 && c.days <= 1)
      .sort((a, b) => a.days - b.days)
  }, [clients])

  const openDialog = (tx: Transaction | null) => {
    if (tx) {
      setSelected(tx)
      setForm({
        title: tx.title,
        type: tx.type,
        amount: String(tx.amount),
        date: tx.date || new Date().toISOString().slice(0, 10),
        category: tx.category || '',
        client_id: tx.client_id || '',
        project_id: tx.project_id || '',
        notes: tx.notes || '',
      })
    } else {
      setSelected(null)
      setForm({
        title: '',
        type: 'income',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        category: '',
        client_id: '',
        project_id: '',
        notes: '',
      })
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelected(null)
  }

  const clientName = form.client_id
    ? clients.find((c) => c.id === form.client_id)?.name ?? ''
    : ''

  const projectName = form.project_id
    ? projects.find((p) => p.id === form.project_id)?.name ?? ''
    : ''

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (transactionSaveLockRef.current || transactionSaving) return
    transactionSaveLockRef.current = true
    setTransactionSaving(true)

    const url = selected
      ? `/api/finance/transactions/${selected.id}`
      : '/api/finance/transactions'

    const method = selected ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          amount: Number(form.amount),
          date: form.date,
          category: form.category || null,
          client_id: form.client_id || null,
          client_name: clientName || null,
          project_id: form.project_id || null,
          project_name: projectName || null,
          notes: form.notes || null,
        }),
      })

      if (res.ok) {
        await fetchData()
        closeDialog()
      }
    } finally {
      transactionSaveLockRef.current = false
      setTransactionSaving(false)
    }
  }

  const confirmDelete = (tx: Transaction) => {
    setSelected(tx)
    setDeleteDialogOpen(true)
  }

  const remove = async () => {
    if (!selected) return

    const res = await fetch(`/api/finance/transactions/${selected.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (res.ok) {
      await fetchData()
      setDeleteDialogOpen(false)
      setSelected(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const prevPeriod = () => {
    if (filterPeriod === 'day') setCurrentMonth(subDays(currentMonth, 1))
    else if (filterPeriod === 'week') setCurrentMonth(subWeeks(currentMonth, 1))
    else setCurrentMonth(subMonths(currentMonth, 1))
  }
  const nextPeriod = () => {
    if (filterPeriod === 'day') {
      const next = addDays(currentMonth, 1)
      if (next <= new Date()) setCurrentMonth(next)
    } else if (filterPeriod === 'week') {
      const next = addWeeks(currentMonth, 1)
      if (next <= new Date()) setCurrentMonth(next)
    } else {
      const next = addMonths(currentMonth, 1)
      if (next <= new Date()) setCurrentMonth(next)
    }
  }
  const isNextDisabled = filterPeriod === 'day'
    ? currentMonth >= new Date()
    : filterPeriod === 'week'
      ? endOfWeek(currentMonth, { weekStartsOn: 0 }) >= new Date()
      : currentMonth >= new Date()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gastos Pessoais</h1>
          <p className="text-slate-500">Controle suas receitas e despesas</p>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Os valores aqui não entram na receita mensal do dashboard — aquele total vem só dos clientes (recorrente e
            pontual). Use Gastos Pessoais para o fluxo de caixa real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 rounded-xl border-slate-200"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button
            onClick={() => openDialog(null)}
            disabled={transactionSaving}
            className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      {billingReminders.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-950">Lembretes: cobrar clientes</p>
              <p className="mt-1 text-sm text-amber-900/85">
                Cadastro em Clientes: recorrentes (dia do mês + válido até) ou pontuais (data única). Aviso só{' '}
                <strong>no dia anterior</strong> ao vencimento e <strong>no dia do vencimento</strong>, ao abrir o painel.
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-950">
                {billingReminders.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">{c.name}</span>
                    {' — '}
                    {c.days === 0 ? 'Vence hoje' : 'Vence amanhã'}
                    {c.nextBillingDue
                      ? ` (${format(parseISO(String(c.nextBillingDue)), 'dd/MM/yyyy', { locale: ptBR })})`
                      : ''}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {/* Period Navigation + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <button
            onClick={prevPeriod}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="text-lg font-semibold text-slate-900">
              {filterPeriod === 'day'
                ? format(currentMonth, "dd 'de' MMMM yyyy", { locale: ptBR })
                : filterPeriod === 'week'
                  ? `${format(periodStart, 'dd/MM', { locale: ptBR })} – ${format(periodEnd, 'dd/MM yyyy', { locale: ptBR })}`
                  : format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
          </div>
          <button
            onClick={nextPeriod}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50"
            disabled={isNextDisabled}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as 'month' | 'week' | 'day')}>
          <SelectTrigger className="w-40 rounded-xl">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <span>{PERIOD_LABELS[filterPeriod]}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mensal</SelectItem>
            <SelectItem value="week">Semanal</SelectItem>
            <SelectItem value="day">Diário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saldo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm font-medium">Saldo do Mês</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <p className={`text-3xl font-bold text-slate-900 ${monthlyBalance >= 0 ? '' : 'text-red-600'}`}>
            {formatCurrency(monthlyBalance)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-sm text-slate-600">
            {monthlyBalance >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Positivo</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-red-600">Negativo</span>
              </>
            )}
          </div>
        </div>

        {/* Entradas */}
        <div className="relative overflow-hidden rounded-2xl bg-emerald-100 p-6">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <ArrowUpRight className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
          </div>
          <div className="relative pr-12">
            <span className="text-emerald-700 text-sm font-medium">Entradas</span>
            <p className="text-3xl font-bold text-emerald-800 mt-2">{formatCurrency(monthlyIncome)}</p>
            <p className="mt-2 text-sm text-emerald-600">
              {filteredTransactions.filter((t) => t.type === 'income').length} transações
            </p>
          </div>
        </div>

        {/* Saídas */}
        <div className="relative overflow-hidden rounded-2xl bg-red-100 p-6">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <ArrowDownRight className="w-8 h-8 text-red-600" strokeWidth={2.5} />
          </div>
          <div className="relative pr-12">
            <span className="text-red-700 text-sm font-medium">Saídas</span>
            <p className="text-3xl font-bold text-red-800 mt-2">{formatCurrency(monthlyExpense)}</p>
            <p className="mt-2 text-sm text-red-600">
              {filteredTransactions.filter((t) => t.type === 'expense').length} transações
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Principais Categorias</h3>
            <PieChart className="w-5 h-5 text-slate-400" />
          </div>
          {categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {categoryBreakdown.map(([category, amount], idx) => {
                const total = filteredTransactions.reduce((s, t) => s + Number(t.amount), 0)
                const percentage = total > 0 ? (amount / total) * 100 : 0
                const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-700">{category}</span>
                      <span className="text-slate-500">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[idx % colors.length]} rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Nenhuma transação neste período</p>
          )}
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5" />
            <span className="text-emerald-100 text-sm font-medium">Saldo Total</span>
          </div>
          <p className="text-3xl font-bold mb-4">{formatCurrency(totalBalance)}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-emerald-100">Total entradas</span>
              <span className="font-medium">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-100">Total saídas</span>
              <span className="font-medium">{formatCurrency(totalExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-3">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <SelectTrigger className="w-40 rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <span>{TYPE_LABELS[filterType]}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Entradas</SelectItem>
              <SelectItem value="expense">Saídas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44 rounded-xl">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                filteredTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{tx.title}</p>
                          {(tx.client_name || (tx.client_id && clients.find((c) => c.id === tx.client_id)?.name)) && (
                            <p className="text-sm text-slate-400">
                              {tx.client_name || clients.find((c) => c.id === tx.client_id)?.name}
                            </p>
                          )}
                          {(tx.project_name || (tx.project_id && projects.find((p) => p.id === tx.project_id)?.name)) && (
                            <p className="text-sm text-slate-400">
                              {tx.project_name || projects.find((p) => p.id === tx.project_id)?.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {tx.type === 'income' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${
                            tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">{tx.category || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">
                          {format(parseISO(tx.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => openDialog(tx)} className="gap-2">
                              <Edit2 className="w-4 h-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDelete(tx)}
                              className="gap-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && transactionSaving) return
          setDialogOpen(open)
          if (!open) setSelected(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label htmlFor="title">Descrição *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Pagamento de cliente"
                className="mt-1.5 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as FinanceType })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <span className="flex items-center gap-2">
                      {form.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      {form.type === 'income' ? 'Entrada' : 'Saída'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      <span className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        Entrada
                      </span>
                    </SelectItem>
                    <SelectItem value="expense">
                      <span className="flex items-center gap-2">
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                        Saída
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0,00"
                  className="mt-1.5 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1.5 rounded-xl"
                  required
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <Select
                  value={form.client_id || ''}
                  onValueChange={(v) => setForm({ ...form, client_id: v || '' })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <span className={!form.client_id ? 'text-slate-500' : ''}>
                      {form.client_id
                        ? (clients.find((c) => c.id === form.client_id)?.name ?? 'Cliente')
                        : 'Selecione'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Projeto</Label>
                <Select
                  value={form.project_id || ''}
                  onValueChange={(v) => setForm({ ...form, project_id: v || '' })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <span className={!form.project_id ? 'text-slate-500' : ''}>
                      {form.project_id
                        ? (projects.find((p) => p.id === form.project_id)?.name ?? 'Projeto')
                        : 'Selecione'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observações adicionais..."
                className="mt-1.5 rounded-xl resize-none"
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                className="rounded-xl"
                disabled={transactionSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700"
                disabled={transactionSaving}
              >
                {transactionSaving && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                {transactionSaving
                  ? 'Salvando…'
                  : selected
                    ? 'Salvar Alterações'
                    : 'Criar Transação'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Transação</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Tem certeza que deseja excluir a transação{' '}
            <strong>{selected?.title}</strong>? Esta ação não pode ser desfeita.
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
