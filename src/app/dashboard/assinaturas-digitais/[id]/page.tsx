'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileText, CheckCircle, Clock, MapPin, Calendar } from 'lucide-react'

type Doc = {
  id: string
  file_url: string
  client_name: string
  client_email: string
  slug: string
  status: 'pending' | 'signed'
  signature_data_url: string | null
  signed_at: string | null
  signed_client_at: string | null
  signed_latitude: number | null
  signed_longitude: number | null
  created_at: string
}

export default function VerDocumentoAssinaturaPage() {
  const params = useParams()
  const id = params?.id as string
  const [doc, setDoc] = useState<Doc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchDocs = async () => {
      const res = await fetch('/api/assinaturas-digitais', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      const found = data.find((d: Doc) => d.id === id)
      setDoc(found ?? null)
      setLoading(false)
    }
    fetchDocs()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/assinaturas-digitais"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-avocado mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <p className="text-gray-500">Documento não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/dashboard/assinaturas-digitais"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-avocado mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
          <span className="font-medium text-gray-900">{doc.client_name}</span>
          <span className="text-sm text-gray-500">{doc.client_email}</span>
          {doc.status === 'signed' ? (
            <span className="inline-flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" /> Assinado
              {doc.signed_at && (
                <span className="text-gray-500">
                  em {new Date(doc.signed_at).toLocaleDateString('pt-BR')}
                </span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
              <Clock className="w-4 h-4" /> Pendente
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="p-2 border-b lg:border-b-0 lg:border-r border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
              <FileText className="w-4 h-4" /> Documento
            </p>
            <div className="rounded-lg overflow-hidden bg-gray-100 min-h-[400px]">
              <iframe
                src={doc.file_url}
                title="Documento PDF"
                className="w-full h-[500px] border-0"
              />
            </div>
          </div>
          <div className="p-4">
            {doc.status === 'signed' && doc.signature_data_url ? (
              <>
                <p className="text-sm font-medium text-gray-600 mb-2">Assinatura</p>
                <div className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-center min-h-[200px]">
                  <img
                    src={doc.signature_data_url}
                    alt="Assinatura"
                    className="max-w-full max-h-[280px] object-contain"
                  />
                </div>
                {(doc.signed_client_at || doc.signed_at || (doc.signed_latitude != null && doc.signed_longitude != null)) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    {doc.signed_client_at && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-avocado" />
                        Horário (assinante): {new Date(doc.signed_client_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                    {doc.signed_at && !doc.signed_client_at && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-avocado" />
                        Assinado em: {new Date(doc.signed_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                    {doc.signed_latitude != null && doc.signed_longitude != null && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-avocado" />
                        <a
                          href={`https://www.google.com/maps?q=${doc.signed_latitude},${doc.signed_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-avocado hover:underline"
                        >
                          Ver local da assinatura no mapa
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-sm">Aguardando assinatura do cliente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
