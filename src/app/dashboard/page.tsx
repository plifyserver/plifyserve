'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Users, FileText, FileSignature, Repeat, TrendingUp, LucideIcon, MoreHorizontal, Calendar, AlertCircle } from 'lucide-react'
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
import { DASH_SURFACE_CARD, SITE_CONTAINER_LG } from '@/lib/siteLayout'
import { getNextBillingDueDateIso, shouldShowClientBillingReminderFromClient } from '@/lib/clientBillingReminder'

const FALLBACK_PRIMARY = '#dc2626'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trendValue: string
  color: string
}

function StatsCard({ title, value, icon: Icon, trendValue, color }: StatsCardProps) {
  return (
    <div className={`${DASH_SURFACE_CARD} p-5`}>
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
  const [pendingDateStart, setPendingDateStart] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [pendingDateEnd, setPendingDateEnd] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  const primaryColor = settings?.primary_color || FALLBACK_PRIMARY
  const chartPalette = useMemo(() => chartPaletteFromPrimary(primaryColor), [primaryColor])

  useEffect(() => {
    if (filterOpen) {
      setPendingDateStart(dateStart)
      setPendingDateEnd(dateEnd)
    }
  }, [filterOpen])

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

  const rangeStart = new Date(dateStart).getTime()
  const rangeEnd = new Date(dateEnd + 'T23:59:59.999').getTime()
  const clientsInPeriod = clients.filter((c) => {
    const created = (c as { created_at?: string }).created_at
    if (!created) return false
    const t = new Date(created).getTime()
    return t >= rangeStart && t <= rangeEnd
  })
  // Distribuição atual de clientes (ativos/inativos) considerando TODOS os clientes,
  // independente do período selecionado. O filtro de período é usado apenas para o gráfico de crescimento.
  const activeClients = clients.filter((c) => (c as { status?: string }).status === 'active').length
  const inactiveClients = clients.filter((c) => (c as { status?: string }).status === 'inactive').length

  const revenueData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    const mmr = stats?.mmr ?? 0
    const rangeStartDate = new Date(dateStart)
    const rangeEndDate = new Date(dateEnd)

    if (period === 'year') {
      const data: { name: string; value: number }[] = []
      for (let i = 0; i <= currentMonth; i++) {
        const value = i === currentMonth ? mmr : 0
        data.push({ name: months[i], value: Math.round(value * 100) / 100 })
      }
      return data.length ? data : months.slice(0, currentMonth + 1).map((m) => ({ name: m, value: 0 }))
    }
    if (period === 'month') {
      const today = new Date()
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      const lastDay =
        today.getMonth() === currentMonth && today.getFullYear() === currentYear ? today.getDate() : daysInMonth
      const dataMonth: { name: string; value: number }[] = []
      for (let day = 1; day <= lastDay; day++) {
        const running = mmr * (day / daysInMonth)
        dataMonth.push({
          name: String(day).padStart(2, '0'),
          value: Math.round(running * 100) / 100,
        })
      }
      return dataMonth.length ? dataMonth : [{ name: months[currentMonth], value: 0 }]
    }
    if (period === 'week' || period === 'day') {
      const daysInPeriod = period === 'day' ? 1 : 7
      const prorated = mmr * (daysInPeriod / 30)
      const label = period === 'day' ? 'Dia' : 'Semana'
      return [{ name: label, value: Math.round(prorated * 100) / 100 }]
    }
    if (period === 'range') {
      const keys: string[] = []
      for (let y = rangeStartDate.getFullYear(); y <= rangeEndDate.getFullYear(); y++) {
        const startM = y === rangeStartDate.getFullYear() ? rangeStartDate.getMonth() : 0
        const endM = y === rangeEndDate.getFullYear() ? rangeEndDate.getMonth() : 11
        for (let m = startM; m <= endM; m++) keys.push(`${y}-${m}`)
      }
      return keys.map((k) => {
        const [y, m] = k.split('-').map(Number)
        const label = `${months[m]} ${String(y).slice(2)}`
        const isCurrentMonth = y === currentYear && m === currentMonth
        const value = isCurrentMonth ? mmr : 0
        return { name: label, value: Math.round(value * 100) / 100 }
      })
    }
    return [{ name: months[currentMonth], value: 0 }]
  }, [stats?.mmr, period, dateStart, dateEnd])

  const clientsBillingSoon = useMemo(() => {
    type C = {
      id: string
      name: string
      payment_type?: string | null
      billing_due_day?: number | null
      billing_due_date?: string | null
      installment_count?: number | null
      created_at?: string | null
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayDiff = (dateStr: string) => {
      const d = new Date(dateStr + 'T12:00:00')
      d.setHours(0, 0, 0, 0)
      return Math.round((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    }
    return (clients as C[])
      .filter((c) => shouldShowClientBillingReminderFromClient(c, today))
      .map((c) => {
        const nextDue = getNextBillingDueDateIso(c, today)!
        return { ...c, days: dayDiff(nextDue), nextBillingDue: nextDue }
      })
      .filter((c) => c.days >= 0 && c.days <= 1)
      .sort((a, b) => a.days - b.days)
  }, [clients])

  const clientDistributionData = useMemo(() => {
    const active = activeClients ?? 0
    const inactive = inactiveClients ?? 0
    const total = active + inactive || 1
    return [
      { name: 'Ativos', value: active, percentage: Math.round((active / total) * 100) },
      { name: 'Inativos', value: inactive, percentage: Math.round((inactive / total) * 100) },
    ]
  }, [activeClients, inactiveClients])

  const clientGrowthDataFull = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const byMonth: Record<number, number> = {}
    clientsInPeriod.forEach((c) => {
      if (c.created_at) {
        const m = new Date((c as { created_at: string }).created_at).getMonth()
        byMonth[m] = (byMonth[m] || 0) + 1
      }
    })
    return months.slice(0, new Date().getMonth() + 1).map((name, i) => ({ name, clientes: byMonth[i] || 0 }))
  }, [clientsInPeriod])

  const totalClientsPie = (activeClients ?? 0) + (inactiveClients ?? 0)
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
    <div className={`space-y-5 ${SITE_CONTAINER_LG}`}>
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
                      value={pendingDateStart}
                      onChange={(e) => setPendingDateStart(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
                    />
                    <input
                      type="date"
                      value={pendingDateEnd}
                      onChange={(e) => setPendingDateEnd(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDateStart(pendingDateStart)
                      setDateEnd(pendingDateEnd)
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

      {clientsBillingSoon.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-amber-950">Cobranças próximas</p>
              <p className="mt-1 text-sm text-amber-900/80">
                Recorrentes: dia do vencimento e &quot;Válido até&quot; em Clientes. O aviso aparece{' '}
                <strong>no dia anterior</strong> ao vencimento e <strong>no próprio dia</strong>, quando você abre o painel.
                Pontuais: uma data de cobrança, mesma regra.
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {clientsBillingSoon.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-slate-900">{c.name}</span>
                    <span className="text-amber-800">
                      {c.days === 0 ? 'Vence hoje' : 'Vence amanhã'}
                      {c.nextBillingDue
                        ? ` · ${format(new Date(`${c.nextBillingDue}T12:00:00`), 'dd/MM/yyyy', { locale: ptBR })}`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/clientes"
                className="mt-3 inline-block text-sm font-medium text-amber-900 underline-offset-2 hover:underline"
              >
                Abrir clientes
              </Link>
            </div>
          </div>
        </div>
      ) : null}

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
          value={`R$ ${(stats.receitaTotalMes ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          trendValue="Mês atual: pontuais cadastrados + parcelas a vencer no mês + entradas (recorrente)"
          color="#10B981"
        />
        <StatsCard
          title="MMR"
          value={typeof stats.mmr === 'number' ? `R$ ${stats.mmr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : stats.mmr}
          icon={Repeat}
          trendValue="Só recorrente: parcelas do mês + entrada no mês do cadastro"
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
        <div className={`${DASH_SURFACE_CARD} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 font-light">Receita prevista (clientes)</h2>
              <p className="text-sm text-slate-500 font-light">
                Valores dos clientes ativos; não inclui lançamentos de Gastos Pessoais
              </p>
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

        <div className={`${DASH_SURFACE_CARD} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 font-light">Distribuição de Clientes</h2>
              <p className="text-sm text-slate-500 font-light">Status atual dos seus clientes</p>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="h-60 flex items-center min-h-0">
            <div className="w-1/2 h-full min-h-0 relative flex items-center justify-center py-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <Pie
                    data={clientDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="78%"
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
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center justify-center gap-0 leading-none">
                  <span className="text-xl font-semibold text-slate-900 font-light">{totalClientsPie}</span>
                  <span className="text-xs text-slate-500 font-light">clientes</span>
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

      <div className={`${DASH_SURFACE_CARD} p-5`}>
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
