'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCmsRuntime, type CmsActiveVersion } from '@/contexts/CmsRuntimeContext'

export default function AdminCmsDashboardPage() {
  const { activeVersion, loading: runtimeLoading, error: runtimeError } = useCmsRuntime()
  const [password, setPassword] = useState('')
  const [target, setTarget] = useState<CmsActiveVersion>('v1')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => setTarget(activeVersion), [activeVersion])

  const statusText = useMemo(() => {
    if (runtimeLoading) return 'Carregando...'
    if (runtimeError) return runtimeError
    return activeVersion === 'v2' ? 'v2 (novo CMS)' : 'v1 (CMS atual)'
  }, [runtimeLoading, runtimeError, activeVersion])

  const submit = async () => {
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/cms/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ version: target, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(typeof data?.error === 'string' ? data.error : 'Falha ao alterar CMS')
        return
      }
      setPassword('')
      setMessage(`CMS alterado para ${target.toUpperCase()} com sucesso.`)
    } catch {
      setMessage('Erro de rede ao alterar CMS')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">CMS Dashboard</h1>
        <p className="text-slate-300 mt-1 text-sm">
          Alterna em tempo real entre o CMS atual (v1) e o novo (v2).
        </p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Versão ativa</p>
            <p className="text-lg font-semibold text-white mt-0.5">{statusText}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="rounded-lg border border-slate-700 bg-slate-900/30 px-4 py-3 text-slate-200 flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="cms-version"
                checked={target === 'v1'}
                onChange={() => setTarget('v1')}
              />
              <span>
                <span className="font-medium">v1</span>
                <span className="block text-xs text-slate-400 mt-0.5">CMS atual</span>
              </span>
            </label>

            <label className="rounded-lg border border-slate-700 bg-slate-900/30 px-4 py-3 text-slate-200 flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="cms-version"
                checked={target === 'v2'}
                onChange={() => setTarget('v2')}
              />
              <span>
                <span className="font-medium">v2</span>
                <span className="block text-xs text-slate-400 mt-0.5">Novo CMS</span>
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Senha para ativar</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha do CMS"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
            <p className="text-xs text-slate-400 mt-1">
              A senha é validada no servidor (env `CMS_SWITCH_PASSWORD`).
            </p>
          </div>

          {message ? (
            <div className="rounded-lg border border-slate-700 bg-slate-900/30 px-3 py-2 text-sm text-slate-200">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            disabled={submitting || runtimeLoading}
            onClick={submit}
            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-white font-medium hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Ativando...' : 'Ativar versão selecionada'}
          </button>
        </div>
      </div>
    </div>
  )
}

