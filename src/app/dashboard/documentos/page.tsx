'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, FileText, MoreHorizontal, Edit, Trash2, PenLine, Download, Eye, MapPin, Calendar, Clock, User, Link2, CheckCircle, Send, Copy, ExternalLink, AlertTriangle, Search, Mail, MessageCircle, Globe, Monitor } from 'lucide-react'
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
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SignatureCanvas, { type SignatureData } from '@/components/contracts/SignatureCanvas'
import ContractSignaturePlacement, { type SignaturePlacement } from '@/components/contracts/ContractSignaturePlacement'
import ContractUploader from '@/components/contracts/ContractUploader'
import { generateSignedPDF, downloadPDF } from '@/lib/pdf-generator'
import { useAuth } from '@/contexts/AuthContext'
import { DASH_SURFACE_CARD, SITE_CONTAINER_LG } from '@/lib/siteLayout'
import { PlanQuotaInline, usePlanQuotaFull } from '@/components/billing/PlanQuotaInline'
import { useBilling } from '@/hooks/useBilling'
import { toSafeExternalUrl } from '@/lib/urlSafety'
import { toast } from 'sonner'

interface Signatory {
  name: string
  email: string
  signed: boolean
  signed_at?: string | null
  signature_url?: string | null
  selfie_url?: string | null
  cpf?: string | null
  birth_date?: string | null
  location?: {
    latitude: number | null
    longitude: number | null
    address: string | null
  } | null
  ip_address?: string | null
  user_agent?: string | null
  signature_placement?: SignaturePlacement | null
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

/** Contrato só é finalizado quando todos assinaram e enviaram selfie */
function isContractFinalizado(c: Contract): boolean {
  const signatories = c.signatories ?? []
  return (
    signatories.length > 0 &&
    signatories.every(
      (s: Signatory) =>
        s.signed &&
        typeof s.selfie_url === 'string' &&
        s.selfie_url.trim().length > 0
    )
  )
}

export default function DocumentosPage() {
  const { user } = useAuth()
  const { refetch: refetchBilling } = useBilling()
  const contractsMonthFull = usePlanQuotaFull('contractsThisMonth')

  const [contracts, setContracts] = useState<Contract[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [placementOpen, setPlacementOpen] = useState(false)
  const [pendingSignData, setPendingSignData] = useState<SignatureData | null>(null)
  const [selected, setSelected] = useState<Contract | null>(null)
  const [signatoryIndex, setSignatoryIndex] = useState<number>(0)
  const [signatoriesForSign, setSignatoriesForSign] = useState<Signatory[]>([])
  const [signatureDetailsOpen, setSignatureDetailsOpen] = useState(false)
  const [selectedSignatory, setSelectedSignatory] = useState<Signatory | null>(null)
  const [viewContractOpen, setViewContractOpen] = useState(false)
  const [viewContract, setViewContract] = useState<Contract | null>(null)
  const [deleteContractId, setDeleteContractId] = useState<string | null>(null)
  const [docSearch, setDocSearch] = useState('')
  const [contractToPickSignatory, setContractToPickSignatory] = useState<Contract | null>(null)
  const [form, setForm] = useState({
    title: '',
    file_url: '',
    client_id: '',
    status: 'draft',
    signatories: [] as { name: string; email: string; signed: boolean; signed_at?: string | null; signature_url?: string | null; selfie_url?: string | null }[],
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
    const allSigned =
      form.signatories.length > 0 &&
      form.signatories.every(
        (s) =>
          s.signed &&
          typeof s.selfie_url === 'string' &&
          s.selfie_url.trim().length > 0
      )
    const statusToSend = selected
      ? allSigned
        ? 'signed'
        : selected.status === 'draft'
          ? 'draft'
          : 'pending'
      : 'draft'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          file_url: form.file_url || null,
          client_id: null,
          client_name: null,
          status: statusToSend,
          signatories: form.signatories,
        }),
      })
      if (res.ok) {
        await fetchData()
        void refetchBilling()
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
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        await fetchData()
        void refetchBilling()
        setDeleteContractId(null)
        if (viewContract?.id === id) {
          setViewContractOpen(false)
          setViewContract(null)
        }
        toast.success('Contrato excluído!')
      } else {
        toast.error('Erro ao excluir contrato')
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

  const handleSignatureSave = (data: SignatureData) => {
    if (!selected) return
    if (!signatoriesForSign[signatoryIndex]) {
      setSignDialogOpen(false)
      return
    }
    if (!selected.file_url?.trim()) {
      toast.error('Adicione um PDF ao contrato antes de assinar.')
      return
    }
    setPendingSignData(data)
    setSignDialogOpen(false)
    setPlacementOpen(true)
  }

  const handlePlacementBack = () => {
    setPlacementOpen(false)
    setPendingSignData(null)
    setSignDialogOpen(true)
  }

  const handlePlacementConfirm = async (placement: SignaturePlacement) => {
    if (!selected || !pendingSignData) return
    const data = pendingSignData
    setPendingSignData(null)
    setPlacementOpen(false)

    const signatories = [...signatoriesForSign]
    if (!signatories[signatoryIndex]) {
      setSelected(null)
      return
    }

    let clientIp: string | null = null
    try {
      const ipRes = await fetch('/api/my-ip', { credentials: 'include' })
      if (ipRes.ok) {
        const j = (await ipRes.json()) as { ip?: string }
        clientIp = typeof j?.ip === 'string' ? j.ip : null
      }
    } catch {
      /* ignore */
    }
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : null

    signatories[signatoryIndex] = {
      ...signatories[signatoryIndex],
      signed: true,
      signed_at: data.signedAt,
      signature_url: data.signatureImage,
      selfie_url: data.selfieImage ?? null,
      cpf: data.cpf,
      birth_date: data.birthDate,
      location: data.location,
      signature_placement: placement,
      ip_address: clientIp,
      user_agent: ua,
    }
    const allSigned = signatories.every(
      (s) =>
        s.signed &&
        typeof s.selfie_url === 'string' &&
        s.selfie_url.trim().length > 0
    )
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
      setSelected(null)
    } else {
      toast.error('Não foi possível salvar a assinatura.')
    }
  }

  const copySignLink = (contract: Contract, signatory?: Signatory) => {
    const base = `${typeof window !== 'undefined' ? window.location.origin : ''}/contrato/${contract.id}/assinar`
    const url = signatory ? `${base}?email=${encodeURIComponent(signatory.email)}` : base
    navigator.clipboard.writeText(url)
    toast.success(signatory ? `Link de ${signatory.name} copiado!` : 'Link copiado!')
  }

  const shareContractWhatsApp = (contract: Contract, signatory?: Signatory) => {
    const base = `${typeof window !== 'undefined' ? window.location.origin : ''}/contrato/${contract.id}/assinar`
    const url = signatory ? `${base}?email=${encodeURIComponent(signatory.email)}` : base
    const text = encodeURIComponent(
      `Olá! Segue seu link para assinatura do documento "${contract.title}":\n\n${url}\n\nAbra o link para assinar.`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
    toast.success(signatory ? `WhatsApp aberto para ${signatory.name}` : 'WhatsApp aberto')
  }

  const sendContractByEmail = async (contract: Contract, signatory?: Signatory) => {
    const to = (signatory?.email || contract.signatories?.[0]?.email || '').trim()
    if (!to) {
      toast.error('E-mail do signatário é obrigatório.')
      return
    }
    const toastId = 'contract-email-send'
    toast.loading('A enviar e-mail…', { id: toastId })
    try {
      const res = await fetch(`/api/contracts/${contract.id}/send-sign-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ signatoryEmail: to }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      toast.dismiss(toastId)
      if (!res.ok) {
        toast.error(data.error || 'Não foi possível enviar o e-mail.')
        return
      }
      toast.success(signatory?.name ? `E-mail enviado para ${signatory.name}` : 'E-mail enviado ao signatário.')
    } catch {
      toast.dismiss(toastId)
      toast.error('Erro de rede ao enviar e-mail.')
    }
  }

  const sendContract = async (contract: Contract) => {
    if (isContractFinalizado(contract)) {
      toast.error('Este contrato já foi totalmente assinado')
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
        if (contract.signatories?.length) {
          copySignLink(contract, contract.signatories[0])
        } else {
          copySignLink(contract)
        }
        toast.success('Contrato enviado! Link do primeiro signatário copiado.')
      }
    } catch {
      toast.error('Erro ao enviar contrato')
    }
  }

  const openViewContract = (c: Contract) => {
    setViewContract(c)
    setViewContractOpen(true)
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
          signatories:
            contract.signatories?.map((s) => ({
              ...s,
              signed: false,
              signed_at: null,
              signature_url: null,
              selfie_url: null,
              signature_placement: null,
              ip_address: null,
              user_agent: null,
            })) || [],
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
      toast.error('Adicione um arquivo PDF ao contrato para gerar o documento assinado.')
      return
    }
    try {
      const signatures = (contract.signatories || []).map((s) => ({
        name: s.name,
        email: s.email,
        signed: s.signed,
        signed_at: s.signed_at,
        signature_url: s.signature_url,
        selfie_url: s.selfie_url,
        signature_placement: s.signature_placement ?? null,
        cpf: s.cpf,
        birth_date: s.birth_date,
        location: s.location,
        ip_address: s.ip_address ?? undefined,
        browser: s.user_agent ?? undefined,
      }))
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
      toast.error('Erro ao gerar PDF. Verifique se o arquivo PDF está acessível.')
    }
  }

  const countFinalizados = contracts.filter(isContractFinalizado).length
  const countPendenteAssinatura = contracts.filter(
    (c) => (c.signatories?.length ?? 0) > 0 && !isContractFinalizado(c)
  ).length
  const filteredContracts = useMemo(() => {
    const query = docSearch.trim().toLowerCase()
    if (!query) return contracts
    return contracts.filter(
      (c) => c.title?.toLowerCase().includes(query) || (c.client_name ?? '').toLowerCase().includes(query)
    )
  }, [contracts, docSearch])

  return (
    <div className={`space-y-6 ${SITE_CONTAINER_LG}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-slate-500">Gerencie contratos e assinaturas digitais.</p>
          <PlanQuotaInline kind="contractsThisMonth" className="mt-2" />
        </div>
        <Button
          onClick={() => openDialog(null)}
          disabled={contractsMonthFull}
          title={contractsMonthFull ? 'Limite de 5 contratos por mês no Essential.' : undefined}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar documento
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className={`${DASH_SURFACE_CARD} overflow-hidden bg-emerald-50/80`}>
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
        <Card className={`${DASH_SURFACE_CARD} overflow-hidden bg-amber-50/80`}>
          <Card className="border-0 shadow-none bg-transparent p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Pendente Assinatura</p>
                <p className="text-2xl font-bold text-amber-800 mt-0.5">{countPendenteAssinatura}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </Card>
        </Card>
        <Card className={`${DASH_SURFACE_CARD} overflow-hidden bg-blue-50/80`}>
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
              const finalizado = isContractFinalizado(c)
              const pendenteAssinatura = (c.signatories?.length ?? 0) > 0 && !finalizado
              const isRascunho = c.status === 'draft'
              return (
                <Card key={c.id} className={`${DASH_SURFACE_CARD} overflow-hidden`}>
                  <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                        <p className="text-sm text-slate-500 truncate">{c.client_name || '—'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {signedCount}/{totalSign} assinaturas
                          {pendenteAssinatura && totalSign > 0 && (
                            <span className="block mt-0.5 text-slate-500">
                              Faltam: {c.signatories?.filter((s) => !s.signed).map((s) => s.name).join(', ') || '—'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          finalizado
                            ? 'bg-emerald-100 text-emerald-700'
                            : pendenteAssinatura
                              ? 'bg-amber-100 text-amber-700'
                              : isRascunho
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {pendenteAssinatura && <Clock className="w-3 h-3" />}
                        {finalizado && <CheckCircle className="w-3 h-3" />}
                        {finalizado ? 'Finalizado' : isRascunho ? 'Rascunho' : 'Pendente Assinatura'}
                      </span>
                      {pendenteAssinatura && c.signatories && c.signatories.some((s) => !s.signed) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-slate-200 gap-1.5"
                          onClick={() => {
                            const unsigned = c.signatories?.map((s, i) => ({ s, i })).filter(({ s }) => !s.signed) ?? []
                            if (unsigned.length === 1) {
                              openSign(c, unsigned[0].i)
                            } else {
                              setContractToPickSignatory(c)
                            }
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
                {viewContract.file_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2 border-slate-200"
                    onClick={() => {
                      const safeUrl = toSafeExternalUrl(viewContract.file_url)
                      if (!safeUrl) {
                        toast.error('Link do PDF invalido ou inseguro.')
                        return
                      }
                      window.open(safeUrl, '_blank', 'noopener,noreferrer')
                    }}
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
                {viewContract && isContractFinalizado(viewContract) && (
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
                  onClick={() => { setViewContractOpen(false); setDeleteContractId(viewContract.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </Button>
              </div>

              {/* Link exclusivo por signatário: cada um recebe seu link com ?email= e só assina com CPF/data */}
              {viewContract.signatories && viewContract.signatories.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">Links de assinatura (um por signatário)</p>
                  <p className="text-xs text-slate-500 mb-3">
                    Cada pessoa deve usar apenas o próprio link. Ao abrir, será solicitado CPF e data de nascimento para liberar o campo de assinatura.
                  </p>
                  <div className="space-y-3">
                    {viewContract.signatories.map((sig, idx) => {
                      const hasEmail = Boolean(sig.email?.trim())
                      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                      const linkUrl = hasEmail ? `${baseUrl}/contrato/${viewContract.id}/assinar?email=${encodeURIComponent(sig.email!.trim())}` : ''
                      return (
                        <div key={idx} className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white border border-slate-100">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">{sig.name}</p>
                            <p className="text-xs text-slate-500 truncate">{sig.email || '—'}</p>
                            {!hasEmail && (
                              <p className="text-xs text-amber-600 mt-1 font-medium">E-mail obrigatório para gerar o link — edite o contrato e salve.</p>
                            )}
                            {sig.signed && (
                              <span className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-600">
                                <CheckCircle className="w-3 h-3" /> Já assinou
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg gap-1.5"
                              disabled={!hasEmail}
                              onClick={() => {
                                if (!hasEmail) {
                                  toast.error('Cadastre o e-mail deste signatário no contrato (Editar) para gerar o link.')
                                  return
                                }
                                navigator.clipboard.writeText(linkUrl)
                                toast.success(`Link de ${sig.name} copiado`)
                              }}
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copiar link
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg gap-1.5 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                              disabled={!hasEmail}
                              onClick={() => {
                                if (!hasEmail) {
                                  toast.error('Cadastre o e-mail deste signatário no contrato (Editar) para enviar o link.')
                                  return
                                }
                                shareContractWhatsApp(viewContract, sig)
                              }}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg gap-1.5"
                              disabled={!hasEmail}
                              onClick={() => {
                                if (!hasEmail) {
                                  toast.error('Cadastre o e-mail deste signatário no contrato (Editar) para enviar o link.')
                                  return
                                }
                                sendContractByEmail(viewContract, sig)
                              }}
                            >
                              <Mail className="w-3.5 h-3.5" />
                              E-mail
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

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

      {/* Modal confirmar exclusão de contrato */}
      <Dialog open={!!deleteContractId} onOpenChange={(open) => !open && setDeleteContractId(null)}>
        <DialogContent className="rounded-2xl border border-slate-200 shadow-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Excluir contrato?</DialogTitle>
            <DialogDescription className="text-slate-500">
              Esta ação não pode ser desfeita. O contrato será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-lg" onClick={() => setDeleteContractId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="rounded-lg bg-red-600 hover:bg-red-700"
              onClick={() => deleteContractId && remove(deleteContractId)}
            >
              Excluir
            </Button>
          </DialogFooter>
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
                  disabled={selected ? isContractFinalizado(selected) : false}
                />
              </div>
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

      {/* Modal: escolher quem vai assinar (ao clicar em Assinar com vários pendentes) */}
      <Dialog open={!!contractToPickSignatory} onOpenChange={(open) => { if (!open) setContractToPickSignatory(null) }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Quem vai assinar?</DialogTitle>
            <DialogDescription>Selecione o signatário que irá assinar agora.</DialogDescription>
          </DialogHeader>
          {contractToPickSignatory && (
            <div className="flex flex-col gap-2 py-2">
              {contractToPickSignatory.signatories
                ?.map((s, idx) => ({ s, idx }))
                .filter(({ s }) => !s.signed)
                .map(({ s, idx }) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="justify-start h-auto py-3 rounded-xl border-slate-200 gap-2"
                    onClick={() => {
                      openSign(contractToPickSignatory, idx)
                      setContractToPickSignatory(null)
                    }}
                  >
                    <PenLine className="w-4 h-4 text-slate-500" />
                    {s.name || s.email || `Signatário ${idx + 1}`}
                  </Button>
                ))}
            </div>
          )}
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
            requireSelfie={true}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={placementOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPlacementOpen(false)
            setPendingSignData(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl w-[min(100vw-2rem,56rem)] h-[min(92vh,100dvh)] max-h-[92vh] overflow-hidden flex flex-col min-h-0 p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="shrink-0 flex-none">
            <DialogTitle>Posicionar assinatura no documento</DialogTitle>
            <DialogDescription>
              Arraste a caixa da assinatura sobre o PDF e confirme. Isso define onde a assinatura aparece no arquivo final.
            </DialogDescription>
          </DialogHeader>
          {selected?.file_url && pendingSignData ? (
            <div
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 -mr-0.5 [scrollbar-gutter:stable]"
              data-signature-placement-scroll
            >
              <ContractSignaturePlacement
                pdfUrl={toSafeExternalUrl(selected.file_url) ?? selected.file_url}
                signatureDataUrl={pendingSignData.signatureImage}
                onConfirm={handlePlacementConfirm}
                onBack={handlePlacementBack}
              />
            </div>
          ) : null}
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

              {/* Selfie */}
              {selectedSignatory.selfie_url && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Selfie</p>
                  <img
                    src={selectedSignatory.selfie_url}
                    alt="Selfie do signatário"
                    className="max-h-40 mx-auto bg-white rounded-lg border border-slate-200 p-2 object-cover"
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

                {selectedSignatory.ip_address && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-slate-500">IP</p>
                      <p className="font-medium text-slate-900 text-sm">{selectedSignatory.ip_address}</p>
                    </div>
                  </div>
                )}

                {selectedSignatory.user_agent && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <Monitor className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Navegador / dispositivo</p>
                      <p className="font-medium text-slate-900 text-xs break-words">{selectedSignatory.user_agent}</p>
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
