'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  FileText,
  Activity,
  TrendingUp,
  Shield,
  AlertTriangle,
  UserX,
  FileStack,
} from 'lucide-react'

interface Stats {
  totalUsers: number
  bannedUsers: number
  adminUsers: number
  proPaying: number
  essentialPaying: number
  noPaidAccess: number
  proposalsCount: number
  logsLast24h: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Falha ao carregar estatísticas')
        }
        if (!cancelled) setStats(data as Stats)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erro ao carregar')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const s = stats

  type StatCard = {
    label: string
    value: number
    icon: typeof Users
    color: string
    hint?: string
  }

  const statCards: StatCard[] = [
    { label: 'Total de usuários', value: s?.totalUsers ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Plano Pro (pagos)', value: s?.proPaying ?? 0, icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Essential / cortesia', value: s?.essentialPaying ?? 0, icon: FileText, color: 'bg-cyan-600' },
    {
      label: 'Sem assinatura ativa',
      value: s?.noPaidAccess ?? 0,
      icon: UserX,
      color: 'bg-amber-600',
      hint: 'Conta criada, sem Stripe/cortesia válida (exc. admin)',
    },
    { label: 'Banidos', value: s?.bannedUsers ?? 0, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Administradores', value: s?.adminUsers ?? 0, icon: Shield, color: 'bg-rose-600' },
    { label: 'Propostas criadas', value: s?.proposalsCount ?? 0, icon: FileStack, color: 'bg-emerald-500' },
    { label: 'Logs (24h)', value: s?.logsLast24h ?? 0, icon: Activity, color: 'bg-slate-500' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-slate-400">Números reais do banco (planos, acesso e conteúdo)</p>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? '…' : card.value.toLocaleString('pt-BR')}
            </p>
            <p className="text-sm text-slate-400 leading-snug">{card.label}</p>
            {card.hint ? (
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">{card.hint}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Ações rápidas</h2>
          <div className="space-y-2">
            <Link
              href="/admin/users"
              className="block p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-white"
            >
              Gerenciar usuários
            </Link>
            <Link
              href="/admin/templates"
              className="block p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-white"
            >
              Propostas
            </Link>
            <Link
              href="/admin/logs"
              className="block p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-white"
            >
              Logs do sistema
            </Link>
            <Link
              href="/admin/settings"
              className="block p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-white"
            >
              Configurações
            </Link>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Status do sistema</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <span className="text-slate-300">Banco de dados</span>
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <span className="text-slate-300">Storage</span>
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <span className="text-slate-300">Autenticação</span>
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
