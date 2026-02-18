'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthSidePanel } from '@/components/AuthSidePanel'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSent(false)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
      })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center pl-6 pr-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar senha</h1>
            <p className="text-gray-600 text-sm mb-8">
              Digite seu email e enviaremos um link para você criar uma nova senha.
            </p>

            {sent ? (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-200 p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-800">Email enviado</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    Se existir uma conta com <strong>{email}</strong>, você receberá um link para redefinir a senha. Verifique também a pasta de spam.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 text-red-600 text-sm border border-red-200">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-sm bg-white border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-sm bg-black hover:bg-black/90 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar link'}
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-gray-600 text-sm">
              <Link href="/login" className="text-red-600 hover:text-red-700 font-semibold">
                Voltar ao login
              </Link>
            </p>
          </div>
        </div>
      </div>
      <AuthSidePanel />
    </div>
  )
}
