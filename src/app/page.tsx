'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Globe } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  Search,
  TrendingUp,
} from 'lucide-react'
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

const ACCENT_RED = '#dc2626'
const performanceData = [
  { mes: 'Mar', valor: 3800 },
  { mes: 'Abr', valor: 5100 },
  { mes: 'Maio', valor: 6200 },
  { mes: 'Jun', valor: 7500 },
  { mes: 'Jul', valor: 8200 },
]
const distributionData = [
  { name: 'Novos', value: 60, color: ACCENT_RED },
  { name: 'Recorrentes', value: 40, color: '#e2e8f0' },
]

const STATS = [
  { target: 500, suffix: '+', label: 'Usuários ativos' },
  { target: 10, suffix: 'k+', label: 'Propostas criadas' },
  { target: 98, suffix: '%', label: 'Taxa de satisfação' },
  { target: 2, suffix: ' min', label: 'Para começar' },
] as const

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
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
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 font-bold text-xl text-black">
            plify<span className="text-red-500">.</span>
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

      {/* Dashboard mockup - print em card com sombra e leve inclinação */}
      <section className="px-4 pb-24 pt-4">
        <div className="max-w-6xl mx-auto flex justify-center">
          <div
            className="w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            style={{
              transform: 'perspective(1200px) rotateX(2deg) rotateY(-3deg)',
              boxShadow: '0 50px 80px -20px rgba(0,0,0,0.25), 0 30px 50px -30px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex min-h-[520px] bg-slate-100">
              {/* Sidebar do mockup */}
              <aside className="w-56 flex-shrink-0 flex flex-col bg-[#1e293b]">
                <div className="p-4 border-b border-white/10">
                  <span className="font-semibold text-white text-sm lowercase">plify</span>
                </div>
                <nav className="p-2 space-y-0.5 flex-1">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: ACCENT_RED }}>
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </div>
                  {['Clientes', 'Propostas', 'Contratos', 'Criar Assinatura', 'Wello', 'Projetos', 'Agenda', 'Mapa Mental'].map((label) => (
                    <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 text-sm">
                      <span className="w-4 h-4" />
                      {label}
                    </div>
                  ))}
                </nav>
              </aside>
              {/* Conteúdo do mockup */}
              <div className="flex-1 min-w-0 bg-slate-100">
                <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
                  <div className="relative w-48 flex items-center rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-500">Buscar...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-medium">
                      J
                    </div>
                    <span className="text-sm font-medium text-slate-700">jp1297</span>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Dashboard</h2>
                    <p className="text-sm text-slate-500">Bem-vindo! Aqui está a visão geral do seu negócio.</p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { title: 'Total de Clientes', value: '4', trend: '+12% último mês', color: ACCENT_RED, icon: Users },
                      { title: 'Receita Aprovada', value: 'R$ 40.000', trend: '+18% último mês', color: '#10B981', icon: TrendingUp },
                      { title: 'Projetos Ativos', value: '3', trend: '+5% último mês', color: '#8B5CF6', icon: Briefcase },
                      { title: 'Propostas', value: '4', trend: '+15% último mês', color: '#F59E0B', icon: FileText },
                    ].map((card) => (
                      <div key={card.title} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-medium text-slate-500">{card.title}</p>
                            <p className="text-xl font-bold text-slate-900 mt-0.5">{card.value}</p>
                            <p className="text-xs text-emerald-600 font-medium mt-1">{card.trend}</p>
                          </div>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                            <card.icon className="w-4 h-4" style={{ color: card.color }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-900">Desempenho</h3>
                      <p className="text-xs text-slate-500 mb-2">Acompanhe a evolução do seu negócio</p>
                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={performanceData}>
                            <defs>
                              <linearGradient id="mockGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={ACCENT_RED} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={ACCENT_RED} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v / 1000}k`} />
                            <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, '']} />
                            <Area type="monotone" dataKey="valor" stroke={ACCENT_RED} strokeWidth={2} fill="url(#mockGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-end mt-1">
                        <span className="text-xs px-2 py-0.5 rounded border border-slate-200 text-slate-500">Anual</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-900">Distribuição de Clientes</h3>
                      <p className="text-xs text-slate-500 mb-2">Novos vs recorrentes</p>
                      <div className="h-36 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={distributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={32}
                              outerRadius={48}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {distributionData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className="py-8 px-4 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="font-bold text-black">
            plify<span className="text-red-500">.</span>
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
