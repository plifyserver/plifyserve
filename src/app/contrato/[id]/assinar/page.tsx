'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { FileText, Download, PenLine, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SignatureCanvas, { type SignatureData } from '@/components/contracts/SignatureCanvas'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/contracts/${contractId}/sign`)
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
    if (!contract || signatoryIndex < 0 || !signatoryEmail) return
    
    try {
      const res = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatoryEmail,
          signatureData,
        }),
      })
      
      if (res.ok) {
        setStep('success')
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao salvar assinatura. Tente novamente.')
      }
    } catch {
      alert('Erro ao salvar assinatura. Tente novamente.')
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logopreto.png" alt="Logo" width={120} height={32} className="h-8 w-auto" />
          </div>
          {contract?.file_url && (
            <Button variant="outline" className="rounded-xl gap-2" asChild>
              <a href={contract.file_url} download target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4" />
                Baixar PDF
              </a>
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contract Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="font-semibold text-slate-900">{contract?.title}</h1>
                  <p className="text-sm text-slate-500">Contrato para assinatura</p>
                </div>
              </div>
              
              {contract?.client_name && (
                <div className="text-sm text-slate-600 mb-4">
                  <span className="text-slate-500">Cliente:</span> {contract.client_name}
                </div>
              )}
              
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Signatários</p>
                <ul className="space-y-2">
                  {contract?.signatories.map((s, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        s.signed ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}>
                        {s.signed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{s.name}</p>
                        <p className="text-slate-500 truncate">{s.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {signatoryIndex >= 0 && !contract?.signatories[signatoryIndex].signed && (
              <Button 
                onClick={() => setStep('sign')}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2 text-base"
              >
                <PenLine className="w-5 h-5" />
                Assinar documento
              </Button>
            )}
          </div>

          {/* PDF Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {contract?.file_url ? (
                <iframe
                  src={contract.file_url}
                  className="w-full h-[600px] lg:h-[700px]"
                  title="Visualização do contrato"
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p>Nenhum documento anexado</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
