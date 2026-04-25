'use client'

import { useEffect, useState } from 'react'
import { useCmsRuntime, type SettingsCmsVersion, type SidebarStyle } from '@/contexts/CmsRuntimeContext'

export default function CmsConfiguracoesPage() {
  const { settingsCmsVersion, sidebarStyle, loading } = useCmsRuntime()
  const [desiredVersion, setDesiredVersion] = useState<SettingsCmsVersion>('v1')
  const [desiredSidebarStyle, setDesiredSidebarStyle] = useState<SidebarStyle>('default')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  useEffect(() => {
    if (!loading) {
      setDesiredVersion(settingsCmsVersion)
      setDesiredSidebarStyle(sidebarStyle)
    }
  }, [loading, settingsCmsVersion, sidebarStyle])

  const submit = async () => {
    setSubmitting(true)
    setStatus(null)
    try {
      const [resSettings, resSidebar] = await Promise.all([
        fetch('/api/admin/cms/settings-version', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ version: desiredVersion, password }),
        }),
        fetch('/api/admin/cms/sidebar-style', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ style: desiredSidebarStyle, password }),
        }),
      ])

      const dataSettings = (await resSettings.json().catch(() => ({}))) as { error?: string }
      const dataSidebar = (await resSidebar.json().catch(() => ({}))) as { error?: string }
      if (!resSettings.ok) throw new Error(dataSettings.error || 'Falha ao salvar (configurações)')
      if (!resSidebar.ok) throw new Error(dataSidebar.error || 'Falha ao salvar (sidebar)')

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
      <h1 className="text-2xl font-semibold text-white">CMS • Configurações</h1>
      <p className="mt-2 text-slate-300">
        No <strong className="text-white">CMS 2</strong>, Planos e Personalização saem do menu e ficam em guias dentro
        de Configurações; o utilizador reordena o menu lateral; Meu perfil mostra só Especialização (sem foto, senha ou
        dados da conta neste modo). A troca é em tempo real.
      </p>

      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-5">
        <p className="text-sm text-slate-300">
          Modo atual:{' '}
          <span className="font-medium text-white">
            {loading ? 'Carregando…' : settingsCmsVersion === 'v2' ? 'CMS 2 (hub Configurações)' : 'CMS 1 (fluxo clássico)'}
          </span>
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-sm font-medium text-slate-200">Modo das configurações</span>
            <div className="mt-2 space-y-3">
              <label className="flex cursor-pointer items-start gap-2 text-slate-200">
                <input
                  type="radio"
                  name="settings-cms-version"
                  className="mt-1"
                  checked={desiredVersion === 'v1'}
                  onChange={() => setDesiredVersion('v1')}
                />
                <span>
                  <span className="font-medium text-white">CMS 1</span>
                  <span className="block text-xs text-slate-400">
                    Configurações com dados da conta, senha e foto; menu padrão com Planos no lateral.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-slate-200">
                <input
                  type="radio"
                  name="settings-cms-version"
                  className="mt-1"
                  checked={desiredVersion === 'v2'}
                  onChange={() => setDesiredVersion('v2')}
                />
                <span>
                  <span className="font-medium text-white">CMS 2</span>
                  <span className="block text-xs text-slate-400">
                    Guia Reajuste de menu + Personalização + Planos em Configurações; perfil só Especialização.
                  </span>
                </span>
              </label>
            </div>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-200">SLIDEBAR (menu lateral)</span>
            <div className="mt-2 space-y-3">
              <label className="flex cursor-pointer items-start gap-2 text-slate-200">
                <input
                  type="radio"
                  name="sidebar-style"
                  className="mt-1"
                  checked={desiredSidebarStyle === 'default'}
                  onChange={() => setDesiredSidebarStyle('default')}
                />
                <span>
                  <span className="font-medium text-white">Padrão</span>
                  <span className="block text-xs text-slate-400">
                    Sidebar atual (escura, com destaque sólido na cor primária).
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-slate-200">
                <input
                  type="radio"
                  name="sidebar-style"
                  className="mt-1"
                  checked={desiredSidebarStyle === 'clean'}
                  onChange={() => setDesiredSidebarStyle('clean')}
                />
                <span>
                  <span className="font-medium text-white">Clean</span>
                  <span className="block text-xs text-slate-400">
                    Visual mais limpo (estilo CMS), com sidebar clara e ajustes globais no dashboard.
                  </span>
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
