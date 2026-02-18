'use client'

import { useEffect, useState } from 'react'
import { Plus, FileText, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
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

const TYPE_OPTIONS = [
  { value: 'proposals', label: 'Propostas' },
  { value: 'projects', label: 'Projetos' },
  { value: 'ads', label: 'Anúncios' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'custom', label: 'Personalizado' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
]

interface Report {
  id: string
  title: string
  type: string
  client_id: string | null
  client_name: string | null
  period_start: string | null
  period_end: string | null
  content: string | null
  status: string
  created_at: string
}

interface Client {
  id: string
  name: string
}

export default function RelatoriosPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState<Report | null>(null)
  const [form, setForm] = useState({
    title: '',
    type: 'custom',
    client_id: '',
    period_start: '',
    period_end: '',
    content: '',
    status: 'draft',
  })

  const fetchData = async () => {
    const [rRes, cRes] = await Promise.all([
      fetch('/api/reports', { credentials: 'include' }),
      fetch('/api/clients', { credentials: 'include' }),
    ])
    if (rRes.ok) setReports(await rRes.json())
    if (cRes.ok) setClients(await cRes.json())
  }

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [])

  const openDialog = (report: Report | null) => {
    if (report) {
      setSelected(report)
      setForm({
        title: report.title,
        type: report.type,
        client_id: report.client_id || '',
        period_start: report.period_start || '',
        period_end: report.period_end || '',
        content: report.content || '',
        status: report.status,
      })
    } else {
      setSelected(null)
      setForm({
        title: '',
        type: 'custom',
        client_id: '',
        period_start: '',
        period_end: '',
        content: '',
        status: 'draft',
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
    const clientName = form.client_id ? clients.find((c) => c.id === form.client_id)?.name ?? '' : ''
    const url = selected ? `/api/reports/${selected.id}` : '/api/reports'
    const method = selected ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: form.title,
        type: form.type,
        client_id: form.client_id || null,
        client_name: clientName || null,
        period_start: form.period_start || null,
        period_end: form.period_end || null,
        content: form.content || null,
        status: form.status,
      }),
    })
    if (res.ok) {
      await fetchData()
      closeDialog()
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir este relatório?')) return
    const res = await fetch(`/api/reports/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) await fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-slate-500">Gere relatórios profissionais.</p>
        </div>
        <Button onClick={() => openDialog(null)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Novo relatório
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Nenhum relatório. Clique em &quot;Novo relatório&quot; para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Título</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Tipo</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Cliente</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Período</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Status</th>
                  <th className="w-10 p-4" />
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-900">{r.title}</td>
                    <td className="p-4 text-slate-600">
                      {TYPE_OPTIONS.find((t) => t.value === r.type)?.label ?? r.type}
                    </td>
                    <td className="p-4 text-slate-600">{r.client_name || '-'}</td>
                    <td className="p-4 text-slate-500 text-sm">
                      {r.period_start ? format(new Date(r.period_start), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      {r.period_end ? ` - ${format(new Date(r.period_end), 'dd/MM/yyyy', { locale: ptBR })}` : ''}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${r.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_OPTIONS.find((s) => s.value === r.status)?.label ?? r.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => { setSelected(r); setViewOpen(true); }} className="rounded-lg">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDialog(r)} className="rounded-lg">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => remove(r.id)} className="text-red-600 rounded-lg">
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
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar relatório' : 'Novo relatório'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Relatório mensal" required className="rounded-xl mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Início do período</Label>
                <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Fim do período</Label>
                <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} className="rounded-xl mt-1" />
              </div>
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} className="rounded-xl mt-1" placeholder="Texto ou resumo do relatório..." />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-xl">Cancelar</Button>
              <Button type="submit" className="rounded-xl">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-slate max-w-none">
            {selected?.content ? <div className="whitespace-pre-wrap text-slate-700">{selected.content}</div> : <p className="text-slate-500">Sem conteúdo.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
