'use client'

import { useEffect, useState } from 'react'
import { Plus, FileText, MoreHorizontal, Edit, Trash2, PenLine, Download, Eye, MapPin, Calendar, Clock, User, Link2, CheckCircle, Send, Copy, ExternalLink, AlertTriangle, Search, Mail } from 'lucide-react'
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
import SignatureCanvas, { type SignatureData } from '@/components/contracts/SignatureCanvas'
import ContractUploader from '@/components/contracts/ContractUploader'
import { generateSignedPDF, downloadPDF } from '@/lib/pdf-generator'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface Signatory {
  name: string
  email: string
  signed: boolean
  signed_at?: string | null
  signature_url?: string | null
  cpf?: string | null
  birth_date?: string | null
  location?: {
    latitude: number | null
    longitude: number | null
    address: string | null
  } | null
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
  { value: 'sent', label: 'Enviado' },
  { value: 'pending', label: 'Pendente' },
  { value: 'signed', label: 'Assinado' },
  { value: 'expired', label: 'Expirado' },
]

export default function DocumentosPage() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Contract | null>(null)
  const [signatoryIndex, setSignatoryIndex] = useState<number>(0)
  const [signatoriesForSign, setSignatoriesForSign] = useState<Signatory[]>([])
  const [signatureDetailsOpen, setSignatureDetailsOpen] = useState(false)
  const [selectedSignatory, setSelectedSignatory] = useState<Signatory | null>(null)
  const [viewContractOpen, setViewContractOpen] = useState(false)
  const [viewContract, setViewContract] = useState<Contract | null>(null)
  const [docSearch, setDocSearch] = useState('')
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

  const handleFileChange = (url: string | null) => {
    setForm((f) => ({ ...f, file_url: url || '' }))
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
    
    if (!form.title.trim()) {
      toast.error('Informe o título do contrato')
      return
    }

    const url = selected ? `/api/contracts/${selected.id}` : '/api/contracts'
    const method = selected ? 'PUT' : 'POST'
    const clientName = form.client_id ? clients.find((c) => c.id === form.client_id)?.name ?? '' : ''
    
    try {
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
        toast.success(selected ? 'Contrato atualizado!' : 'Contrato criado!')
      } else {
        toast.error('Erro ao salvar contrato')
      }
    } catch {
      toast.error('Erro ao salvar contrato')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir este contrato?')) return
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        await fetchData()
        toast.success('Contrato excluído!')
      }
    } catch {
      toast.error('Erro ao excluir contrato')
    }
  }

  const openSign = (contract: Contract, idx: number) => {
    setSelected(contract)
    setSignatoryIndex(idx)
    setSignatoriesForSign(form.signatories.length ? form.signatories : contract.signatories || [])
    setSignDialogOpen(true)
  }

  const handleSignatureSave = async (data: SignatureData) => {
    if (!selected) return
    const signatories = [...signatoriesForSign]
    if (!signatories[signatoryIndex]) {
      setSignDialogOpen(false)
      return
    }
    signatories[signatoryIndex] = {
      ...signatories[signatoryIndex],
      signed: true,
      signed_at: data.signedAt,
      signature_url: data.signatureImage,
      cpf: data.cpf,
      birth_date: data.birthDate,
      location: data.location,
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

  const copySignLink = (contract: Contract) => {
    const url = `${window.location.origin}/assinatura/${contract.id}`
    navigator.clipboard.writeText(url)
    toast.success('Link de assinatura copiado!')
  }

  const sendContract = async (contract: Contract) => {
    if (contract.status === 'signed') {
      toast.error('Este contrato já foi assinado')
      return
    }
    
    try {
      const res = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...contract,
          status: 'sent',
          sent_at: new Date().toISOString(),
        }),
      })
      
      if (res.ok) {
        await fetchData()
        copySignLink(contract)
        toast.success('Contrato enviado! Link copiado para a área de transferência.')
      }
    } catch {
      toast.error('Erro ao enviar contrato')
    }
  }

  const openViewContract = (c: Contract) => {
    setViewContract(c)
    setViewContractOpen(true)
  }

  const sendContractByEmail = (contract: Contract) => {
    const url = `${window.location.origin}/assinatura/${contract.id}`
    const subject = encodeURIComponent(`Assinatura: ${contract.title}`)
    const body = encodeURIComponent(
      `Olá,\n\nSegue o link para assinar o documento "${contract.title}":\n\n${url}\n\nAtenciosamente.`
    )
    window.location.href = `mailto:${contract.signatories?.[0]?.email || ''}?subject=${subject}&body=${body}`
    toast.success('Cliente de e-mail aberto. Cole o link no corpo do e-mail.')
  }

  const duplicateContract = async (contract: Contract) => {
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: `${contract.title} (cópia)`,
          file_url: contract.file_url,
          client_id: contract.client_id,
          client_name: contract.client_name,
          status: 'draft',
          signatories: contract.signatories?.map(s => ({ ...s, signed: false, signed_at: null, signature_url: null })) || [],
        }),
      })
      
      if (res.ok) {
        await fetchData()
        toast.success('Contrato duplicado!')
      }
    } catch {
      toast.error('Erro ao duplicar contrato')
    }
  }

  const handleGeneratePDF = async (contract: Contract) => {
    if (!contract.file_url) {
      alert('Adicione um arquivo PDF ao contrato para gerar o documento assinado.')
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
      alert('Erro ao gerar PDF. Verifique se o arquivo PDF está acessível.')
    }
  }

  const countFinalizados = contracts.filter((c) => c.status === 'signed').length
  const countEmCurso = contracts.filter((c) => ['draft', 'sent', 'pending'].includes(c.status)).length
  const countRecusados = contracts.filter((c) => c.status === 'expired').length
  const filteredContracts = docSearch.trim()
    ? contracts.filter(
        (c) =>
          c.title?.toLowerCase().includes(docSearch.toLowerCase()) ||
          (c.client_name ?? '').toLowerCase().includes(docSearch.toLowerCase())
      )
    : contracts

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-slate-500">Gerencie contratos e assinaturas digitais.</p>
        </div>
        <Button onClick={() => openDialog(null)} className="rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Criar documento
        </Button>
      </div>

      {/* Cards de resumo - modelo do print */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-emerald-50/80">
          <Card className="border-0 shadow-none bg-transparent p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Finalizados</p>
                <p className="text-2xl font-bold text-emerald-800 mt-0.5">{countFinalizados}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </Card>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-amber-50/80">
          <Card className="border-0 shadow-none bg-transparent p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Em curso</p>
                <p className="text-2xl font-bold text-amber-800 mt-0.5">{countEmCurso}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </Card>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-red-50/80">
          <Card className="border-0 shadow-none bg-transparent p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Recusados</p>
                <p className="text-2xl font-bold text-red-800 mt-0.5">{countRecusados}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-blue-50/80">
          <Card className="border-0 shadow-none bg-transparent p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Ver todos</p>
                <p className="text-2xl font-bold text-blue-800 mt-0.5">{contracts.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        </Card>
      </div>

      {/* Buscar documento */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar documento"
          value={docSearch}
          onChange={(e) => setDocSearch(e.target.value)}
          className="pl-9 rounded-xl border-slate-200 bg-white"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Documentos criados</h2>
        {loading ? (
          <div className="p-12 text-center text-slate-500 rounded-2xl bg-white border border-slate-100">Carregando...</div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 rounded-2xl bg-white border border-slate-100">
            {docSearch ? 'Nenhum documento encontrado.' : 'Nenhum contrato. Clique em "Criar documento" para começar.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContracts.map((c) => {
              const signedCount = c.signatories?.filter((s) => s.signed).length ?? 0
              const totalSign = c.signatories?.length ?? 1
              const isEmCurso = ['draft', 'sent', 'pending'].includes(c.status)
              return (
                <Card key={c.id} className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                        <p className="text-sm text-slate-500 truncate">{c.client_name || '—'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{signedCount}/{totalSign} assinaturas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          c.status === 'signed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : isEmCurso
                              ? 'bg-amber-100 text-amber-700'
                              : c.status === 'expired'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isEmCurso && <Clock className="w-3 h-3" />}
                        {c.status === 'signed' && <CheckCircle className="w-3 h-3" />}
                        {c.status === 'expired' && <AlertTriangle className="w-3 h-3" />}
                        {isEmCurso ? 'Em curso' : c.status === 'signed' ? 'Finalizado' : c.status === 'expired' ? 'Recusado' : STATUS_OPTIONS.find((s) => s.value === c.status)?.label ?? c.status}
                      </span>
                      {isEmCurso && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-slate-200 gap-1.5"
                          onClick={() => {
                            const idx = c.signatories?.findIndex((s) => !s.signed) ?? 0
                            setSelected(c)
                            setSignatoriesForSign(c.signatories?.length ? c.signatories : [])
                            if (c.signatories?.length && idx >= 0) openSign(c, idx)
                          }}
                        >
                          <PenLine className="w-3.5 h-3.5" />
                          Assinar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => openViewContract(c)}
                        title="Abrir documento"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Abrir documento (ao clicar nos 3 pontos) */}
      <Dialog open={viewContractOpen} onOpenChange={(open) => { setViewContractOpen(open); if (!open) setViewContract(null) }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-semibold text-slate-900">
              {viewContract?.title ?? 'Documento'}
            </DialogTitle>
          </DialogHeader>
          {viewContract && (
            <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => { copySignLink(viewContract); }}
                >
                  <Link2 className="w-4 h-4" />
                  Gerar link de assinatura
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 border-slate-200"
                  onClick={() => sendContractByEmail(viewContract)}
                >
                  <Mail className="w-4 h-4" />
                  Enviar ao e-mail do cliente
                </Button>
                {viewContract.file_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2 border-slate-200"
                    onClick={() => window.open(viewContract.file_url!, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver PDF
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 border-slate-200"
                  onClick={() => { setViewContractOpen(false); setViewContract(null); openDialog(viewContract); }}
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
                {viewContract.status === 'signed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2 border-slate-200"
                    onClick={() => handleGeneratePDF(viewContract)}
                  >
                    <Download className="w-4 h-4" />
                    Gerar PDF assinado
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => { if (confirm('Excluir este contrato?')) { remove(viewContract.id); setViewContractOpen(false); setViewContract(null); } }}
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </Button>
              </div>
              {viewContract.file_url && (
                <div className="flex-1 min-h-[400px] rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                  <iframe
                    src={viewContract.file_url}
                    title={viewContract.title}
                    className="w-full h-full min-h-[400px]"
                  />
                </div>
              )}
              {!viewContract.file_url && (
                <div className="py-12 text-center text-slate-500 rounded-xl border border-slate-100 bg-slate-50">
                  Nenhum PDF anexado a este documento.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              <Label>Arquivo PDF</Label>
              <div className="mt-2">
                <ContractUploader
                  value={form.file_url || null}
                  onChange={handleFileChange}
                  userId={user?.id}
                  disabled={selected?.status === 'signed'}
                />
              </div>
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
                <Button type="button" variant="outline" size="sm" onClick={addSignatory} className="rounded-lg gap-1">
                  <Plus className="w-3 h-3" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {form.signatories.map((sig, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
                    <div className="flex gap-2 items-center">
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
                    {selected && sig.email && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {sig.signed ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Assinado
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSignatory(sig)
                                setSignatureDetailsOpen(true)
                              }}
                              className="h-7 text-xs rounded-lg gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Ver detalhes
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => openSign(selected, i)}
                              className="h-7 text-xs rounded-lg gap-1 bg-indigo-600 hover:bg-indigo-700"
                            >
                              <PenLine className="w-3 h-3" />
                              Assinar agora
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copySignLink(selected)}
                              className="h-7 text-xs rounded-lg gap-1"
                            >
                              <Link2 className="w-3 h-3" />
                              Copiar link
                            </Button>
                          </>
                        )}
                      </div>
                    )}
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
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assinatura Digital</DialogTitle>
          </DialogHeader>
          <SignatureCanvas
            onSave={handleSignatureSave}
            onCancel={() => setSignDialogOpen(false)}
            signatoryName={signatoriesForSign[signatoryIndex]?.name}
            requireCpf={true}
            requireBirthDate={true}
            captureLocation={true}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes da assinatura */}
      <Dialog open={signatureDetailsOpen} onOpenChange={setSignatureDetailsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Assinatura</DialogTitle>
          </DialogHeader>
          {selectedSignatory && (
            <div className="space-y-4">
              {/* Assinatura visual */}
              {selectedSignatory.signature_url && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Assinatura</p>
                  <img
                    src={selectedSignatory.signature_url}
                    alt="Assinatura"
                    className="max-h-24 mx-auto bg-white rounded-lg border border-slate-200 p-2"
                  />
                </div>
              )}

              {/* Dados do signatário */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <User className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs text-slate-500">Nome</p>
                    <p className="font-medium text-slate-900">{selectedSignatory.name}</p>
                  </div>
                </div>

                {selectedSignatory.cpf && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-slate-500">CPF</p>
                      <p className="font-medium text-slate-900">
                        {selectedSignatory.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                      </p>
                    </div>
                  </div>
                )}

                {selectedSignatory.birth_date && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-slate-500">Data de nascimento</p>
                      <p className="font-medium text-slate-900">
                        {new Date(selectedSignatory.birth_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}

                {selectedSignatory.signed_at && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-slate-500">Data e hora da assinatura</p>
                      <p className="font-medium text-slate-900">
                        {new Date(selectedSignatory.signed_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {selectedSignatory.location && (selectedSignatory.location.latitude || selectedSignatory.location.address) && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Localização</p>
                      {selectedSignatory.location.address ? (
                        <p className="font-medium text-slate-900 text-sm">{selectedSignatory.location.address}</p>
                      ) : (
                        <p className="font-medium text-slate-900">
                          {selectedSignatory.location.latitude?.toFixed(6)}, {selectedSignatory.location.longitude?.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button onClick={() => setSignatureDetailsOpen(false)} className="w-full rounded-xl">
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
