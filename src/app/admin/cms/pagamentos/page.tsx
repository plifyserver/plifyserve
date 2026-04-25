'use client'

import { useEffect, useState } from 'react'
import { useCmsRuntime } from '@/contexts/CmsRuntimeContext'

export default function CmsPagamentosPage() {
  const { paymentsEnabled, loading } = useCmsRuntime()
  const [desiredEnabled, setDesiredEnabled] = useState(false)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  useEffect(() => {
    if (!loading) setDesiredEnabled(paymentsEnabled)
  }, [loading, paymentsEnabled])

  const submit = async () => {
    setSubmitting(true)
    setStatus(null)
    try {
      const res = await fetch('/api/admin/cms/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: desiredEnabled, password }),
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
      <h1 className="text-2xl font-semibold text-white">CMS • Pagamentos (PIX)</h1>
      <p className="mt-2 text-slate-300">
        Quando ativado, os utilizadores veem <strong className="text-white">Pagamentos</strong> no menu do dashboard,
        cadastram a chave PIX, escolhem o banco e o valor, e geram QR Code estático para partilhar (WhatsApp, PDF,
        imagem ou impressão). A desativação é imediata.
      </p>

      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-5">
        <p className="text-sm text-slate-300">
          Status atual:{' '}
          <span className={paymentsEnabled ? 'text-emerald-300 font-medium' : 'text-rose-300 font-medium'}>
            {loading ? 'Carregando…' : paymentsEnabled ? 'Ativado' : 'Desativado'}
          </span>
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-sm font-medium text-slate-200">Função Pagamentos</span>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 text-slate-200">
                <input
                  type="radio"
                  name="payments-enabled"
                  checked={desiredEnabled === true}
                  onChange={() => setDesiredEnabled(true)}
                />
                Ativar
              </label>
              <label className="flex items-center gap-2 text-slate-200">
                <input
                  type="radio"
                  name="payments-enabled"
                  checked={desiredEnabled === false}
                  onChange={() => setDesiredEnabled(false)}
                />
                Desativar
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
