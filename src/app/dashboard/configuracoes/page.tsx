'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, Trash2, User } from 'lucide-react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 2

export default function ConfiguracoesPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const avatarUrl = profile?.avatar_url ?? null

  const removeLogoFromBucket = async () => {
    if (!user?.id) return
    const prefix = `${user.id}/`
    const { data: list } = await supabase.storage.from('avatars').list(user.id)
    if (list?.length) {
      const paths = list.map((f) => `${user.id}/${f.name}`)
      await supabase.storage.from('avatars').remove(paths)
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
      await removeLogoFromBucket()
      const ext = file.name.split('.').pop() || 'png'
      const path = `${user.id}/logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = urlData.publicUrl

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar_url: publicUrl }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar perfil')
      await refreshProfile()
      setSuccess('Logo atualizada.')
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar logo.')
    }
    setLoading(false)
  }

  const handleRemoveLogo = async () => {
    if (!user?.id) return
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await removeLogoFromBucket()
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar_url: null }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar perfil')
      await refreshProfile()
      setSuccess('Logo removida.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover logo.')
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Configurações</h1>
      <p className="text-gray-500 mb-6">Sua logo será usada nas propostas e no perfil.</p>

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
            <User className="w-5 h-5 text-avocado" />
            Sua logo
          </h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Sua logo"
                  width={96}
                  height={96}
                  className="object-contain w-full h-full"
                />
              ) : (
                <span className="text-gray-400 text-xs text-center px-2">Sem logo</span>
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-avocado text-white font-medium hover:bg-avocado-light disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {avatarUrl ? 'Trocar logo' : 'Enviar logo'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover logo
                </button>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            JPEG, PNG, WebP ou GIF. Máximo {MAX_SIZE_MB} MB. Ao trocar ou remover, a imagem anterior é apagada do servidor.
          </p>
        </div>
      </div>
    </div>
  )
}
