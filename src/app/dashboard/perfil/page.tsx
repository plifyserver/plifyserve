'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 2

export default function PerfilPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (profile?.full_name !== undefined) setFullName(profile.full_name ?? '')
  }, [profile?.full_name])

  const avatarUrl = profile?.avatar_url ?? null

  const removeAvatarFromBucket = async () => {
    if (!user?.id) return
    const { data: list } = await supabase.storage.from('avatars').list(user.id)
    if (list?.length) {
      const paths = list.map((f) => `${user.id}/${f.name}`)
      await supabase.storage.from('avatars').remove(paths)
    }
  }

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ full_name: fullName.trim() || null }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar nome')
      await refreshProfile()
      setSuccess('Nome atualizado.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    }
    setLoading(false)
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
      await removeAvatarFromBucket()
      const ext = file.name.split('.').pop() || 'png'
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar_url: urlData.publicUrl }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar foto')
      await refreshProfile()
      setSuccess('Foto atualizada.')
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar foto.')
    }
    setLoading(false)
  }

  const handleRemoveAvatar = async () => {
    if (!user?.id) return
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await removeAvatarFromBucket()
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar_url: null }),
      })
      if (!res.ok) throw new Error('Falha ao remover foto')
      await refreshProfile()
      setSuccess('Foto removida.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meu perfil</h1>
        <p className="text-sm text-slate-500 mt-0.5">Seus dados pessoais e foto de perfil</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {success}
        </div>
      )}

      <div className="max-w-md space-y-6">
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-600" />
              Dados pessoais
            </h2>
            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="rounded-lg border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <Input
                  type="text"
                  value={user?.email ?? ''}
                  disabled
                  className="rounded-lg border-slate-200 bg-slate-50 text-slate-600"
                />
                <p className="text-xs text-slate-500 mt-1">O e-mail não pode ser alterado aqui.</p>
              </div>
              <Button type="submit" disabled={loading} className="rounded-lg bg-slate-900 hover:bg-slate-800">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar nome'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Foto de perfil</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Foto de perfil"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 text-2xl font-medium">
                    {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
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
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  className="rounded-lg gap-2 bg-slate-900 hover:bg-slate-800"
                  onClick={() => inputRef.current?.click()}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {avatarUrl ? 'Trocar foto' : 'Enviar foto'}
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="rounded-lg gap-2 border-slate-200"
                    onClick={handleRemoveAvatar}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover foto
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              JPEG, PNG, WebP ou GIF. Máximo {MAX_SIZE_MB} MB.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
