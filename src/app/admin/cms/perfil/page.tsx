'use client'

import { useEffect, useState } from 'react'
import { useCmsRuntime, type ProfileCmsVersion } from '@/contexts/CmsRuntimeContext'

export default function CmsPerfilPage() {
  const { profileCmsVersion, loading } = useCmsRuntime()
  const [desiredVersion, setDesiredVersion] = useState<ProfileCmsVersion>('v1')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  useEffect(() => {
    if (!loading) setDesiredVersion(profileCmsVersion)
  }, [loading, profileCmsVersion])

  const submit = async () => {
    setSubmitting(true)
    setStatus(null)
    try {
      const res = await fetch('/api/admin/cms/profile-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ version: desiredVersion, password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar')
      setStatus({ kind: 'ok', msg: 'Atualizado com sucesso.' })
      setPassword('')
    } catch (e) {
      setStatus({ kind: 'err', msg: e instanceof Error ? e.message : 'Erro ao salvar' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-white">CMS • Perfil</h1>
      <p className="mt-2 text-slate-300">
        Escolha se os usuários veem o bloco <strong className="text-white">Especialização</strong> em Meu perfil. A
        troca é em tempo real.
      </p>

      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-5">
        <p className="text-sm text-slate-300">
          Modo atual:{' '}
          <span className="font-medium text-white">
            {loading ? 'Carregando…' : profileCmsVersion === 'v2' ? 'CMS 2 (com Especialização)' : 'CMS 1 (sem Especialização)'}
          </span>
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-sm font-medium text-slate-200">Modo do perfil</span>
            <div className="mt-2 space-y-3">
              <label className="flex cursor-pointer items-start gap-2 text-slate-200">
                <input
                  type="radio"
                  name="profile-cms-version"
                  className="mt-1"
                  checked={desiredVersion === 'v1'}
                  onChange={() => setDesiredVersion('v1')}
                />
                <span>
                  <span className="font-medium text-white">CMS 1</span>
                  <span className="block text-xs text-slate-400">Perfil sem o bloco Especialização.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-slate-200">
                <input
                  type="radio"
                  name="profile-cms-version"
                  className="mt-1"
                  checked={desiredVersion === 'v2'}
                  onChange={() => setDesiredVersion('v2')}
                />
                <span>
                  <span className="font-medium text-white">CMS 2</span>
                  <span className="block text-xs text-slate-400">Perfil com áreas, especialidades e nichos.</span>
                </span>
              </label>
            </div>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-200">Senha do Admin</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              placeholder="Digite a senha…"
              autoComplete="current-password"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !password.trim()}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? 'Salvando…' : 'Salvar'}
          </button>

          {status ? (
            <p className={`text-sm ${status.kind === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>{status.msg}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
