'use client'

import { useEffect, useState, useMemo } from 'react'
import { Users, FileText, FileSignature, Repeat, TrendingUp, LucideIcon, MoreHorizontal, Calendar } from 'lucide-react'
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
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { chartPaletteFromPrimary } from '@/lib/colorUtils'

const FALLBACK_PRIMARY = '#ea580c'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trendValue: string
  color: string
}

function StatsCard({ title, value, icon: Icon, trendValue, color }: StatsCardProps) {
  return (
    <div className="p-5 rounded-2xl border-0 shadow-sm bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 font-light">{title}</p>
          <h3 className="text-2xl font-semibold text-slate-900 mt-1 font-light tracking-tight">{value}</h3>
          <p className="text-sm mt-1 text-emerald-600 font-medium font-light">{trendValue}</p>
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

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'range'

interface DashboardStats {
  totalClients: number
  mmr: number
  receitaTotalMes: number
  contractsFinalized: number
  financeBalance: number
  totalProposals: number
  period: string
  from: string
  to: string
}

function buildStatsUrl(period: PeriodType, start?: string, end?: string): string {
  const params = new URLSearchParams()
  params.set('period', period)
  if (period === 'range' && start && end) {
    params.set('start', start)
    params.set('end', end)
  }
  return `/api/dashboard/stats?${params.toString()}`
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [settings, setSettings] = useState<{ primary_color?: string } | null>(null)
  const [clients, setClients] = useState<{ created_at?: string }[]>([])
  const [proposals, setProposals] = useState<{ status: string; created_at?: string; proposal_value?: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>('month')
  const [dateStart, setDateStart] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [dateEnd, setDateEnd] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [filterOpen, setFilterOpen] = useState(false)

  const primaryColor = settings?.primary_color || FALLBACK_PRIMARY
  const chartPalette = useMemo(() => chartPaletteFromPrimary(primaryColor), [primaryColor])

  useEffect(() => {
    setLoading(true)
    const load = async () => {
      try {
        const [sRes, setRes, cr, pr] = await Promise.all([
          fetch(buildStatsUrl(period, dateStart, dateEnd), { credentials: 'include' }),
          fetch('/api/app-settings', { credentials: 'include' }),
          fetch('/api/clients', { credentials: 'include' }),
          fetch('/api/proposals', { credentials: 'include' }),
        ])
        if (sRes.ok) setStats(await sRes.json())
        if (setRes.ok) setSettings(await setRes.json())
        if (cr.ok) setClients(await cr.json())
        if (pr.ok) setProposals(await pr.json())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [period, dateStart, dateEnd])

  const applyPeriod = (p: PeriodType) => {
    const now = new Date()
    setPeriod(p)
    switch (p) {
      case 'day':
        setDateStart(format(startOfDay(now), 'yyyy-MM-dd'))
        setDateEnd(format(endOfDay(now), 'yyyy-MM-dd'))
        break
      case 'week':
        setDateStart(format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd'))
        setDateEnd(format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd'))
        break
      case 'month':
        setDateStart(format(startOfMonth(now), 'yyyy-MM-dd'))
        setDateEnd(format(endOfMonth(now), 'yyyy-MM-dd'))
        break
      case 'year':
        setDateStart(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'))
        setDateEnd(format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'))
        break
      default:
        break
    }
    setFilterOpen(false)
  }

  const activeClients = clients.filter((c) => (c as { status?: string }).status === 'active').length
  const inactiveClients = clients.filter((c) => (c as { status?: string }).status === 'inactive').length
  const pendingClients = clients.filter((c) => (c as { status?: string }).status === 'pending').length

  const revenueData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const currentMonth = new Date().getMonth()
    const monthlyRevenue: Record<number, number> = {}
    proposals
      .filter((p) => p.status === 'accepted' && p.created_at)
      .forEach((p) => {
        const m = new Date(p.created_at!).getMonth()
        monthlyRevenue[m] = (monthlyRevenue[m] || 0) + (Number(p.proposal_value) || 0)
      })
    const data = []
    for (let i = 0; i <= currentMonth; i++) {
      data.push({
        name: months[i],
        value: monthlyRevenue[i] || 0,
      })
    }
    return data.length ? data : months.slice(0, 10).map((m, i) => ({ name: m, value: 0 }))
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
    ].filter((item) => item.value > 0)
  }, [activeClients, inactiveClients, pendingClients])

  const clientGrowthDataFull = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const byMonth: Record<number, number> = {}
    clients.forEach((c) => {
      if (c.created_at) {
        const m = new Date(c.created_at).getMonth()
        byMonth[m] = (byMonth[m] || 0) + 1
      }
    })
    return months.slice(0, new Date().getMonth() + 1).map((name, i) => ({ name, clientes: byMonth[i] || 0 }))
  }, [clients])

  const totalPercentage = clientDistributionData.reduce((sum, item) => sum + item.percentage, 0)
  const periodLabel =
    period === 'day'
      ? 'Hoje'
      : period === 'week'
        ? 'Esta semana'
        : period === 'month'
          ? 'Este mês'
          : period === 'year'
            ? 'Este ano'
            : `${format(new Date(dateStart), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(dateEnd), 'dd/MM/yyyy', { locale: ptBR })}`

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-light text-sm mt-0.5">Bem-vindo! Aqui está a visão geral do seu negócio.</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm"
          >
            <Calendar className="w-4 h-4" />
            {periodLabel}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl border border-slate-200 bg-white shadow-lg py-2">
                <button
                  type="button"
                  onClick={() => applyPeriod('day')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => applyPeriod('week')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Esta semana
                </button>
                <button
                  type="button"
                  onClick={() => applyPeriod('month')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Este mês
                </button>
                <button
                  type="button"
                  onClick={() => applyPeriod('year')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Este ano
                </button>
                <div className="border-t border-slate-100 my-2" />
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-slate-500 mb-2">Período personalizado</p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
                    />
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriod('range')
                      setFilterOpen(false)
                    }}
                    className="mt-2 w-full py-1.5 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total de Clientes"
          value={stats.totalClients}
          icon={Users}
          trendValue="+12% último mês"
          color={primaryColor}
        />
        <StatsCard
          title="Receita Total Mês"
          value={`R$ ${(stats.receitaTotalMes ?? stats.financeBalance).toLocaleString('pt-BR')}`}
          icon={TrendingUp}
          trendValue="Total de pontual e recorrentes"
          color="#10B981"
        />
        <StatsCard
          title="MMR"
          value={typeof stats.mmr === 'number' ? `R$ ${stats.mmr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : stats.mmr}
          icon={Repeat}
          trendValue="Receita recorrente"
          color="#8B5CF6"
        />
        <StatsCard
          title="Contratos"
          value={stats.contractsFinalized}
          icon={FileSignature}
          trendValue="Finalizados"
          color="#6366F1"
        />
        <StatsCard
          title="Propostas"
          value={stats.totalProposals}
          icon={FileText}
          trendValue="+15% último mês"
          color="#F59E0B"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 font-light">Receita Mensal</h2>
              <p className="text-sm text-slate-500 font-light">Acompanhe sua receita ao longo do tempo</p>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'inherit' }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  dx={-8}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={primaryColor}
                  strokeWidth={2.5}
                  fill="url(#colorRevenue)"
                  dot={{ fill: primaryColor, strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: primaryColor, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 font-light">Distribuição de Clientes</h2>
              <p className="text-sm text-slate-500 font-light">Status atual dos seus clientes</p>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="h-60 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {clientDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ position: 'relative', top: '-150px' }}>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-slate-900 font-light">{totalPercentage}%</p>
                  <p className="text-xs text-slate-500 font-light">Total</p>
                </div>
              </div>
            </div>
            <div className="w-1/2 flex flex-col justify-center gap-3 pl-4">
              {clientDistributionData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 font-light">{item.name}</p>
                    <p className="text-xs text-slate-500 font-light">{item.value} clientes</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 font-light">{item.percentage}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 font-light">Aumento de clientes</h2>
            <p className="text-sm text-slate-500 font-light">Clientes cadastrados no sistema por mês</p>
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={clientGrowthDataFull.length ? clientGrowthDataFull : [{ name: 'Jan', clientes: 0 }]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} dx={-8} />
              <Tooltip
                formatter={(value: number) => [value, 'Clientes']}
                labelFormatter={(label) => label}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="clientes"
                stroke={primaryColor}
                strokeWidth={2.5}
                fill="url(#colorClientes)"
                dot={{ fill: primaryColor, strokeWidth: 2, r: 4, stroke: '#fff' }}
                activeDot={{ r: 6, fill: primaryColor, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
