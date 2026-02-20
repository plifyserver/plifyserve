'use client'

import { useEffect, useState } from 'react'
import { Plus, FileText, MoreHorizontal, Edit, Trash2, PenLine, Download, Eye, MapPin, Calendar, Clock, User, Link2, CheckCircle, Send, Copy, ExternalLink, AlertTriangle } from 'lucide-react'
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
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-slate-900">{c.title}</p>
                        {c.file_url && (
                          <p className="text-xs text-slate-400 mt-0.5">PDF anexado</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{c.client_name || '-'}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          c.status === 'signed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : c.status === 'sent' || c.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : c.status === 'expired'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.status === 'expired' && <AlertTriangle className="w-3 h-3" />}
                        {c.status === 'signed' && <CheckCircle className="w-3 h-3" />}
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
                        <DropdownMenuContent align="end" className="rounded-xl w-48">
                          <DropdownMenuItem onClick={() => openDialog(c)} className="rounded-lg">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {c.status !== 'signed' && c.status !== 'expired' && (
                            <DropdownMenuItem onClick={() => sendContract(c)} className="rounded-lg">
                              <Send className="w-4 h-4 mr-2" />
                              Enviar para assinatura
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => copySignLink(c)} className="rounded-lg">
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar link
                          </DropdownMenuItem>
                          {c.file_url && (
                            <DropdownMenuItem onClick={() => window.open(c.file_url!, '_blank')} className="rounded-lg">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Ver PDF
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => duplicateContract(c)} className="rounded-lg">
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          {c.status === 'signed' && (
                            <DropdownMenuItem onClick={() => handleGeneratePDF(c)} className="rounded-lg">
                              <Download className="w-4 h-4 mr-2" />
                              Gerar PDF assinado
                            </DropdownMenuItem>
                          )}
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
