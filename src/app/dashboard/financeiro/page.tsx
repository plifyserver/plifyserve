'use client'

import { useEffect, useState } from 'react'
import { Plus, ArrowDownCircle, ArrowUpCircle, Wallet, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
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

interface Transaction {
  id: string
  title: string
  type: 'income' | 'expense'
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
}

interface Project {
  id: string
  name: string
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [form, setForm] = useState({
    title: '',
    type: 'income' as 'income' | 'expense',
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

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - expense

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

  const clientName = form.client_id ? clients.find((c) => c.id === form.client_id)?.name ?? '' : ''
  const projectName = form.project_id ? projects.find((p) => p.id === form.project_id)?.name ?? '' : ''

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = selected ? `/api/finance/transactions/${selected.id}` : '/api/finance/transactions'
    const method = selected ? 'PUT' : 'POST'
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
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir esta transação?')) return
    const res = await fetch(`/api/finance/transactions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) await fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-500">Controle suas entradas e saídas.</p>
        </div>
        <Button onClick={() => openDialog(null)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nova transação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 rounded-2xl border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Saldo</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6 rounded-2xl border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Entradas</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6 rounded-2xl border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Saídas</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">
                R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Nenhuma transação. Clique em &quot;Nova transação&quot; para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Data</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Título</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Tipo</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Valor</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Categoria</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Cliente</th>
                  <th className="w-10 p-4" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 text-slate-600">
                      {format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="p-4 font-medium text-slate-900">{t.title}</td>
                    <td className="p-4">
                      <span
                        className={
                          t.type === 'income'
                            ? 'text-emerald-600 font-medium'
                            : 'text-red-600 font-medium'
                        }
                      >
                        {t.type === 'income' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td
                      className={`p-4 text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {t.type === 'income' ? '+' : '-'} R${' '}
                      {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-slate-600">{t.category || '-'}</td>
                    <td className="p-4 text-slate-600">{t.client_name || '-'}</td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar transação' : 'Nova transação'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Pagamento cliente X"
                required
                className="rounded-xl mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: 'income' | 'expense') => setForm({ ...form, type: v })}
                >
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Entrada</SelectItem>
                    <SelectItem value="expense">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex: Serviços"
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label>Projeto</Label>
                <Select
                  value={form.project_id}
                  onValueChange={(v) => setForm({ ...form, project_id: v })}
                >
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
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
