'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Globe, LayoutDashboard, Users, FileText, FileSignature, Briefcase, Calendar, Network, BarChart3, DollarSign, Columns3, Palette, CreditCard, Settings, Menu, TrendingUp, Repeat, MoreHorizontal } from 'lucide-react'
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
import { useAuth } from '@/contexts/AuthContext'
import { LOGO_PRETO, LOGO_BRANCO } from '@/lib/logo'
import { chartPaletteFromPrimary } from '@/lib/colorUtils'

const STATS = [
  { target: 500, suffix: '+', label: 'Usuários ativos' },
  { target: 10, suffix: 'k+', label: 'Propostas criadas' },
  { target: 98, suffix: '%', label: 'Taxa de satisfação' },
  { target: 2, suffix: ' min', label: 'Para começar' },
] as const

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Users, label: 'Clientes' },
  { icon: FileText, label: 'Propostas' },
  { icon: FileSignature, label: 'Contratos' },
  { icon: Briefcase, label: 'Projetos' },
  { icon: Calendar, label: 'Agenda' },
  { icon: Network, label: 'Mapa Mental' },
  { icon: BarChart3, label: 'Ads' },
  { icon: DollarSign, label: 'Financeiro' },
  { icon: Columns3, label: 'Kanban' },
  { icon: Palette, label: 'Personalização' },
  { icon: CreditCard, label: 'Planos' },
  { icon: Settings, label: 'Configurações' },
] as const

const ACCENT = '#ea580c'

const REVENUE_DATA = [
  { name: 'Jan', value: 3200 },
  { name: 'Fev', value: 4100 },
  { name: 'Mar', value: 2800 },
  { name: 'Abr', value: 5500 },
  { name: 'Mai', value: 4800 },
  { name: 'Jun', value: 6200 },
  { name: 'Jul', value: 5900 },
]
const PIE_DATA = [
  { name: 'Ativos', value: 1, percentage: 100 },
]
const CLIENTES_GROWTH_DATA = [
  { name: 'Jan', clientes: 0 },
  { name: 'Fev', clientes: 1 },
  { name: 'Mar', clientes: 1 },
  { name: 'Abr', clientes: 0 },
  { name: 'Mai', clientes: 1 },
  { name: 'Jun', clientes: 0 },
  { name: 'Jul', clientes: 0 },
]

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function PreviewStatsCard({ title, value, trendValue, color, icon: Icon }: { title: string; value: string; trendValue: string; color: string; icon: typeof Users }) {
  return (
    <div className="p-5 rounded-2xl border-0 shadow-sm bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 font-light">{title}</p>
          <h3 className="text-2xl font-semibold text-slate-900 mt-1 font-light tracking-tight">{value}</h3>
          <p className="text-sm mt-1 text-emerald-600 font-medium font-light">{trendValue}</p>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function DashboardPreview() {
  const chartPalette = chartPaletteFromPrimary(ACCENT)
  return (
    <div className="flex w-full bg-slate-100">
      {/* Sidebar */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col rounded-l-2xl overflow-hidden" style={{ backgroundColor: '#101524' }}>
        <div className="px-3 py-3 flex items-center justify-between min-h-[52px] border-b border-white/10">
          <Image src={LOGO_BRANCO} alt="Plify" width={100} height={28} className="h-7 w-auto object-contain object-left" />
          <Menu className="w-5 h-5 text-white/70" />
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-hidden">
          {SIDEBAR_ITEMS.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${i === 0 ? 'text-white' : 'text-white/70'}`}
              style={i === 0 ? { backgroundColor: ACCENT } : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>
      {/* Main - igual ao dashboard */}
      <div className="flex-1 min-w-0 p-5 bg-slate-100 rounded-r-2xl space-y-5">
        <div>
          <h1 className="text-2xl font-light text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-light text-sm mt-0.5">Bem-vindo! Aqui está a visão geral do seu negócio.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <PreviewStatsCard title="Total de Clientes" value="1" trendValue="+12% último mês" color={ACCENT} icon={Users} />
          <PreviewStatsCard title="Receita Total Mês" value="R$ 9.300" trendValue="Total de pontual e recorrentes" color="#10B981" icon={TrendingUp} />
          <PreviewStatsCard title="MMR" value="R$ 0,00" trendValue="Receita recorrente" color="#8B5CF6" icon={Repeat} />
          <PreviewStatsCard title="Contratos" value="0" trendValue="Finalizados" color="#6366F1" icon={FileSignature} />
          <PreviewStatsCard title="Propostas" value="3" trendValue="+15% último mês" color="#F59E0B" icon={FileText} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 font-light">Receita Mensal</h2>
                <p className="text-sm text-slate-500 font-light">Acompanhe sua receita ao longo do tempo</p>
              </div>
              <button type="button" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="previewRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} dx={-8} />
                  <Area type="monotone" dataKey="value" stroke={ACCENT} strokeWidth={2.5} fill="url(#previewRevenue)" dot={{ fill: ACCENT, strokeWidth: 2, r: 4, stroke: '#fff' }} />
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
              <button type="button" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="h-60 flex items-center">
              <div className="w-1/2 h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {PIE_DATA.map((_, i) => (
                        <Cell key={i} fill={chartPalette[i % chartPalette.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center justify-center gap-0 leading-none">
                    <span className="text-xl font-semibold text-slate-900 font-light">100%</span>
                    <span className="text-xs text-slate-500 font-light">Total</span>
                  </div>
                </div>
              </div>
              <div className="w-1/2 flex flex-col justify-center gap-3 pl-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartPalette[0] }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 font-light">Ativos</p>
                    <p className="text-xs text-slate-500 font-light">1 clientes</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 font-light">100%</p>
                </div>
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
            <button type="button" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CLIENTES_GROWTH_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="previewClientes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} dx={-8} />
                <Area type="monotone" dataKey="clientes" stroke={ACCENT} strokeWidth={2.5} fill="url(#previewClientes)" dot={{ fill: ACCENT, strokeWidth: 2, r: 4, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardImageSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [tiltX, setTiltX] = useState(15)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const centerY = rect.top + rect.height / 2
      const viewportMid = typeof window !== 'undefined' ? window.innerHeight / 2 : 400
      const distance = centerY - viewportMid
      const maxDist = 550
      const t = Math.min(1, Math.max(0, 1 - Math.abs(distance) / maxDist))
      setTiltX(15 - 15 * t)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section ref={sectionRef} className="px-4 pb-24 pt-4">
      <div className="max-w-6xl mx-auto flex justify-center">
        <div
          className="w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 transition-transform duration-500 ease-out bg-white"
          style={{
            transform: `perspective(1200px) rotateX(${tiltX}deg)`,
            boxShadow: '0 50px 80px -20px rgba(0,0,0,0.25), 0 30px 50px -30px rgba(0,0,0,0.3)',
          }}
        >
          <DashboardPreview />
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const { user } = useAuth()
  const [statsTick, setStatsTick] = useState(0)
  const [displayed, setDisplayed] = useState([0, 0, 0, 0])

  useEffect(() => {
    const interval = setInterval(() => setStatsTick((t) => t + 1), 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setDisplayed([0, 0, 0, 0])
    const duration = 1200
    const start = performance.now()
    let rafId: number

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      setDisplayed(STATS.map((s) => Math.round(s.target * eased)))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [statsTick])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100">
        {/* Linha laranja acima do conteúdo do header */}
        <div className="h-1.5 w-full bg-orange-500" role="presentation" />
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src={LOGO_PRETO} alt="Plify" width={140} height={40} className="h-10 w-auto" priority />
          </Link>
          <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
            <span className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium">
              Smart Business System
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="p-2 text-slate-500 hover:text-slate-700">
              <Globe className="w-5 h-5" />
            </span>
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-slate-800"
              >
                Ir para o Painel
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-slate-800"
              >
                começar
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black tracking-tight mb-6 leading-tight">
            Todas as soluções. Um único lugar. Zero complicação.
          </h1>
          <p className="text-lg sm:text-xl text-black max-w-3xl mx-auto leading-relaxed">
            Tudo que você precisa para operar e crescer:{' '}
            <span className="text-black">
              gestão de clientes, pipeline de vendas, propostas, contratos, projetos, agenda, relatórios, métricas e controle financeiro
            </span>
            <span className="text-red-500 font-medium"> reunidos em um só lugar.</span>
          </p>
        </div>
      </section>

      {/* Imagem do dashboard: degrade (inclinada + desfoque nas bordas); ao scroll fica reta */}
      <DashboardImageSection />

      {/* Footer mínimo */}
      <footer className="py-8 px-4 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center">
            <Image src={LOGO_PRETO} alt="Plify" width={120} height={34} className="h-8 w-auto" />
          </Link>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/termos-privacidade" className="hover:text-black">Termos de Privacidade</Link>
            <Link href="/suporte" className="hover:text-black">Suporte</Link>
            <Link href="/termos-uso" className="hover:text-black">Termos de Uso</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
