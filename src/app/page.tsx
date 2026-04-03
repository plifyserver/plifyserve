'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Globe, LayoutDashboard, Users, FileText, FileSignature, Briefcase, Calendar, Network, BarChart3, DollarSign, Calculator, Columns3, Palette, CreditCard, Settings, Menu, TrendingUp, Repeat, MoreHorizontal } from 'lucide-react'
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
import { SITE_GUTTER_X } from '@/lib/siteLayout'
import { cn } from '@/lib/utils'
import { PLAN_BULLETS_ESSENTIAL, PLAN_BULLETS_PRO, PLAN_TAGLINE } from '@/lib/planMarketingCopy'

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
  { icon: DollarSign, label: 'Gastos Pessoais' },
  { icon: Calculator, label: 'Calculadora' },
  { icon: Columns3, label: 'Kanban' },
  { icon: Palette, label: 'Personalização' },
  { icon: CreditCard, label: 'Planos' },
  { icon: Settings, label: 'Configurações' },
] as const

const ACCENT = '#dc2626'

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
    <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl border-0 shadow-sm bg-white min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-slate-500 font-light break-words leading-tight">{title}</p>
          <h3 className="text-base sm:text-xl font-semibold text-slate-900 mt-0.5 sm:mt-1 font-light tracking-tight break-words leading-tight">{value}</h3>
          <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 text-emerald-600 font-medium font-light break-words leading-tight">{trendValue}</p>
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function DashboardPreview() {
  const chartPalette = chartPaletteFromPrimary(ACCENT)
  return (
    <div className="flex w-full min-w-0 bg-slate-100">
      {/* Sidebar - mais estreito em mobile */}
      <aside className="w-[140px] sm:w-[180px] md:w-[220px] flex-shrink-0 flex flex-col rounded-l-2xl overflow-hidden" style={{ backgroundColor: '#121212' }}>
        <div className="px-2 sm:px-3 py-2 sm:py-3 flex items-center justify-between min-h-[44px] sm:min-h-[52px] border-b border-white/10">
          <Image src={LOGO_BRANCO} alt="Plify" width={100} height={28} className="h-5 sm:h-6 md:h-7 w-auto object-contain object-left" />
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
        </div>
        <nav className="flex-1 p-1.5 sm:p-2 space-y-0.5 overflow-hidden">
          {SIDEBAR_ITEMS.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm ${i === 0 ? 'text-white' : 'text-white/70'}`}
              style={i === 0 ? { backgroundColor: ACCENT } : undefined}
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>
      {/* Main - igual ao dashboard */}
      <div className="flex-1 min-w-0 p-3 sm:p-5 bg-slate-100 rounded-r-2xl space-y-3 sm:space-y-5">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-light text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-light text-xs sm:text-sm mt-0.5">Bem-vindo! Aqui está a visão geral do seu negócio.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <PreviewStatsCard title="Total de Clientes" value="1" trendValue="+12% último mês" color={ACCENT} icon={Users} />
          <PreviewStatsCard title="Receita Total Mês" value="R$ 9.300" trendValue="Total de pontual e recorrentes" color="#10B981" icon={TrendingUp} />
          <PreviewStatsCard title="MMR" value="R$ 0,00" trendValue="Receita recorrente" color="#8B5CF6" icon={Repeat} />
          <PreviewStatsCard title="Contratos" value="0" trendValue="Finalizados" color="#6366F1" icon={FileSignature} />
          <PreviewStatsCard title="Propostas" value="3" trendValue="+15% último mês" color="#F59E0B" icon={FileText} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 font-light truncate">Receita Mensal</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-light truncate">Acompanhe sua receita ao longo do tempo</p>
              </div>
              <button type="button" className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
                <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </button>
            </div>
            <div className="h-44 sm:h-60">
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
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 font-light truncate">Distribuição de Clientes</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-light truncate">Status atual dos seus clientes</p>
              </div>
              <button type="button" className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
                <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </button>
            </div>
            <div className="h-44 sm:h-56 flex items-center min-h-0">
              <div className="w-1/2 h-full min-h-0 relative flex items-center justify-center py-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <Pie
                      data={PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="78%"
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
                    <span className="text-base sm:text-lg font-semibold text-slate-900 font-light">100%</span>
                    <span className="text-[11px] text-slate-500 font-light">Total</span>
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
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 font-light truncate">Aumento de clientes</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-light truncate">Clientes cadastrados no sistema por mês</p>
            </div>
            <button type="button" className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            </button>
          </div>
          <div className="h-48 sm:h-64">
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

/** Inclinação máxima (graus) antes de endireitar com o scroll. */
const DASHBOARD_PREVIEW_MAX_TILT_DEG = 36

function DashboardImageSection() {
  const blockRef = useRef<HTMLDivElement>(null)
  const smoothAngleRef = useRef(DASHBOARD_PREVIEW_MAX_TILT_DEG)
  const rafRef = useRef<number | null>(null)
  const [rotateXDeg, setRotateXDeg] = useState(DASHBOARD_PREVIEW_MAX_TILT_DEG)

  useEffect(() => {
    const getTargetAngle = (): number => {
      if (window.matchMedia('(max-width: 639px)').matches) return 0
      const vh = window.innerHeight
      const scrollY =
        window.scrollY ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0
      /*
        No topo (scroll 0): inclinação máxima (~36°). Antes usávamos só rect.top — se o bloco
        já aparecia “alto” na tela, o ângulo nunca chegava em 36° ao abrir o site.
        Aqui o gesto é: página no alto = deitado; conforme desce o scroll, endireita até ~0°.
      */
      const scrollUntilFlat = vh * 1.35
      const t = Math.min(1, Math.max(0, scrollY / scrollUntilFlat))
      const eased = easeOutCubic(t)
      return DASHBOARD_PREVIEW_MAX_TILT_DEG * (1 - eased)
    }

    const tick = () => {
      const target = getTargetAngle()
      const prev = smoothAngleRef.current
      const lerp = 0.28
      const next = prev + (target - prev) * lerp
      smoothAngleRef.current = next
      setRotateXDeg(next)
      if (Math.abs(next - target) > 0.04) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        smoothAngleRef.current = target
        setRotateXDeg(target)
        rafRef.current = null
      }
    }

    const schedule = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick)
    }

    const initial = getTargetAngle()
    smoothAngleRef.current = initial
    setRotateXDeg(initial)

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <section className={cn('pb-20 sm:pb-28 pt-4 overflow-x-hidden', SITE_GUTTER_X)}>
      <div ref={blockRef} className="max-w-6xl mx-auto flex justify-center items-center px-0 py-2 sm:py-4">
        {/*
          perspective no pai + rotateX no filho. overflow-hidden na section cortava o 3D no Firefox;
          usar só overflow-x-hidden evita faixa preta / clipping vertical.
        */}
        <div
          className="w-full max-w-6xl"
          style={{
            perspective: '2200px',
            perspectiveOrigin: '50% 55%',
          }}
        >
          <div
            className="w-full rounded-2xl shadow-2xl overflow-hidden bg-white ring-1 ring-slate-200/80"
            style={{
              transform: `rotateX(${rotateXDeg}deg)`,
              transformOrigin: 'center top',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.18), 0 12px 24px -8px rgba(0,0,0,0.12)',
            }}
          >
            <DashboardPreview />
          </div>
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
    <div className="public-marketing-page min-h-screen overflow-x-hidden bg-white text-slate-900 [color-scheme:light]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100">
        {/* Linha laranja acima do conteúdo do header */}
        <div className="h-1.5 w-full" style={{ backgroundColor: ACCENT }} role="presentation" />
        <nav
          className={cn(
            'relative max-w-6xl mx-auto min-h-14 sm:min-h-16 py-2 flex items-center justify-between gap-2',
            SITE_GUTTER_X
          )}
        >
          <Link href="/" className="flex items-center min-w-0 shrink max-w-[min(100%,200px)]">
            <Image
              src={LOGO_PRETO}
              alt="Plify"
              width={140}
              height={40}
              className="h-8 w-[140px] max-w-full sm:h-10 object-contain object-left"
              priority
            />
          </Link>
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
            <span className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium">
              Smart Business System
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            {user ? (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-black text-white text-xs sm:text-sm font-medium hover:bg-slate-800 whitespace-nowrap"
              >
                Ir para o Painel
              </Link>
            ) : (
              <Link
                href="/cadastro"
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-black text-white text-xs sm:text-sm font-medium hover:bg-slate-800 whitespace-nowrap"
              >
                começar
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className={cn('pt-24 pb-12', SITE_GUTTER_X)}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black tracking-tight mb-6 leading-tight">
            Todas as soluções. Um único lugar. Zero complicação.
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-black max-w-4xl mx-auto leading-relaxed">
            Tudo que <span className="font-medium" style={{ color: ACCENT }}>você</span> precisa para <span className="font-medium" style={{ color: ACCENT }}>operar e crescer:</span>
            <br />
            gestão de clientes, pipeline de vendas, propostas, contratos, projetos, agenda,
            <br />
            relatórios, métricas e controle financeiro <span className="font-medium" style={{ color: ACCENT }}>reunidos em um só lugar.</span>
          </p>
        </div>
      </section>

      {/* Imagem do dashboard: degrade (inclinada + desfoque nas bordas); ao scroll fica reta */}
      <DashboardImageSection />

      {/* Planos - estilo limpo branco */}
      <section className={cn('py-16 sm:py-24 bg-slate-50', SITE_GUTTER_X)}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-2">Planos</h2>
          <p className="text-slate-600 text-center mb-10 sm:mb-12">Escolha o plano ideal para o seu negócio</p>
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {/* Essential */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col">
              <h3 className="text-xl font-bold text-slate-900">Plify Essential</h3>
              <p className="text-slate-600 text-sm mt-2 mb-6">{PLAN_TAGLINE.essential}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">R$ 49,90</span>
                <span className="text-slate-500 text-sm">/mês</span>
              </div>
              <ul className="space-y-2.5 flex-1">
                {PLAN_BULLETS_ESSENTIAL.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: ACCENT }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={user ? '/checkout?plan=essential' : '/cadastro?plan=essential'}
                className="mt-8 w-full py-3 px-4 rounded-xl font-medium text-center text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: ACCENT }}
              >
                Assinar Essential
              </Link>
            </div>
            {/* Pro */}
            <div className="relative bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col">
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white bg-emerald-600">
                  Mais Popular
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Plify Pro</h3>
              <p className="text-slate-600 text-sm mt-2 mb-6">{PLAN_TAGLINE.pro}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">R$ 89,90</span>
                <span className="text-slate-500 text-sm">/mês</span>
              </div>
              <ul className="space-y-2.5 flex-1">
                {PLAN_BULLETS_PRO.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: ACCENT }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={user ? '/checkout?plan=pro' : '/cadastro?plan=pro'}
                className="mt-8 w-full py-3 px-4 rounded-xl font-medium text-center text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: ACCENT }}
              >
                Assinar Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className={cn('py-6 sm:py-8 border-t border-slate-100', SITE_GUTTER_X)}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center shrink-0 min-h-[2rem]">
            <img src="/logopreto.png" alt="Plify" className="h-6 sm:h-8 w-auto object-contain" />
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
