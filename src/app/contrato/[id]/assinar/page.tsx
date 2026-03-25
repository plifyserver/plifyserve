'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, PenLine, CheckCircle, AlertCircle, Loader2, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SignatureCanvas, { type SignatureData } from '@/components/contracts/SignatureCanvas'
import { useAuth } from '@/contexts/AuthContext'
import { LOGO_PRETO } from '@/lib/logo'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SITE_CONTAINER_LG, SITE_GUTTER_X } from '@/lib/siteLayout'

interface Contract {
  id: string
  title: string
  file_url: string | null
  client_name: string | null
  signatories: {
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
  }[]
  status: string
  created_at: string
}

type PageStep = 'loading' | 'view' | 'sign' | 'success' | 'error' | 'already_signed'

export default function AssinarContratoPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const contractId = params.id as string
  const signatoryEmailRaw = searchParams.get('email') ?? searchParams.get('ernail')
  const signatoryEmail = signatoryEmailRaw?.trim() || null
  
  const [contract, setContract] = useState<Contract | null>(null)
  const [step, setStep] = useState<PageStep>('loading')
  const [signatoryIndex, setSignatoryIndex] = useState<number>(-1)
  const [selectedSignatoryEmail, setSelectedSignatoryEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const effectiveSignatoryEmail = selectedSignatoryEmail || signatoryEmail || null

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/contracts/${contractId}/sign`, { cache: 'no-store' })
        if (!res.ok) {
          setError('Contrato não encontrado.')
          setStep('error')
          return
        }
        
        const data = await res.json()
        setContract(data)
        
        if (signatoryEmail) {
          const idx = data.signatories?.findIndex(
            (s: { email: string }) => s.email.toLowerCase() === signatoryEmail.toLowerCase()
          )
          if (idx >= 0) {
            setSignatoryIndex(idx)
            setSelectedSignatoryEmail(null)
            if (data.signatories[idx].signed) {
              setStep('already_signed')
            } else {
              setStep('view')
            }
          } else {
            setError('Você não está na lista de signatários deste contrato.')
            setStep('error')
          }
        } else {
          setSignatoryIndex(-1)
          setStep('view')
        }
      } catch {
        setError('Erro ao carregar contrato.')
        setStep('error')
      }
    }
    
    fetchContract()
  }, [contractId, signatoryEmail])

  const handleSignatureComplete = async (signatureData: SignatureData) => {
    const emailToUse = effectiveSignatoryEmail || contract?.signatories?.[signatoryIndex]?.email
    if (!contract || signatoryIndex < 0 || !emailToUse) return

    let clientIp: string | null = null
    try {
      const ipRes = await fetch('/api/my-ip', { cache: 'no-store' })
      if (ipRes.ok) {
        const data = await ipRes.json()
        clientIp = data.ip ?? null
      }
    } catch {
      // segue sem IP do cliente
    }
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null

    const payload = {
      ...signatureData,
      ip_address: clientIp,
      user_agent: userAgent,
    }

    try {
      const res = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatoryEmail: emailToUse,
          signatureData: payload,
        }),
      })
      
      if (res.ok) {
        setStep('success')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao salvar assinatura. Tente novamente.')
      }
    } catch {
      toast.error('Erro ao salvar assinatura. Tente novamente.')
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando contrato...</p>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Erro</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (step === 'already_signed') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Documento já assinado</h1>
          <p className="text-slate-600">
            Você já assinou este documento em{' '}
            {contract?.signatories[signatoryIndex]?.signed_at
              ? new Date(contract.signatories[signatoryIndex].signed_at!).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'data não disponível'}
          </p>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Assinatura concluída!</h1>
          <p className="text-slate-600 mb-6">
            Sua assinatura foi registrada com sucesso. Você receberá uma cópia do documento por email.
          </p>
          <Button 
            onClick={() => {
              window.close()
              setTimeout(() => { window.location.href = 'about:blank' }, 150)
            }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
          >
            Fechar
          </Button>
          <p className="text-xs text-slate-500 mt-3">Se a aba não fechar, use Ctrl+W (ou Cmd+W no Mac).</p>
        </div>
      </div>
    )
  }

  if (step === 'sign' && contract) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setStep('view')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao documento
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <SignatureCanvas
              onSave={handleSignatureComplete}
              onCancel={() => setStep('view')}
              signatoryName={contract.signatories[signatoryIndex]?.name}
              requireCpf={true}
              requireBirthDate={true}
              captureLocation={true}
            />
          </div>
        </div>
      </div>
    )
  }

  const unsignedSignatories = (contract?.signatories ?? [])
    .map((s, i) => ({ ...s, index: i }))
    .filter((s) => !s.signed)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header: logo proporcional, botão verde Assinar à direita */}
      <header className={cn('bg-white border-b border-slate-200 py-2.5 sm:py-3 flex-shrink-0', SITE_GUTTER_X)}>
        <div className={cn(SITE_CONTAINER_LG, 'flex items-center justify-between gap-2 sm:gap-4 min-w-0')}>
          <Link href="/" className="flex items-center min-w-0 shrink">
            <Image src={LOGO_PRETO} alt="Plify" width={140} height={40} className="h-8 w-auto sm:h-10 object-contain object-left" priority />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {signatoryIndex >= 0 && !contract?.signatories[signatoryIndex]?.signed && (
              <Button
                onClick={() => setStep('sign')}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 sm:gap-2 font-semibold shadow-sm text-sm sm:text-base px-3 sm:px-4 py-2"
              >
                <PenLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Assinar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className={cn('flex-1 flex flex-col py-3 sm:py-4 w-full min-w-0', SITE_CONTAINER_LG, SITE_GUTTER_X)}>
        {/* Sem email na URL: se logado no Plify = assinatura presencial (escolher signatário); senão = pedir uso do link exclusivo */}
        {!signatoryEmail && contract?.signatories && contract.signatories.length > 0 && signatoryIndex < 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-3 sm:mb-4">
            {user ? (
              <>
                <p className="text-sm font-medium text-slate-700 mb-3">Identifique-se para assinar (assinatura presencial)</p>
                <Select
                  value={selectedSignatoryEmail ?? ''}
                  onValueChange={(email) => {
                    const idx = contract.signatories.findIndex((s) => s.email === email)
                    if (idx >= 0) {
                      setSignatoryIndex(idx)
                      setSelectedSignatoryEmail(email)
                    }
                  }}
                >
                  <SelectTrigger className="w-full max-w-sm rounded-xl">
                    <SelectValue placeholder="Quem é você? Selecione seu nome" />
                  </SelectTrigger>
                  <SelectContent>
                    {unsignedSignatories.map((s) => (
                      <SelectItem key={s.index} value={s.email}>
                        {s.name || s.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {unsignedSignatories.length === 0 && (
                  <p className="text-sm text-slate-500 mt-2">Todos os signatários já assinaram.</p>
                )}
              </>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Use seu link exclusivo para assinar</p>
                  <p className="text-sm text-amber-800 mt-1">
                    Cada signatário recebe um link por e-mail ou WhatsApp. Use o link que foi enviado para você para assinar sua parte do contrato.
                  </p>
                  <p className="text-sm text-amber-700 mt-2 border-t border-amber-200 pt-2">
                    Se você já recebeu o link e ainda vê esta mensagem, o link pode estar incompleto. Peça ao responsável pelo contrato que <strong>edite o documento, cadastre seu e-mail no seu nome (signatário) e salve</strong>. Depois, que copie o link novamente e envie para você.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nome do signatário quando identificado pelo link */}
        {signatoryIndex >= 0 && contract?.signatories?.[signatoryIndex] && (
          <div className="bg-white rounded-t-2xl border border-slate-200 border-b-0 px-4 sm:px-6 py-2.5 sm:py-3 shadow-sm">
            <p className="text-slate-700 text-sm sm:text-base md:text-lg font-medium break-words">
              CONTRATO SENDO ASSINADO POR: <span className="text-slate-900 font-semibold">{contract.signatories[signatoryIndex].name || contract.signatories[signatoryIndex].email || 'Signatário'}</span>
            </p>
          </div>
        )}

        {/* PDF em destaque - proporcional à moldura (view=FitH para preencher largura) */}
        <div className={`flex-1 min-h-[70vh] bg-white shadow-sm overflow-hidden border border-slate-200 flex flex-col ${signatoryIndex >= 0 ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
          {contract?.file_url ? (
            <iframe
              src={`${contract.file_url}#view=FitH`}
              className="w-full flex-1 min-h-[70vh]"
              title={contract?.title ?? 'Contrato'}
              style={{ minHeight: '70vh' }}
            />
          ) : (
            <div className="h-[50vh] flex items-center justify-center text-slate-500">
              <div className="text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p>Nenhum documento anexado</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
