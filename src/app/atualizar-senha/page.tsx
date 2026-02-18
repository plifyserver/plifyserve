'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthSidePanel } from '@/components/AuthSidePanel'

export default function AtualizarSenhaPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const check = () =>
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setReady(true)
          setError('')
        } else if (hash) {
          setError('Link inválido ou expirado. Solicite um novo link de recuperação.')
          setReady(true)
        } else {
          setError('Acesse este link pelo email de recuperação de senha.')
          setReady(true)
        }
      })
    check()
    if (hash) setTimeout(check, 500)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setSuccess(true)
    await supabase.auth.signOut()
    setTimeout(() => router.push('/login'), 2000)
  }

  if (!ready && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center pl-6 pr-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Nova senha</h1>
            <p className="text-gray-600 text-sm mb-8">
              Escolha uma senha segura para acessar sua conta.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-600 text-sm border border-red-200">
                {error}
              </div>
            )}

            {success ? (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-200 p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-800">Senha alterada</p>
                  <p className="text-sm text-emerald-700 mt-1">Redirecionando para o login...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Nova senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 rounded-sm bg-white border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 rounded-sm bg-white border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-sm bg-black hover:bg-black/90 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar nova senha'}
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
