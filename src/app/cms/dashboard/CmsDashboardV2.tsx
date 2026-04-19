'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSignature,
  FileText,
  FolderKanban,
  Briefcase,
  Rocket,
  Target,
  Palette,
  Wrench,
  Megaphone,
  Pause,
  Play,
  RefreshCcw,
  Sparkles,
  Users,
} from 'lucide-react'

type PeriodType = 'day' | 'week' | 'month' | 'last30'

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

function monthEnd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

type DashboardStats = {
  totalClients: number
  mmr: number
  receitaTotalMes: number
  contractsFinalized: number
  totalProposals: number
}

type ContractRow = { id: string; created_at?: string | null; signatories?: unknown }

type ProjectRow = {
  id: string
  name?: string | null
  status?: string | null
  progress?: number | null
  icon_key?: string | null
  due_date?: string | null
  end_date?: string | null
  updated_at?: string | null
  created_at?: string | null
}

type EventRow = {
  id: string
  title?: string | null
  start_at?: string | null
  end_at?: string | null
  all_day?: boolean | null
  color?: string | null
}

type AppSettings = { primary_color?: string | null }

const FALLBACK_ACCENT = '#F97316' // laranja (substitui o verde do print)
const SURFACE = 'bg-white border border-slate-200 shadow-sm'

function currencyBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ymdFromDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function stableSeedFromNumber(n: number) {
  const x = Math.floor(Math.abs(n || 0)) + 1
  // LCG simples e determinístico
  return (x * 1103515245 + 12345) >>> 0
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function svgBarsFromSeed(seed: number, count: number) {
  const rnd = mulberry32(seed)
  const bars = Array.from({ length: count }).map((_, i) => {
    const tall = rnd() > 0.7
    const h = tall ? 0.88 : 0.55 + rnd() * 0.22
    const w = i % 7 === 0 ? 3 : 2
    const dark = i % 4 === 0 || (tall && i % 3 === 0)
    return { h, w, dark }
  })
  return bars
}

function clampPct(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function projectIconFromKey(key: string | null | undefined) {
  switch (key) {
    case 'briefcase':
      return Briefcase
    case 'rocket':
      return Rocket
    case 'target':
      return Target
    case 'palette':
      return Palette
    case 'wrench':
      return Wrench
    case 'megaphone':
      return Megaphone
    default:
      return FolderKanban
  }
}

function buildStatsUrl(): string {
  const params = new URLSearchParams()
  params.set('period', 'month')
  return `/api/dashboard/stats?${params.toString()}`
}

function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback)
  useEffect(() => {
    saved.current = callback
  }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = window.setInterval(() => saved.current(), delay)
    return () => window.clearInterval(id)
  }, [delay])
}

type PomodoroPhase = 'work' | 'break' | 'idle'

type PomodoroState = {
  phase: PomodoroPhase
  running: boolean
  endsAtMs: number | null
  secondsLeft: number
  cyclesDone: number
}

const WORK_SEC = 25 * 60
const BREAK_SEC = 5 * 60

function formatClock(totalSeconds: number) {
  const s = Math.max(0, totalSeconds)
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function todayBounds(period: PeriodType, cursor: Date) {
  if (period === 'day') return { from: startOfDay(cursor), to: endOfDay(cursor) }
  if (period === 'week') return { from: startOfWeek(cursor, { weekStartsOn: 0 }), to: endOfWeek(cursor, { weekStartsOn: 0 }) }
  if (period === 'month') return { from: startOfMonth(cursor), to: endOfMonth(cursor) }
  return { from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }
}

export default function CmsDashboardV2() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [contractsTotal, setContractsTotal] = useState<number>(0)
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [contractsPieCursor, setContractsPieCursor] = useState<Date>(() => new Date())

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'Bom dia'
    if (h >= 12 && h < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const firstName = useMemo(() => {
    const full = (profile?.full_name ?? '').trim()
    if (!full) return '!'
    const name = full.split(/\s+/)[0]
    return name ? `, ${name}!` : '!'
  }, [profile?.full_name])

  const accent = settings?.primary_color?.trim() || FALLBACK_ACCENT

  const [agendaPeriod, setAgendaPeriod] = useState<PeriodType>('week')
  const [agendaCursor, setAgendaCursor] = useState<Date>(() => new Date())

  const [pomodoro, setPomodoro] = useState<PomodoroState>(() => ({
    phase: 'idle',
    running: false,
    endsAtMs: null,
    secondsLeft: WORK_SEC,
    cyclesDone: 0,
  }))

  useEffect(() => {
    const saved = window.localStorage.getItem('plify:pomodoro:v1')
    if (!saved) return
    try {
      const next = JSON.parse(saved) as Partial<PomodoroState>
      setPomodoro((p) => ({
        ...p,
        phase: next.phase === 'work' || next.phase === 'break' || next.phase === 'idle' ? next.phase : p.phase,
        running: !!next.running,
        endsAtMs: typeof next.endsAtMs === 'number' ? next.endsAtMs : null,
        secondsLeft: typeof next.secondsLeft === 'number' ? next.secondsLeft : p.secondsLeft,
        cyclesDone: typeof next.cyclesDone === 'number' ? next.cyclesDone : 0,
      }))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('plify:pomodoro:v1', JSON.stringify(pomodoro))
  }, [pomodoro])

  useInterval(
    () => {
      setPomodoro((p) => {
        if (!p.running || !p.endsAtMs) return p
        const left = Math.max(0, Math.ceil((p.endsAtMs - Date.now()) / 1000))
        if (left > 0) return { ...p, secondsLeft: left }
        // fim da fase: alterna obrigatoriamente work->break e break->work
        if (p.phase === 'work') {
          const endsAtMs = Date.now() + BREAK_SEC * 1000
          return {
            ...p,
            phase: 'break',
            running: true,
            endsAtMs,
            secondsLeft: BREAK_SEC,
            cyclesDone: p.cyclesDone + 1,
          }
        }
        if (p.phase === 'break') {
          const endsAtMs = Date.now() + WORK_SEC * 1000
          return {
            ...p,
            phase: 'work',
            running: true,
            endsAtMs,
            secondsLeft: WORK_SEC,
          }
        }
        return p
      })
    },
    pomodoro.running ? 500 : null
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [
          statsRes,
          contractsRes,
          projectsRes,
          eventsRes,
          settingsRes,
          clientsRes,
          proposalsRes,
          txRes,
        ] = await Promise.all([
          fetch(buildStatsUrl(), { credentials: 'include', cache: 'no-store' }),
          fetch('/api/contracts', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/projects', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/events', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/app-settings', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/clients', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/proposals', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/finance/transactions', { credentials: 'include', cache: 'no-store' }),
        ])

        if (statsRes.ok) setStats(await statsRes.json())
        if (contractsRes.ok) {
          const rows = (await contractsRes.json()) as ContractRow[]
          setContractsTotal(Array.isArray(rows) ? rows.length : 0)
          setContracts(Array.isArray(rows) ? rows : [])
        }
        if (projectsRes.ok) {
          const rows = (await projectsRes.json()) as ProjectRow[]
          setProjects(Array.isArray(rows) ? rows : [])
        }
        if (eventsRes.ok) {
          const rows = (await eventsRes.json()) as EventRow[]
          setEvents(Array.isArray(rows) ? rows : [])
        }
        if (settingsRes.ok) setSettings(await settingsRes.json())
        if (clientsRes.ok) setClients((await clientsRes.json()) ?? [])
        if (proposalsRes.ok) setProposals((await proposalsRes.json()) ?? [])
        if (txRes.ok) setTransactions((await txRes.json()) ?? [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const kpis = useMemo(() => {
    const s = stats
    return {
      totalClients: s?.totalClients ?? 0,
      contracts: contractsTotal ?? 0,
      receitaMes: s?.receitaTotalMes ?? 0,
      mmr: s?.mmr ?? 0,
      totalProposals: s?.totalProposals ?? 0,
      contractsFinalized: s?.contractsFinalized ?? 0,
    }
  }, [stats, contractsTotal])

  const clientsByStatus = useMemo(() => {
    const map: Record<string, number> = { active: 0, lead: 0, inactive: 0, archived: 0 }
    for (const c of clients as any[]) {
      const s = String(c?.status ?? '').toLowerCase()
      if (s in map) map[s]++
    }
    return [
      { name: 'Ativos', key: 'active', value: map.active },
      { name: 'Leads', key: 'lead', value: map.lead },
      { name: 'Inativos', key: 'inactive', value: map.inactive },
      { name: 'Arquivados', key: 'archived', value: map.archived },
    ]
  }, [clients])

  const clientsLast6Months = useMemo(() => {
    const now = new Date()
    const buckets: { key: string; label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = format(d, 'MMM', { locale: ptBR })
      buckets.push({ key, label, value: 0 })
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]))
    for (const c of clients as any[]) {
      const created = c?.created_at ? new Date(c.created_at) : null
      if (!created || Number.isNaN(created.getTime())) continue
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
      const i = idx.get(key)
      if (i != null) buckets[i].value += 1
    }
    return buckets.map((b) => ({ name: b.label, value: b.value }))
  }, [clients])

  const incomeLast6Months = useMemo(() => {
    const now = new Date()
    const buckets: { key: string; label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = format(d, 'MMM', { locale: ptBR })
      buckets.push({ key, label, value: 0 })
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]))
    for (const t of transactions as any[]) {
      const type = String(t?.type ?? '').toLowerCase()
      if (type !== 'income') continue
      const dateStr = String(t?.date ?? '').slice(0, 10)
      const d = dateStr ? new Date(dateStr + 'T12:00:00') : null
      if (!d || Number.isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const i = idx.get(key)
      if (i != null) buckets[i].value += Number(t?.amount ?? 0) || 0
    }
    return buckets.map((b) => ({ name: b.label, value: Math.round(b.value * 100) / 100 }))
  }, [transactions])

  const receitaLast6Months = useMemo(() => {
    // Regra alinhada ao dashboard (visão do cliente):
    // - Recorrente: entra sempre no mês se cliente está Active/Lead.
    // - Pontual: entra no mês do vencimento (billing_due_date) ou, se sem vencimento, no mês de cadastro.
    // - No mês atual, aplica corte até "hoje" para pontual (como no v1).
    const now = new Date()
    const todayYmd = ymdFromDate(now)

    const buckets: { start: Date; end: Date; label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({
        start: monthStart(d),
        end: monthEnd(d),
        label: format(d, 'MMM', { locale: ptBR }),
        value: 0,
      })
    }

    const countsToward = (c: any) => {
      const s = String(c?.status ?? '').toLowerCase()
      return s === 'active' || s === 'lead'
    }

    for (const c of clients as any[]) {
      if (!countsToward(c)) continue
      const pt = String(c?.payment_type ?? '').toLowerCase() === 'recorrente' ? 'recorrente' : 'pontual'
      const amount = Number(c?.recurring_amount ?? 0) || 0
      if (amount <= 0) continue

      if (pt === 'recorrente') {
        const createdAt = c?.created_at ? new Date(c.created_at) : null
        const createdMs = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.getTime() : null
        // Só conta recorrência a partir do mês que o cliente passou a existir.
        for (const b of buckets) {
          if (createdMs != null && createdMs > b.end.getTime()) continue
          b.value += amount
        }
        continue
      }

      const dueRaw = c?.billing_due_date ? String(c.billing_due_date).slice(0, 10) : ''
      const createdAt = c?.created_at ? new Date(c.created_at) : null
      const createdYmd =
        createdAt && !Number.isNaN(createdAt.getTime()) ? ymdFromDate(createdAt) : ''

      for (const b of buckets) {
        const startYmd = ymdFromDate(b.start)
        const endYmd = ymdFromDate(b.end)
        const isCurrentMonth =
          b.start.getFullYear() === now.getFullYear() && b.start.getMonth() === now.getMonth()
        const cutoff = isCurrentMonth ? (todayYmd < endYmd ? todayYmd : endYmd) : endYmd

        if (dueRaw && dueRaw >= startYmd && dueRaw <= endYmd) {
          if (dueRaw <= cutoff) b.value += amount
          continue
        }

        if (!dueRaw && createdYmd && createdYmd >= startYmd && createdYmd <= endYmd) {
          if (createdYmd <= cutoff) b.value += amount
        }
      }
    }

    return buckets.map((b) => ({ name: b.label, value: Math.round(b.value * 100) / 100 }))
  }, [clients])

  const mmrLast6Months = useMemo(() => {
    // Estimativa simples e útil: soma do recurring_amount dos clientes recorrentes Ativos/Leads
    // existentes até o fim de cada mês (usando status atual + created_at).
    const now = new Date()
    const buckets: { label: string; end: Date; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      buckets.push({ label: format(d, 'MMM', { locale: ptBR }), end, value: 0 })
    }
    for (const c of clients as any[]) {
      const s = String(c?.status ?? '').toLowerCase()
      const pt = String(c?.payment_type ?? '').toLowerCase()
      if (!(s === 'active' || s === 'lead')) continue
      if (pt !== 'recorrente') continue
      const amount = Number(c?.recurring_amount ?? 0) || 0
      if (amount <= 0) continue
      const created = c?.created_at ? new Date(c.created_at) : null
      const createdMs = created && !Number.isNaN(created.getTime()) ? created.getTime() : null
      for (const b of buckets) {
        if (createdMs == null || createdMs <= b.end.getTime()) b.value += amount
      }
    }
    return buckets.map((b) => ({ name: b.label, value: Math.round(b.value * 100) / 100 }))
  }, [clients])

  const contractsSignedSplit = useMemo(() => {
    const isSigned = (c: ContractRow) => {
      const sigs = (c.signatories ?? []) as { signed?: boolean; selfie_url?: string | null }[]
      return (
        Array.isArray(sigs) &&
        sigs.length > 0 &&
        sigs.every((s) => s?.signed && typeof s?.selfie_url === 'string' && s.selfie_url.trim().length > 0)
      )
    }
    const start = monthStart(contractsPieCursor)
    const end = monthEnd(contractsPieCursor)
    const inMonth = contracts.filter((c) => {
      const created = c?.created_at ? new Date(c.created_at) : null
      if (!created || Number.isNaN(created.getTime())) return false
      const t = created.getTime()
      return t >= start.getTime() && t <= end.getTime()
    })
    const signed = inMonth.filter(isSigned).length
    const total = inMonth.length
    return [
      { name: 'Assinados', value: signed },
      { name: 'Pendentes', value: Math.max(0, total - signed) },
    ]
  }, [contracts, contractsPieCursor])

  const proposalsByStatus = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of proposals as any[]) {
      const s = String(p?.status ?? 'unknown').toLowerCase()
      map[s] = (map[s] || 0) + 1
    }
    const entries = Object.entries(map).map(([k, v]) => ({
      name:
        k === 'accepted'
          ? 'Aceitas'
          : k === 'draft'
            ? 'Rascunho'
            : k === 'sent'
              ? 'Enviadas'
              : k === 'rejected'
                ? 'Recusadas'
                : k,
      key: k,
      value: v,
    }))
    entries.sort((a, b) => b.value - a.value)
    return entries.slice(0, 6)
  }, [proposals])

  const contractCreatedLast6Months = useMemo(() => {
    const now = new Date()
    const buckets: { key: string; label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = format(d, 'MMM', { locale: ptBR })
      buckets.push({ key, label, value: 0 })
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]))
    for (const c of contracts) {
      const created = c?.created_at ? new Date(c.created_at) : null
      if (!created || Number.isNaN(created.getTime())) continue
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
      const i = idx.get(key)
      if (i != null) buckets[i].value += 1
    }
    return buckets.map((b) => ({ name: b.label, value: b.value }))
  }, [contracts])

  const nextProjects = useMemo(() => {
    const filtered = (projects ?? []).filter((p) => String(p.status ?? '') !== 'done' && String(p.status ?? '') !== 'completed')
    filtered.sort((a, b) => {
      const ap = clampPct(a.progress)
      const bp = clampPct(b.progress)
      if (ap !== bp) return bp - ap
      return String(a.updated_at ?? a.created_at ?? '').localeCompare(String(b.updated_at ?? b.created_at ?? ''))
    })
    return filtered.slice(0, 6)
  }, [projects])

  const agenda = useMemo(() => {
    const { from, to } = todayBounds(agendaPeriod, agendaCursor)
    const rows = (events ?? [])
      .filter((e) => {
        const s = e.start_at ? new Date(e.start_at) : null
        if (!s) return false
        return s.getTime() >= from.getTime() && s.getTime() <= to.getTime()
      })
      .sort((a, b) => String(a.start_at ?? '').localeCompare(String(b.start_at ?? '')))

    return { from, to, rows }
  }, [events, agendaPeriod, agendaCursor])

  const pomodoroTotal = pomodoro.phase === 'break' ? BREAK_SEC : WORK_SEC
  const pomodoroProgress = 1 - pomodoro.secondsLeft / pomodoroTotal
  const pomodoroRing = Math.max(0, Math.min(1, pomodoroProgress))
  const ringBg = '#E2E8F0'

  const startPomodoro = () => {
    setPomodoro((p) => {
      const phase: PomodoroPhase = p.phase === 'idle' ? 'work' : p.phase
      const duration = phase === 'break' ? BREAK_SEC : WORK_SEC
      const endsAtMs = Date.now() + duration * 1000
      return { ...p, phase, running: true, endsAtMs, secondsLeft: duration }
    })
  }

  const pausePomodoro = () => setPomodoro((p) => ({ ...p, running: false, endsAtMs: null }))

  const resetPomodoro = () =>
    setPomodoro((p) => ({
      ...p,
      phase: 'idle',
      running: false,
      endsAtMs: null,
      secondsLeft: WORK_SEC,
      cyclesDone: 0,
    }))

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="w-9 h-9 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1160px] mx-auto">
      {/* Header leve, igual vibe do print */}
      <div className="mb-5">
        <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              {greeting}
              {firstName} Finalizando o dia com sucesso?
            </h1>
            <p className="mt-1 text-sm text-slate-600">Aqui está um resumo do seu dashboard.</p>
          </div>
      </div>

      {/* Linha 1 - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="TOTAL DE CLIENTES"
          value={String(kpis.totalClients)}
          icon={<Users className="w-5 h-5" />}
          accent={accent}
          footer="Clientes por mês (últ. 6 meses)"
          chartHeightClass="h-32"
          sparkline={
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientsLast6Months} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                    formatter={(v: number) => [v, 'Clientes']}
                  />
                  <Bar dataKey="value" fill={accent} radius={[10, 10, 10, 10]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />

        <KpiCard
          title="CONTRATOS"
          value={`Total: ${kpis.contracts}`}
          icon={<FileSignature className="w-5 h-5" />}
          accent={accent}
          footer={`Finalizados: ${kpis.contractsFinalized}`}
          chartHeightClass="h-32"
          sparkline={
            <div className="h-full flex flex-col min-h-0">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contractsSignedSplit}
                      dataKey="value"
                      innerRadius={18}
                      outerRadius={28}
                      paddingAngle={3}
                      stroke="none"
                    >
                      <Cell fill={accent} />
                      <Cell fill="#CBD5E1" />
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                      formatter={(v: number, n: string) => [v, n === 'Assinados' ? 'Assinados' : 'Pendentes']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 flex items-center justify-center gap-3 pb-1">
                <button
                  type="button"
                  onClick={() => setContractsPieCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center"
                  aria-label="Mês anterior"
                >
                  &lt;
                </button>
                <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                  {format(contractsPieCursor, "MMM 'de' yyyy", { locale: ptBR })}
                </span>
                <button
                  type="button"
                  onClick={() => setContractsPieCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center"
                  aria-label="Próximo mês"
                >
                  &gt;
                </button>
              </div>
            </div>
          }
        />

        <KpiCard
          title="RECEITA TOTAL MÊS"
          value={currencyBRL(kpis.receitaMes)}
          icon={<BarChart3 className="w-5 h-5" />}
          accent={accent}
          footer="Recorrente + pontual"
          chartHeightClass="h-32"
          sparkline={
            <div className="h-full">
              <p className="text-[11px] text-slate-500 mb-1">Últ. 6 meses</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={receitaLast6Months} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                    formatter={(v: number) => [currencyBRL(v), 'Receita']}
                  />
                  <Bar dataKey="value" fill={accent} radius={[10, 10, 10, 10]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />

        <KpiCard
          title="MMR"
          value={currencyBRL(kpis.mmr)}
          icon={<Clock className="w-5 h-5" />}
          accent={accent}
          footer="MMR por mês (últ. 6 meses)"
          chartHeightClass="h-32"
          sparkline={
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mmrLast6Months} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                    formatter={(v: number) => [currencyBRL(v), 'MMR']}
                  />
                  <Bar dataKey="value" fill={accent} radius={[10, 10, 10, 10]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />
      </div>

      {/* Linha 2 - Propostas, Pomodoro, Próximas tarefas (maior) */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 rounded-2xl p-5 bg-slate-50 border border-slate-200 shadow-sm flex flex-col min-h-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge title="PROPOSTAS" />
              <p className="mt-2 text-2xl font-semibold text-slate-900">{kpis.totalProposals}</p>
              <p className="text-sm text-slate-500 mt-1">Total de propostas</p>
            </div>
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accent}1A`, color: accent }}
              aria-hidden
            >
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-auto pt-4 h-44 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={proposalsByStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={22} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="value" fill={accent} radius={[10, 10, 10, 10]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl p-5 bg-slate-50 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge title="POMODORO TAREFAS" />
              <p className="text-sm text-slate-500 mt-2">Time tracker</p>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" style={{ color: accent }} /> ciclos: {pomodoro.cyclesDone}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <div
              className="relative h-44 w-44 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(${accent} ${Math.round(pomodoroRing * 360)}deg, ${ringBg} 0deg)`,
              }}
            >
              <div className="h-[156px] w-[156px] rounded-full bg-slate-50 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-medium text-slate-500">
                  {pomodoro.phase === 'break' ? 'Descanso' : pomodoro.phase === 'work' ? 'Trabalho' : 'Pronto'}
                </p>
                <p className="text-3xl font-semibold text-slate-900 mt-1">
                  {formatClock(pomodoro.secondsLeft)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {pomodoro.phase === 'break' ? '5 min' : '25 min'} · alternância automática
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {!pomodoro.running ? (
              <button
                type="button"
                onClick={startPomodoro}
                className="rounded-xl px-3 py-2 text-sm font-medium text-white inline-flex items-center gap-2"
                style={{ backgroundColor: accent }}
              >
                <Play className="w-4 h-4" />
                Iniciar
              </button>
            ) : (
              <button
                type="button"
                onClick={pausePomodoro}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50"
              >
                <Pause className="w-4 h-4" />
                Pausar
              </button>
            )}
            <button
              type="button"
              onClick={resetPomodoro}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50"
            >
              <RefreshCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

        </div>

        <div className="lg:col-span-4 rounded-2xl p-5 bg-slate-50 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge title="PROJETOS" />
              <p className="text-sm text-slate-500 mt-2">Andamento</p>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {nextProjects.length ? `${nextProjects.length}` : '0'}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {nextProjects.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                Nenhuma tarefa em andamento ainda.
              </div>
            ) : (
              nextProjects.map((p) => (
                <TaskRow
                  key={p.id}
                  id={p.id}
                  title={String(p.name ?? 'Tarefa')}
                  pct={clampPct(p.progress)}
                  accent={accent}
                  iconKey={p.icon_key}
                />
              ))
            )}
          </div>

        </div>
      </div>

      {/* Linha 3 - Resumo agenda */}
      <div className="mt-4 rounded-2xl p-5 bg-slate-50 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Badge title="RESUMO DA AGENDA" />
            <p className="text-sm text-slate-500 mt-2">
              {format(agenda.from, 'dd/MM/yyyy', { locale: ptBR })} – {format(agenda.to, 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PeriodPill value={agendaPeriod} setValue={setAgendaPeriod} />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAgendaCursor((d) => new Date(d.getTime() - (agendaPeriod === 'month' ? 30 : agendaPeriod === 'week' ? 7 : 1) * 24 * 60 * 60 * 1000))}
                className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setAgendaCursor((d) => new Date(d.getTime() + (agendaPeriod === 'month' ? 30 : agendaPeriod === 'week' ? 7 : 1) * 24 * 60 * 60 * 1000))}
                className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50"
                aria-label="Próximo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Eventos</p>
              <p className="text-xs text-slate-500">{agenda.rows.length} no período</p>
            </div>
            <div className="mt-3 space-y-2">
              {agenda.rows.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Nenhum evento encontrado para este período.
                </div>
              ) : (
                agenda.rows.slice(0, 10).map((e) => {
                  const start = e.start_at ? new Date(e.start_at) : null
                  const end = e.end_at ? new Date(e.end_at) : null
                  const time =
                    e.all_day
                      ? 'Dia todo'
                      : start && end
                        ? `${format(start, 'HH:mm')}–${format(end, 'HH:mm')}`
                        : '—'
                  return (
                    <div key={e.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                      <div
                        className="mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${accent}14`, color: accent }}
                        aria-hidden
                      >
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{String(e.title ?? 'Evento')}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {start ? format(start, "EEE, dd 'de' MMM", { locale: ptBR }) : '—'} · {time}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Visão rápida</p>
            <p className="text-xs text-slate-500 mt-1">Distribuição simples de eventos por dia</p>
            <div className="mt-3 h-56">
              <MiniAgendaChart rows={agenda.rows} accent={accent} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Badge({ title }: { title: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
      {title}
    </span>
  )
}

function KpiCard({
  title,
  value,
  footer,
  icon,
  accent,
  sparkline,
  variant = 'light',
  chartHeightClass = 'h-24',
}: {
  title: string
  value: string
  footer: string
  icon: React.ReactNode
  accent: string
  sparkline: React.ReactNode
  variant?: 'light' | 'dark'
  chartHeightClass?: string
}) {
  const dark = variant === 'dark'
  return (
    <div
      className={`rounded-2xl p-5 min-h-[260px] ${dark ? 'bg-slate-900 border border-slate-800 shadow-sm' : SURFACE}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${
              dark ? 'bg-white/10 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            {title}
          </span>
          <p className={`mt-2 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
          <p className={`text-xs mt-1 ${dark ? 'text-slate-300' : 'text-slate-500'}`}>{footer}</p>
        </div>
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
          aria-hidden
        >
          {icon}
        </div>
      </div>
      <div className={`mt-4 ${chartHeightClass}`}>{sparkline}</div>
    </div>
  )
}

function EcgSparkline({ seed, accent }: { seed: number; accent: string }) {
  const rnd = useMemo(() => mulberry32(seed), [seed])
  const points = useMemo(() => {
    // ECG "picos" em uma linha horizontal, em SVG (mais parecido com o print)
    const w = 240
    const h = 64
    const mid = Math.round(h * 0.62)
    const leftPad = 6
    const rightPad = 6
    const span = w - leftPad - rightPad
    const peaks = 3 + Math.floor(rnd() * 3) // 3..5 picos
    const xs: number[] = []
    for (let i = 0; i < peaks; i++) {
      xs.push(leftPad + Math.round(((i + 1) / (peaks + 1)) * span))
    }
    const pts: Array<[number, number]> = []
    let x = leftPad
    pts.push([x, mid])
    const baselineJitter = () => mid + Math.round((rnd() - 0.5) * 4)
    for (const px of xs) {
      // linha até o pico
      pts.push([px - 18, baselineJitter()])
      pts.push([px - 10, baselineJitter()])
      // pico "QRS": sobe e desce rápido
      pts.push([px - 6, mid + 10])
      pts.push([px - 2, mid - (22 + Math.round(rnd() * 10))])
      pts.push([px + 2, mid + 14])
      pts.push([px + 10, baselineJitter()])
      pts.push([px + 18, baselineJitter()])
      x = px + 18
    }
    pts.push([w - rightPad, baselineJitter()])
    pts.push([w - rightPad, mid])
    const d = pts.map(([xx, yy]) => `${xx},${yy}`).join(' ')
    return { w, h, d }
  }, [rnd])

  return (
    <div className="h-full w-full">
      <svg viewBox={`0 0 ${points.w} ${points.h}`} width="100%" height="100%" preserveAspectRatio="none">
        <path d={`M 0,${Math.round(points.h * 0.62)} L ${points.w},${Math.round(points.h * 0.62)}`} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        <path
          d={`M ${points.d.replaceAll(' ', ' L ')}`}
          fill="none"
          stroke={accent}
          strokeWidth="2.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function PrintBars({ seed, accent }: { seed: number; accent: string }) {
  const bars = useMemo(() => svgBarsFromSeed(seed, 16), [seed])
  const w = 240
  const h = 64
  const gap = 3
  const startX = 6
  let x = startX
  return (
    <div className="h-full w-full">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none">
        <rect x="0" y="0" width={w} height={h} fill="transparent" />
        {bars.map((b, i) => {
          const barH = Math.round(h * b.h)
          const y = h - barH
          const fill = b.dark ? '#0F172A' : '#CBD5E1'
          const rx = 3
          const out = (
            <rect
              key={i}
              x={x}
              y={y}
              width={b.w}
              height={barH}
              rx={rx}
              fill={fill}
              opacity={b.dark ? 1 : 0.95}
            />
          )
          x += b.w + gap
          return out
        })}
        {/* uma barrinha de destaque (salmão) como no print */}
        <rect x={w - 14} y={Math.round(h * 0.22)} width={6} height={Math.round(h * 0.78)} rx={3} fill={accent} opacity={0.95} />
      </svg>
    </div>
  )
}

function ProposalBars({ seed, accent }: { seed: number; accent: string }) {
  const bars = useMemo(() => svgBarsFromSeed(seed, 12), [seed])
  const w = 240
  const h = 120
  const gap = 6
  const startX = 16
  const baseY = 98
  let x = startX
  return (
    <div className="h-full w-full">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none">
        {/* base */}
        <path d={`M ${startX - 8},${baseY} L ${w - 12},${baseY}`} stroke="#E2E8F0" strokeWidth="6" strokeLinecap="round" />
        {bars.map((b, i) => {
          const barH = Math.round((38 + (b.h * 55)) * 0.55)
          const y = baseY - barH
          const width = 8
          const fill = i === bars.length - 1 ? accent : '#CBD5E1'
          const out = <rect key={i} x={x} y={y} width={width} height={barH} rx={5} fill={fill} />
          x += width + gap
          return out
        })}
        {/* “!” estilizados como no print */}
        <rect x="24" y="22" width="10" height="38" rx="5" fill="#CBD5E1" />
        <rect x="46" y="34" width="10" height="26" rx="5" fill="#CBD5E1" />
      </svg>
    </div>
  )
}

function BarcodeLike({ value, accent }: { value: number; accent: string }) {
  const bars = Math.max(18, Math.min(42, Math.round(value) + 18))
  const rnd = mulberry32(stableSeedFromNumber(value * 31))
  return (
    <div className="h-full flex items-end gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => {
        const tall = rnd() > 0.6
        const h = tall ? 92 : 58
        const active = i % 3 === 0 || i % 7 === 0
        return (
          <div
            key={i}
            className="rounded-[2px]"
            style={{
              width: i % 6 === 0 ? 3 : 2,
              height: `${h}%`,
              backgroundColor: active ? '#0F172A' : '#CBD5E1',
              opacity: active ? 1 : 0.9,
            }}
          />
        )
      })}
    </div>
  )
}

function TaskRow({
  id,
  title,
  pct,
  accent,
  iconKey,
}: {
  id: string
  title: string
  pct: number
  accent: string
  iconKey?: string | null
}) {
  const Icon = projectIconFromKey(iconKey)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}14`, color: accent }}
          aria-hidden
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
            <p className="text-sm font-semibold text-slate-900">{pct}%</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">Andamento</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PeriodPill({
  value,
  setValue,
}: {
  value: PeriodType
  setValue: (v: PeriodType) => void
}) {
  const opts: { id: PeriodType; label: string }[] = [
    { id: 'day', label: 'Diário' },
    { id: 'week', label: 'Semanal' },
    { id: 'month', label: 'Mensal' },
    { id: 'last30', label: 'Últ. 30 dias' },
  ]
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
      {opts.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setValue(o.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
              active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function MiniAgendaChart({ rows, accent }: { rows: EventRow[]; accent: string }) {
  const data = useMemo(() => {
    const byDay: Record<string, number> = {}
    for (const r of rows) {
      if (!r.start_at) continue
      const d = new Date(r.start_at)
      const key = format(d, 'dd/MM')
      byDay[key] = (byDay[key] || 0) + 1
    }
    const keys = Object.keys(byDay)
    keys.sort((a, b) => {
      const [ad, am] = a.split('/').map(Number)
      const [bd, bm] = b.split('/').map(Number)
      if (am !== bm) return am - bm
      return ad - bd
    })
    const base = keys.map((k) => ({ name: k, value: byDay[k] }))
    return base.length ? base : [{ name: '—', value: 0 }]
  }, [rows])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="agendaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={accent} stopOpacity={0.28} />
            <stop offset="95%" stopColor={accent} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
          formatter={(v: number) => [v, 'Eventos']}
        />
        <Area type="monotone" dataKey="value" stroke={accent} strokeWidth={2.5} fill="url(#agendaFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

