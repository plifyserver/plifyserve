'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, Save, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function MinhaPaginaPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    company_name: '',
    slogan: '',
    about_text: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
  })
  const [slug, setSlug] = useState('')

  useEffect(() => {
    const fetchPage = async () => {
      const res = await fetch('/api/company-page', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setForm({
          company_name: data.company_name || '',
          slogan: data.slogan || '',
          about_text: data.about_text || '',
          logo_url: data.logo_url || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
        })
        setSlug(data.slug || '')
      }
      setLoading(false)
    }
    fetchPage()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/company-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setSlug(data.slug)
        alert('Página salva!')
      } else {
        const err = await res.json()
        alert(err.error || 'Erro ao salvar')
      }
    } catch {
      alert('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-avocado" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Minha Página</h1>
      <p className="text-zinc-400 mb-6">
        Edite os dados da sua empresa. Sua página pública será exibida em /empresa/seu-slug
      </p>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Nome da empresa</label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            placeholder="Sua Empresa Ltda"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Slogan</label>
          <input
            type="text"
            value={form.slogan}
            onChange={(e) => setForm({ ...form, slogan: e.target.value })}
            placeholder="Sua marca, sua solução"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Sobre nós</label>
          <textarea
            value={form.about_text}
            onChange={(e) => setForm({ ...form, about_text: e.target.value })}
            placeholder="Texto institucional..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">URL da logo</label>
          <input
            type="url"
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            placeholder="https://..."
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Email de contato</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="contato@empresa.com"
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Telefone</label>
            <input
              type="text"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-avocado hover:bg-avocado-light text-white font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
          {slug && (
            <a
              href={`/empresa/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-zinc-600 hover:border-zinc-500 text-gray-600"
            >
              <ExternalLink className="w-4 h-4" />
              Ver página pública
            </a>
          )}
        </div>
      </form>
    </div>
  )
}
