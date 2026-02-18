'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, Briefcase, TrendingUp } from 'lucide-react'
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
  icon: React.ComponentType<{ className?: string }>
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
  const [clients, setClients] = useState<{ id: string; name: string; status: string; created_at?: string }[]>([])
  const [proposals, setProposals] = useState<{ id: string; title: string; status: string; client_name?: string; created_at?: string; proposal_value?: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [performancePeriod, setPerformancePeriod] = useState<'Anual' | 'Mensal'>('Anual')

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

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const newClients = clients.filter((c) => c.created_at && new Date(c.created_at) >= thirtyDaysAgo).length
  const returningClients = totalClients - newClients
  const newPct = totalClients > 0 ? Math.round((newClients / totalClients) * 100) : 50
  const returningPct = 100 - newPct
  const distributionData = [
    { name: 'Novos', value: newPct || 50, color: CHART_ORANGE },
    { name: 'Recorrentes', value: returningPct || 50, color: '#E2E8F0' },
  ]
  const dominantPct = distributionData.reduce((max, e) => (e.value > max.value ? e : max), distributionData[0])

  const performanceData = [
    { mes: 'Jan', valor: 2500 },
    { mes: 'Fev', valor: 4200 },
    { mes: 'Mar', valor: 3800 },
    { mes: 'Abr', valor: 5100 },
    { mes: 'Mai', valor: 6200 },
    { mes: 'Jun', valor: 7500 },
    { mes: 'Jul', valor: 6800 },
    { mes: 'Ago', valor: 8200 },
    { mes: 'Set', valor: 9100 },
    { mes: 'Out', valor: 8800 },
    { mes: 'Nov', valor: 9500 },
    { mes: 'Dez', valor: totalRevenue > 0 ? totalRevenue / 1000 : 10 },
  ]

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
        <p className="text-slate-500">Bem-vindo! Aqui está a visão geral do seu negócio.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border-0 shadow-sm bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Desempenho</h2>
              <p className="text-sm text-slate-500">Acompanhe a evolução do seu negócio</p>
            </div>
            <select
              value={performancePeriod}
              onChange={(e) => setPerformancePeriod(e.target.value as 'Anual' | 'Mensal')}
              className="text-sm rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-700"
            >
              <option value="Anual">Anual</option>
              <option value="Mensal">Mensal</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_ORANGE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_ORANGE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  tickFormatter={(v) => `R$${v >= 1000 ? `${v / 1000}k` : v}`}
                />
                <Tooltip
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                  }}
                />
                <Area
                  type="natural"
                  dataKey="valor"
                  stroke={CHART_ORANGE}
                  strokeWidth={3}
                  fill="url(#colorValor)"
                  fillOpacity={1}
                  dot={{ stroke: CHART_ORANGE, strokeWidth: 1, r: 4, fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border-0 shadow-sm bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Distribuição de Clientes</h2>
          <p className="text-sm text-slate-500 mb-4">Novos vs recorrentes</p>
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, '']}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-3xl font-bold text-slate-900">{dominantPct?.value ?? 0}%</span>
                <p className="text-sm text-slate-500 mt-0.5">Clientes</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {distributionData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-slate-600">{entry.name}</span>
                <span className="text-sm font-semibold text-slate-900">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
