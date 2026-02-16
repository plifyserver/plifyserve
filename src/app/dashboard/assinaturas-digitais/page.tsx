'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PenTool, Plus, Copy, FileText, CheckCircle, Clock } from 'lucide-react'

type Doc = {
  id: string
  file_url: string
  client_name: string
  client_email: string
  client_whatsapp: string | null
  slug: string
  status: 'pending' | 'signed'
  signature_data_url: string | null
  signed_at: string | null
  created_at: string
}

export default function AssinaturasDigitaisPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocs = async () => {
      const res = await fetch('/api/assinaturas-digitais', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setDocs(data)
      setLoading(false)
    }
    fetchDocs()
  }, [])

  const copyLink = (slug: string) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/a/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const signed = docs.filter((d) => d.status === 'signed')
  const pending = docs.filter((d) => d.status === 'pending')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PenTool className="w-7 h-7 text-avocado" />
          Assinaturas Digitais
        </h1>
        <Link
          href="/dashboard/assinaturas-digitais/novo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-avocado text-white hover:opacity-90 transition"
        >
          <Plus className="w-5 h-5" />
          Novo documento
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total de documentos</p>
          <p className="text-2xl font-bold text-gray-900">{docs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Assinados
          </p>
          <p className="text-2xl font-bold text-green-600">{signed.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-4 h-4 text-amber-600" />
            Pendentes
          </p>
          <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum documento ainda.</p>
          <Link
            href="/dashboard/assinaturas-digitais/novo"
            className="inline-flex items-center gap-2 mt-4 text-avocado font-medium"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro documento
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">E-mail</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Link</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 text-gray-900">{doc.client_name}</td>
                  <td className="py-3 px-4 text-gray-600 text-sm">{doc.client_email}</td>
                  <td className="py-3 px-4">
                    {doc.status === 'signed' ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" /> Assinado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
                        <Clock className="w-4 h-4" /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => copyLink(doc.slug)}
                      className="inline-flex items-center gap-1 text-sm text-avocado hover:underline"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedSlug === doc.slug ? 'Copiado!' : 'Copiar link'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/dashboard/assinaturas-digitais/${doc.id}`}
                      className="text-sm text-gray-600 hover:text-avocado"
                    >
                      Ver documento
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
