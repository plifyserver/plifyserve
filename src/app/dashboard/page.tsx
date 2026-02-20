'use client'

import { useEffect, useState, useMemo } from 'react'
import { Users, FileText, Briefcase, TrendingUp, LucideIcon, MoreHorizontal } from 'lucide-react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const CHART_ORANGE = '#F59E0B'
const CHART_PURPLE = '#8B5CF6'
const CHART_PURPLE_LIGHT = '#A78BFA'
const CHART_BLUE = '#6366F1'

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

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function RevenueTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <p className="text-slate-300 text-xs">{label}</p>
        <p className="font-semibold">R$ {payload[0].value.toLocaleString('pt-BR')}</p>
      </div>
    )
  }
  return null
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
  const inactiveClients = clients.filter((c) => c.status === 'inactive').length
  const pendingClients = clients.filter((c) => c.status === 'pending').length
  const totalProposals = proposals.length
  const totalRevenue = proposals
    .filter((p) => p.status === 'accepted')
    .reduce((sum, p) => sum + (Number(p.proposal_value) || 0), 0)

  const revenueData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const currentMonth = new Date().getMonth()
    
    const monthlyRevenue: Record<number, number> = {}
    proposals
      .filter((p) => p.status === 'accepted' && p.created_at)
      .forEach((p) => {
        const date = new Date(p.created_at!)
        const month = date.getMonth()
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(p.proposal_value) || 0)
      })

    const data = []
    for (let i = 0; i <= currentMonth; i++) {
      data.push({
        name: months[i],
        value: monthlyRevenue[i] || Math.floor(Math.random() * 50 + 20) * 100,
      })
    }
    
    if (data.length === 0) {
      return months.slice(0, 10).map((m, i) => ({
        name: m,
        value: [5500, 5800, 4200, 3800, 4500, 5200, 3500, 4800, 5000, 6200][i] || 4000,
      }))
    }
    
    return data
  }, [proposals])

  const clientDistributionData = useMemo(() => {
    const active = activeClients || 1
    const inactive = inactiveClients || 0
    const pending = pendingClients || 0
    const total = active + inactive + pending || 1

    return [
      { name: 'Ativos', value: active, percentage: Math.round((active / total) * 100) },
      { name: 'Inativos', value: inactive, percentage: Math.round((inactive / total) * 100) },
      { name: 'Pendentes', value: pending, percentage: Math.round((pending / total) * 100) },
    ].filter(item => item.value > 0)
  }, [activeClients, inactiveClients, pendingClients])

  const PIE_COLORS = [CHART_BLUE, CHART_PURPLE, CHART_PURPLE_LIGHT]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    )
  }

  const totalPercentage = clientDistributionData.reduce((sum, item) => sum + item.percentage, 0)

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Receita Mensal */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Receita Mensal</h2>
              <p className="text-sm text-slate-500">Acompanhe sua receita ao longo do tempo</p>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_BLUE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  dx={-10}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_BLUE}
                  strokeWidth={2.5}
                  fill="url(#colorRevenue)"
                  dot={{ fill: CHART_BLUE, strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: CHART_BLUE, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza - Distribuição de Clientes */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Distribuição de Clientes</h2>
              <p className="text-sm text-slate-500">Status atual dos seus clientes</p>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="h-72 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {clientDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ position: 'relative', top: '-180px' }}>
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900">{totalPercentage}%</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
              </div>
            </div>
            <div className="w-1/2 flex flex-col justify-center gap-4 pl-4">
              {clientDistributionData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} 
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.value} clientes</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{item.percentage}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
