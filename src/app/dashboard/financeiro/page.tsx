'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react'
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

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)

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

  const clientName = form.client_id
    ? clients.find((c) => c.id === form.client_id)?.name ?? ''
    : ''

  const projectName = form.project_id
    ? projects.find((p) => p.id === form.project_id)?.name ?? ''
    : ''

  const save = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = selected
      ? `/api/finance/transactions/${selected.id}`
      : '/api/finance/transactions'

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
      {/* resto do JSX permanece igual até o Select */}

      <Select
        value={form.type}
        onValueChange={(v: string) =>
          setForm({ ...form, type: v as FinanceType })
        }
      >
        <SelectTrigger className="rounded-xl mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="income">Entrada</SelectItem>
          <SelectItem value="expense">Saída</SelectItem>
        </SelectContent>
      </Select>

      {/* resto do JSX continua igual */}
    </div>
  )
}
