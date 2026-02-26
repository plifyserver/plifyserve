'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Globe } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const STATS = [
  { target: 500, suffix: '+', label: 'Usuários ativos' },
  { target: 10, suffix: 'k+', label: 'Propostas criadas' },
  { target: 98, suffix: '%', label: 'Taxa de satisfação' },
  { target: 2, suffix: ' min', label: 'Para começar' },
] as const

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function DashboardImageSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [tiltX, setTiltX] = useState(18)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const centerY = rect.top + rect.height / 2
      const viewportMid = typeof window !== 'undefined' ? window.innerHeight / 2 : 400
      const distance = centerY - viewportMid
      const maxDist = 500
      const t = Math.min(1, Math.max(0, 1 - Math.abs(distance) / maxDist))
      setTiltX(18 - 18 * t)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section ref={sectionRef} className="px-4 pb-24 pt-4">
      <div className="max-w-6xl mx-auto flex justify-center">
        <div
          className="w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 transition-transform duration-500 ease-out"
          style={{
            transform: `perspective(1200px) rotateX(${tiltX}deg)`,
            boxShadow: '0 50px 80px -20px rgba(0,0,0,0.25), 0 30px 50px -30px rgba(0,0,0,0.3)',
          }}
        >
          <Image
            src="/imagem_dashboard.jpeg"
            alt="Dashboard Plify - visão geral do sistema com menu, gráficos e indicadores"
            width={1200}
            height={720}
            className="w-full h-auto object-contain"
            priority
          />
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
          <Link href="/" className="flex items-center gap-1 font-bold text-4xl text-black">
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

      {/* Imagem do dashboard: degrade (inclinada + desfoque nas bordas); ao scroll fica reta */}
      <DashboardImageSection />

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
