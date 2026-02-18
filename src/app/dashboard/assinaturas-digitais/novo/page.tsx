'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PenTool, ArrowLeft, Upload, Copy } from 'lucide-react'

export default function NovoDocumentoAssinaturaPage() {
  const [file, setFile] = useState<File | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientWhatsapp, setClientWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setError('')
    } else if (f) {
      setFile(null)
      setError('Selecione apenas um arquivo PDF.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!file || !clientName.trim() || !clientEmail.trim()) {
      setError('Preencha todos os campos obrigatórios e anexe um PDF.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.set('file', file)
      const uploadRes = await fetch('/api/assinaturas-digitais/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) {
        setError(uploadData.error || 'Erro ao enviar PDF.')
        setLoading(false)
        return
      }

      const createRes = await fetch('/api/assinaturas-digitais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          file_url: uploadData.url,
          client_name: clientName.trim(),
          client_email: clientEmail.trim(),
          client_whatsapp: clientWhatsapp.trim() || undefined,
        }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) {
        setError(createData.error || 'Erro ao criar documento.')
        setLoading(false)
        return
      }

      setCreatedSlug(createData.slug)
    } catch {
      setError('Erro de conexão.')
    }
    setLoading(false)
  }

  const signLink = createdSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/a/${createdSlug}`
    : ''

  const copyLink = () => {
    if (!signLink) return
    navigator.clipboard.writeText(signLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (createdSlug) {
    return (
      <div className="max-w-xl mx-auto">
        <Link
          href="/dashboard/assinaturas-digitais"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-avocado mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <PenTool className="w-6 h-6" />
            <h2 className="text-xl font-bold">Documento criado</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Envie o link abaixo para o cliente assinar. Você pode copiar e colar no WhatsApp ou e-mail.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={signLink}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
            />
            <button
              type="button"
              onClick={copyLink}
              className="px-4 py-2 rounded-lg bg-avocado text-white flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <Link
            href="/dashboard/assinaturas-digitais"
            className="inline-block mt-6 text-avocado font-medium"
          >
            Ver todos os documentos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link
        href="/dashboard/assinaturas-digitais"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-avocado mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
          <PenTool className="w-6 h-6 text-avocado" />
          Novo documento para assinatura
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento PDF *</label>
            <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-avocado hover:bg-avocado/5 transition">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">
                {file ? file.name : 'Clique para selecionar um PDF'}
              </span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do cliente *</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              placeholder="Ex.: João Silva"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do cliente *</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              placeholder="cliente@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (opcional)</label>
            <input
              type="text"
              value={clientWhatsapp}
              onChange={(e) => setClientWhatsapp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              placeholder="(11) 99999-9999"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-avocado text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar e gerar link'}
          </button>
        </form>
      </div>
    </div>
  )
}
