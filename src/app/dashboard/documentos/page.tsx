'use client'

import { useEffect, useState } from 'react'
import { Plus, FileText, MoreHorizontal, Edit, Trash2, PenLine, Download } from 'lucide-react'
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
import SignatureCanvas from '@/components/contracts/SignatureCanvas'
import { generateSignedPDF, downloadPDF } from '@/lib/pdf-generator'

interface Signatory {
  name: string
  email: string
  signed: boolean
  signed_at?: string | null
  signature_url?: string | null
}

interface Contract {
  id: string
  title: string
  file_url: string | null
  client_id: string | null
  client_name: string | null
  signatories: Signatory[]
  status: string
  sent_at: string | null
  signed_at: string | null
  created_at: string
}

interface Client {
  id: string
  name: string
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'pending', label: 'Pendente' },
  { value: 'signed', label: 'Assinado' },
  { value: 'rejected', label: 'Rejeitado' },
]

export default function DocumentosPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Contract | null>(null)
  const [signatoryIndex, setSignatoryIndex] = useState<number>(0)
  const [signatoriesForSign, setSignatoriesForSign] = useState<Signatory[]>([])
  const [form, setForm] = useState({
    title: '',
    file_url: '',
    client_id: '',
    status: 'draft',
    signatories: [] as { name: string; email: string; signed: boolean; signed_at?: string | null; signature_url?: string | null }[],
  })

  const fetchData = async () => {
    const [cRes, clRes] = await Promise.all([
      fetch('/api/contracts', { credentials: 'include' }),
      fetch('/api/clients', { credentials: 'include' }),
    ])
    if (cRes.ok) setContracts(await cRes.json())
    if (clRes.ok) setClients(await clRes.json())
  }

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [])

  const openDialog = (contract: Contract | null) => {
    if (contract) {
      setSelected(contract)
      setForm({
        title: contract.title,
        file_url: contract.file_url || '',
        client_id: contract.client_id || '',
        status: contract.status,
        signatories: contract.signatories?.length ? contract.signatories : [],
      })
    } else {
      setSelected(null)
      setForm({
        title: '',
        file_url: '',
        client_id: '',
        status: 'draft',
        signatories: [],
      })
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelected(null)
  }

  const addSignatory = () => {
    setForm((f) => ({
      ...f,
      signatories: [...f.signatories, { name: '', email: '', signed: false }],
    }))
  }

  const removeSignatory = (i: number) => {
    setForm((f) => ({
      ...f,
      signatories: f.signatories.filter((_, idx) => idx !== i),
    }))
  }

  const updateSignatory = (i: number, field: 'name' | 'email', value: string) => {
    setForm((f) => ({
      ...f,
      signatories: f.signatories.map((s, idx) =>
        idx === i ? { ...s, [field]: value } : s
      ),
    }))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = selected ? `/api/contracts/${selected.id}` : '/api/contracts'
    const method = selected ? 'PUT' : 'POST'
    const clientName = form.client_id ? clients.find((c) => c.id === form.client_id)?.name ?? '' : ''
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: form.title,
        file_url: form.file_url || null,
        client_id: form.client_id || null,
        client_name: clientName || null,
        status: form.status,
        signatories: form.signatories,
      }),
    })
    if (res.ok) {
      await fetchData()
      closeDialog()
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir este contrato?')) return
    const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) await fetchData()
  }

  const openSign = (contract: Contract, idx: number) => {
    setSelected(contract)
    setSignatoryIndex(idx)
    setSignatoriesForSign(form.signatories.length ? form.signatories : contract.signatories || [])
    setSignDialogOpen(true)
  }

  const handleSignatureSave = async (dataUrl: string) => {
    if (!selected) return
    const signatories = [...signatoriesForSign]
    if (!signatories[signatoryIndex]) {
      setSignDialogOpen(false)
      return
    }
    signatories[signatoryIndex] = {
      ...signatories[signatoryIndex],
      signed: true,
      signed_at: new Date().toISOString(),
      signature_url: dataUrl,
    }
    const allSigned = signatories.every((s) => s.signed)
    const res = await fetch(`/api/contracts/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...selected,
        signatories,
        status: allSigned ? 'signed' : 'pending',
        signed_at: allSigned ? new Date().toISOString() : selected.signed_at,
      }),
    })
    if (res.ok) {
      await fetchData()
      setForm((f) => ({ ...f, signatories }))
      setSignDialogOpen(false)
      setSelected(null)
    }
  }

  const handleGeneratePDF = async (contract: Contract) => {
    if (!contract.file_url) {
      alert('Adicione a URL do PDF do contrato para gerar o documento assinado.')
      return
    }
    try {
      const signatures = (contract.signatories || []) as { name: string; email: string; signed: boolean; signed_at?: string | null; signature_url?: string | null }[]
      const pdfBytes = await generateSignedPDF(
        {
          id: contract.id,
          title: contract.title,
          file_url: contract.file_url,
          status: contract.status,
          created_at: contract.created_at,
          sent_at: contract.sent_at,
          signed_at: contract.signed_at,
        },
        signatures
      )
      downloadPDF(pdfBytes, `contrato-assinado-${contract.title.slice(0, 30)}.pdf`)
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar PDF. Verifique se a URL do PDF está acessível.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-slate-500">Gerencie contratos e assinaturas digitais.</p>
        </div>
        <Button onClick={() => openDialog(null)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Novo contrato
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando...</div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Nenhum contrato. Clique em &quot;Novo contrato&quot; para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Título</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Cliente</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Criado</th>
                  <th className="w-10 p-4" />
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-900">{c.title}</td>
                    <td className="p-4 text-slate-600">{c.client_name || '-'}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                          c.status === 'signed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : c.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {STATUS_OPTIONS.find((s) => s.value === c.status)?.label ?? c.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {format(new Date(c.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openDialog(c)} className="rounded-lg">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleGeneratePDF(c)}
                            className="rounded-lg"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Gerar PDF assinado
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => remove(c.id)}
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
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar contrato' : 'Novo contrato'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Contrato de prestação de serviços"
                required
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>URL do PDF</Label>
              <Input
                value={form.file_url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                placeholder="https://... ou deixe em branco"
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Cliente</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
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
              <div className="flex items-center justify-between mb-2">
                <Label>Signatários</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSignatory} className="rounded-lg">
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {form.signatories.map((sig, i) => (
                  <div key={i} className="flex gap-2 items-center p-2 bg-slate-50 rounded-xl">
                    <Input
                      placeholder="Nome"
                      value={sig.name}
                      onChange={(e) => updateSignatory(i, 'name', e.target.value)}
                      className="rounded-lg flex-1"
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={sig.email}
                      onChange={(e) => updateSignatory(i, 'email', e.target.value)}
                      className="rounded-lg flex-1"
                    />
                    {selected && (
                      <Button
                        type="button"
                        variant={sig.signed ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => openSign(selected, i)}
                        className="rounded-lg"
                      >
                        <PenLine className="w-4 h-4 mr-1" />
                        {sig.signed ? 'Assinado' : 'Assinar'}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSignatory(i)}
                      className="text-red-500 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
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

      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Assinatura</DialogTitle>
          </DialogHeader>
          <SignatureCanvas
            onSave={handleSignatureSave}
            onCancel={() => setSignDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
