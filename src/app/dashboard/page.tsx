'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, Briefcase, TrendingUp, LucideIcon } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const CHART_ORANGE = '#F59E0B'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trendValue: string
  color: string
}

function StatsCard({ title, value, icon: Icon, trendValue, color }: StatsCardProps) {
  return (
    <div className="p-6 rounded-2xl border-0 shadow-sm bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
          <p className="text-sm mt-1 text-emerald-600 font-medium">{trendValue}</p>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [clients, setClients] = useState<
    { id: string; name: string; status: string; created_at?: string }[]
  >([])
  const [proposals, setProposals] = useState<
    {
      id: string
      title: string
      status: string
      client_name?: string
      created_at?: string
      proposal_value?: number
    }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [performancePeriod, setPerformancePeriod] =
    useState<'Anual' | 'Mensal'>('Anual')

  useEffect(() => {
    const load = async () => {
      try {
        const [cr, pr] = await Promise.all([
          fetch('/api/clients', { credentials: 'include' }),
          fetch('/api/proposals', { credentials: 'include' }),
        ])
        if (cr.ok) setClients(await cr.json())
        if (pr.ok) setProposals(await pr.json())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.status === 'active').length
  const totalProposals = proposals.length
  const totalRevenue = proposals
    .filter((p) => p.status === 'accepted')
    .reduce((sum, p) => sum + (Number(p.proposal_value) || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">
          Bem-vindo! Aqui está a visão geral do seu negócio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Clientes"
          value={totalClients}
          icon={Users}
          trendValue="+12% último mês"
          color={CHART_ORANGE}
        />
        <StatsCard
          title="Receita Aprovada"
          value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`}
          icon={TrendingUp}
          trendValue="+8% último mês"
          color="#10B981"
        />
        <StatsCard
          title="Projetos Ativos"
          value={activeClients}
          icon={Briefcase}
          trendValue="+5% último mês"
          color="#8B5CF6"
        />
        <StatsCard
          title="Propostas"
          value={totalProposals}
          icon={FileText}
          trendValue="+15% último mês"
          color="#F59E0B"
        />
      </div>
    </div>
  )
}
