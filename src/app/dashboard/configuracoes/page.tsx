'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, Trash2, User, Lock, Mail } from 'lucide-react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 2

export default function ConfiguracoesPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const avatarUrl = profile?.avatar_url ?? null

  const UPLOAD_TIMEOUT_MS = 25000

  const removeOldAvatarsInBackground = async (keepPath?: string) => {
    if (!user?.id) return
    try {
      const { data: list } = await supabase.storage.from('avatars').list(user.id)
      if (!list?.length) return
      const toRemove = list
        .map((f) => `${user.id}/${f.name}`)
        .filter((p) => !keepPath || p !== keepPath)
      if (toRemove.length) await supabase.storage.from('avatars').remove(toRemove)
    } catch {
      // ignora; não bloqueia o fluxo
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    setError(null)
    setSuccess(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Use JPEG, PNG, WebP ou GIF.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Tamanho máximo: ${MAX_SIZE_MB} MB.`)
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.set('file', file)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const resData = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((resData as { error?: string }).error || 'Falha ao enviar foto.')
      }
      await refreshProfile()
      setSuccess('Foto atualizada.')
      if (inputRef.current) inputRef.current.value = ''
      removeOldAvatarsInBackground(`${user.id}/avatar.${file.name.split('.').pop()?.toLowerCase() || 'png'}`)
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Tempo esgotado. Verifique sua conexão e tente novamente.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Erro ao enviar foto.')
      }
    }
    setLoading(false)
  }

  const handleRemoveLogo = async () => {
    if (!user?.id) return
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await removeOldAvatarsInBackground()
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar_url: null }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar perfil')
      await refreshProfile()
      setSuccess('Foto removida.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover foto.')
    }
    setLoading(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }
    setPasswordLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      setPasswordSuccess('Senha alterada com sucesso.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erro ao alterar senha.')
    }
    setPasswordLoading(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Configurações</h1>
      <p className="text-gray-500 mb-6">Gerencie sua conta, senha e foto de perfil.</p>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-sm">
          {success}
        </div>
      )}

      <div className="max-w-md space-y-6">
        <div className="p-6 rounded-xl border border-gray-200 bg-white">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-avocado" />
            Dados da conta
          </h2>
          <p className="text-sm text-gray-600">
            E-mail: <span className="font-medium text-gray-900">{user?.email ?? profile?.email ?? '—'}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado aqui.</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 bg-white">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-avocado" />
            Alterar senha
          </h2>
          {passwordError && (
            <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="mb-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-sm">
              {passwordSuccess}
            </div>
          )}
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading || !newPassword || !confirmPassword}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-avocado text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Alterar senha
            </button>
          </form>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 bg-white">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-avocado" />
            Foto de perfil
          </h2>
          <p className="text-sm text-gray-500 mb-4">Sua foto aparece no perfil e pode ser usada nas propostas.</p>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Sua foto"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-gray-400 text-xs text-center px-2">Sem foto</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handleUpload}
                disabled={loading}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-avocado text-white font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {avatarUrl ? 'Trocar foto' : 'Enviar foto'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover foto
                </button>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            JPEG, PNG, WebP ou GIF. Máximo {MAX_SIZE_MB} MB.
          </p>
        </div>
      </div>
    </div>
  )
}
