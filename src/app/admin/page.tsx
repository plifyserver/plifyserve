'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, Activity, TrendingUp, Crown, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  totalUsers: number
  totalTemplates: number
  proUsers: number
  socioUsers: number
  bannedUsers: number
  recentLogs: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTemplates: 0,
    proUsers: 0,
    socioUsers: 0,
    bannedUsers: 0,
    recentLogs: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      
      const [usersRes, templatesRes, proRes, socioRes, bannedRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('templates').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'pro'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_type', 'socio'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('banned', true),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ])

      setStats({
        totalUsers: usersRes.count || 0,
        totalTemplates: templatesRes.count || 0,
        proUsers: proRes.count || 0,
        socioUsers: socioRes.count || 0,
        bannedUsers: bannedRes.count || 0,
        recentLogs: logsRes.count || 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  const statCards = [
    { label: 'Total Usuários', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Templates', value: stats.totalTemplates, icon: FileText, color: 'bg-emerald-500' },
    { label: 'Usuários Pro', value: stats.proUsers, icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Sócios', value: stats.socioUsers, icon: Crown, color: 'bg-amber-500' },
    { label: 'Banidos', value: stats.bannedUsers, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Logs (24h)', value: stats.recentLogs, icon: Activity, color: 'bg-slate-500' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-slate-400">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? '...' : card.value.toLocaleString()}
            </p>
            <p className="text-sm text-slate-400">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            <a href="/admin/users" className="block p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-white">
              Gerenciar Usuários
            </a>
            <a href="/admin/templates" className="block p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-white">
              Gerenciar Templates
            </a>
            <a href="/admin/logs" className="block p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-white">
              Ver Logs do Sistema
            </a>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Status do Sistema</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <span className="text-slate-300">Banco de Dados</span>
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <span className="text-slate-300">Storage</span>
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <span className="text-slate-300">Autenticação</span>
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
