'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { FileText, Building2, User, Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import SignatureCanvas, { type SignatureData } from '@/components/contracts/SignatureCanvas'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Contract {
  id: string
  title: string
  file_url: string | null
  client_name: string | null
  company_name: string | null
  company_logo: string | null
  status: string
  created_at: string
  expires_at: string | null
  signatories: Array<{
    name: string
    email: string
    signed: boolean
    signed_at?: string | null
  }>
}

export default function AssinaturaPage() {
  const params = useParams()
  const contractId = params.id as string

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [clientIp, setClientIp] = useState<string | null>(null)

  const fetchContract = useCallback(async () => {
    try {
      const res = await fetch(`/api/assinatura/${contractId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Contrato não encontrado')
      }
      const data = await res.json()
      setContract(data)
      
      if (data.status === 'signed') {
        setSigned(true)
      }
      if (data.status === 'expired') {
        setError('Este contrato expirou e não pode mais ser assinado.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contrato')
    } finally {
      setLoading(false)
    }
  }, [contractId])

  const fetchIp = useCallback(async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json')
      if (res.ok) {
        const data = await res.json()
        setClientIp(data.ip)
      }
    } catch {
      // IP não é obrigatório
    }
  }, [])

  useEffect(() => {
    fetchContract()
    fetchIp()
  }, [fetchContract, fetchIp])

  const handleSign = async (data: SignatureData) => {
    if (!contract) return
    
    setSigning(true)
    try {
      const res = await fetch(`/api/assinatura/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: contract.client_name || 'Cliente',
          cpf: data.cpf,
          birth_date: data.birthDate,
          signature_image: data.signatureImage,
          ip_address: clientIp,
          location: data.location,
          signed_at: data.signedAt,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao assinar contrato')
      }

      setSigned(true)
      setSignDialogOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao assinar contrato')
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando contrato...</p>
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Contrato não disponível</h1>
          <p className="text-slate-600">{error || 'O contrato solicitado não foi encontrado.'}</p>
        </div>
      </div>
    )
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Contrato assinado!</h1>
          <p className="text-slate-600 mb-6">
            Sua assinatura foi registrada com sucesso. Você receberá uma cópia por email.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-left">
            <p className="text-sm text-slate-500 mb-1">Contrato</p>
            <p className="font-medium text-slate-900">{contract.title}</p>
          </div>
        </div>
      </div>
    )
  }

  const isExpired = contract.expires_at && new Date(contract.expires_at) < new Date()

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {contract.company_logo ? (
              <img src={contract.company_logo} alt="" className="h-10 w-auto" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-900">
                {contract.company_name || 'Empresa'}
              </p>
              <p className="text-sm text-slate-500">Assinatura de documento</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Contract Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900 mb-1">{contract.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {contract.client_name || 'Cliente'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(contract.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                {contract.expires_at && (
                  <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : ''}`}>
                    <Clock className="w-4 h-4" />
                    {isExpired 
                      ? 'Expirado' 
                      : `Expira em ${format(new Date(contract.expires_at), "dd/MM/yyyy")}`
                    }
                  </span>
                )}
              </div>
            </div>
          </div>

          {isExpired ? (
            <div className="bg-red-50 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Contrato expirado</p>
                <p className="text-sm text-red-600 mt-1">
                  Este contrato não pode mais ser assinado pois passou do prazo de validade.
                </p>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setSignDialogOpen(true)}
              size="lg"
              className="w-full h-14 text-lg rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              Assinar documento
            </Button>
          )}
        </div>

        {/* PDF Preview */}
        {contract.file_url && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-900">Visualização do documento</h2>
              <p className="text-sm text-slate-500">Leia o documento antes de assinar</p>
            </div>
            <div className="aspect-[3/4] md:aspect-[4/3] bg-slate-100">
              <iframe
                src={`${contract.file_url}#toolbar=0&navpanes=0`}
                className="w-full h-full min-h-[600px]"
                title="Contrato PDF"
              />
            </div>
          </div>
        )}
      </main>

      {/* Sign Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assinatura Digital</DialogTitle>
          </DialogHeader>
          <SignatureCanvas
            onSave={handleSign}
            onCancel={() => setSignDialogOpen(false)}
            signatoryName={contract.client_name || undefined}
            requireCpf={true}
            requireBirthDate={true}
            captureLocation={true}
          />
          {signing && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-slate-600">Registrando assinatura...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
