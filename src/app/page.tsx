'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BarChart3, FileText, Zap, Shield, ArrowRight, ChevronDown, CheckCircle2, PenTool, PieChart, Network, Calendar, DollarSign, FolderOpen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AnimatedChartsSection } from '@/components/AnimatedChartsSection'
import { TestimonialsChat } from '@/components/TestimonialsChat'

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
    <div className="min-h-screen overflow-x-hidden">
      {/* Header - fundo escuro (preto mais claro) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-md border-b border-gray-700/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/plify.png" alt="Plify" width={56} height={56} className="rounded-xl logo-avocado brightness-110" />
          </Link>
          <Link href="/cadastro" className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-avocado font-semibold text-xs whitespace-nowrap shadow border border-avocado/20">
            <Zap className="w-3.5 h-3.5 text-avocado" />
            R$ 4,90/mês
          </Link>
          <div className="hidden sm:flex flex-1 min-w-0 mx-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex items-center gap-6 animate-marquee">
              {[1, 2].map((dup) => (
                <span key={dup} className="flex items-center gap-6 shrink-0">
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-avocado font-semibold text-sm whitespace-nowrap shadow-md border border-avocado/20">
                    <Zap className="w-4 h-4 text-avocado flex-shrink-0" />
                    Oferta relâmpago: de R$ 59,80 por apenas R$ 4,90/mês
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-avocado font-semibold text-sm whitespace-nowrap shadow-md border border-avocado/20">
                    <Zap className="w-4 h-4 text-avocado flex-shrink-0" />
                    Plano Pro: R$ 4,90/mês — propostas ilimitadas
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-avocado font-semibold text-sm whitespace-nowrap shadow-md border border-avocado/20">
                    <Zap className="w-4 h-4 text-avocado flex-shrink-0" />
                    Economize R$ 55/mês com a oferta especial
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-avocado hover:bg-avocado-light text-white font-medium transition-colors"
              >
                Ir para o Painel
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="px-4 py-2 rounded-lg bg-avocado hover:bg-avocado-light text-white font-medium transition-colors"
                >
                  Começar Grátis
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero - estilo Nepfy: headline forte + um CTA principal */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(86,130,3,0.12),transparent)]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-avocado/20 text-avocado text-sm mb-8 font-medium">
            <Zap className="w-4 h-4" />
            Oferta relâmpago — R$ 4,90/mês por tempo limitado
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Tudo em um{' '}
            <span className="bg-gradient-to-r from-avocado to-avocado-light bg-clip-text text-transparent">
              lugar
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            Métricas Meta Ads, propostas profissionais e mini-site da sua empresa.
            Pare de enviar PDFs e mensagens genéricas — apresente seu trabalho como um produto premium.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cadastro"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-avocado hover:bg-avocado-light text-black font-semibold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-avocado/25"
            >
              Começar grátis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            Empresas que já usam o Plify para fechar mais contratos
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-avocado flex-shrink-0" />
              Sem cartão de crédito
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-avocado flex-shrink-0" />
              Setup em 2 minutos
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-avocado flex-shrink-0" />
              Cancele quando quiser
            </span>
          </div>
          <a
            href="#metricas"
            className="mt-14 inline-flex flex-col items-center gap-2 text-gray-500 hover:text-avocado transition-colors"
          >
            <span className="text-xs">Como funciona</span>
            <ChevronDown className="w-6 h-6" />
          </a>
        </div>
      </section>

      {/* Stats - prova social (fundo preto mais claro, números sobem de 0 até o valor a cada 4s) */}
      <section className="py-12 px-4 border-y border-gray-700 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ target, suffix, label }, i) => (
              <div key={label}>
                <p className="text-3xl md:text-4xl font-bold text-avocado-light tabular-nums">
                  {displayed[i]}
                  {suffix}
                </p>
                <p className="text-gray-400 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona - gráficos e métricas */}
      <section id="metricas" className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Como funciona</h2>
          <p className="text-gray-600">
            Da ideia ao contrato assinado, em poucos cliques. Dashboard de anúncios, propostas interativas e sua página — tudo em um só lugar.
          </p>
        </div>
        <AnimatedChartsSection />
      </section>

      {/* Recursos / Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Tudo o que você precisa para fechar mais
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            Recursos pensados para valorizar seu serviço e acompanhar resultados.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: 'Métricas Meta Ads', desc: 'Impressões, cliques, CPC, leads e conversões dos seus anúncios.' },
              { icon: FileText, title: 'Templates', desc: 'Modelos de proposta para personalizar com logo, textos e planos.' },
              { icon: FolderOpen, title: 'Propostas', desc: 'Crie, envie e acompanhe propostas com link para o cliente.' },
              { icon: PenTool, title: 'Assinaturas Digitais', desc: 'Envie PDFs para assinatura com canvas e registro de local e horário.' },
              { icon: PieChart, title: 'Relatórios', desc: 'Gráficos de assinaturas e propostas aceitas, evolução semanal.' },
              { icon: Network, title: 'Mapa Mental', desc: 'Organize ideias e planejamento em nós conectados.' },
              { icon: Calendar, title: 'Agenda', desc: 'Calendário para agendar compromissos e eventos.' },
              { icon: DollarSign, title: 'Faturamento', desc: 'Acompanhe propostas aceitas e valores confirmados.' },
              { icon: Shield, title: 'Leve e Gratuito', desc: 'Interface rápida. Comece sem custo.' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-avocado/50 transition-colors"
              >
                <feature.icon className="w-12 h-12 text-avocado mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Depoimentos</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Experiência de quem usa o Plify. Veja o que acontece quando métricas, propostas e sua página ficam em um só lugar.
          </p>
          <TestimonialsChat />
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-avocado/20 to-avocado/10 border border-avocado/30">
            <p className="text-avocado text-sm font-medium mb-2">Plano Gratuito</p>
            <p className="text-4xl font-bold mb-2">8 propostas grátis</p>
            <p className="text-gray-500 mb-6">Dashboard, templates e mini-site inclusos</p>
            <p className="text-avocado text-sm font-medium mb-2">Plano Pro - R$ 4,90/mês</p>
            <p className="text-2xl font-bold mb-2">Propostas ilimitadas</p>
            <p className="text-gray-500">Use à vontade. Stripe em breve.</p>
          </div>
        </div>
      </section>

      {/* CTA final - estilo Nepfy */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(86,130,3,0.08),transparent)]" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Comece sua próxima proposta</h2>
          <p className="text-gray-600 mb-8">Sem cartão de crédito. Setup em minutos.</p>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-avocado hover:bg-avocado-light text-black font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-avocado/20"
          >
            Começar grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer - preto */}
      <footer className="py-16 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/plify.png" alt="Plify" width={64} height={64} className="rounded-xl logo-avocado brightness-110" />
            </Link>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/termos-privacidade" className="text-gray-400 hover:text-avocado-light transition-colors">
                Termos de Privacidade
              </Link>
              <Link href="/suporte" className="text-gray-400 hover:text-avocado-light transition-colors">
                Suporte
              </Link>
              <Link href="/termos-uso" className="text-gray-400 hover:text-avocado-light transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
          <p className="text-gray-500 text-sm text-center mt-8">© 2025 Plify. Métricas, propostas e sua página.</p>
        </div>
      </footer>
    </div>
  )
}
