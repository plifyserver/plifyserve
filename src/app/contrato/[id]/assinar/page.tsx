'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Download, PenLine, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SignatureCanvas, { type SignatureData } from '@/components/contracts/SignatureCanvas'
import { toast } from 'sonner'

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
  const contractId = params.id as string
  const signatoryEmail = searchParams.get('email')
  
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
    
    try {
      const res = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatoryEmail: emailToUse,
          signatureData,
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
            onClick={() => window.close()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
          >
            Fechar
          </Button>
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
      {/* Header: logo à esquerda, botão ASSINAR à direita */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <Image src="/logopreto.png" alt="Plify" width={100} height={28} className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            {contract?.file_url && (
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5" asChild>
                <a href={contract.file_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </a>
              </Button>
            )}
            {signatoryIndex >= 0 && !contract?.signatories[signatoryIndex]?.signed && (
              <Button
                onClick={() => setStep('sign')}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <PenLine className="w-4 h-4" />
                ASSINAR CONTRATO
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 max-w-6xl w-full mx-auto">
        {/* Quando não veio email na URL: selecionar "Sou eu" */}
        {!signatoryEmail && contract?.signatories && contract.signatories.length > 0 && signatoryIndex < 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <p className="text-sm font-medium text-slate-700 mb-3">Identifique-se para assinar</p>
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
          </div>
        )}

        {/* PDF em destaque - altura generosa para leitura */}
        <div className="flex-1 min-h-[70vh] bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
          {contract?.file_url ? (
            <iframe
              src={contract.file_url}
              className="w-full h-full min-h-[70vh]"
              title={contract?.title ?? 'Contrato'}
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
