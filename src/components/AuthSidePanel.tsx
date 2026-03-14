'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LOGO_BRANCO } from '@/lib/logo'

const FRASES_CARROSSEL = [
  { titulo: 'DASHBOARD INTELIGENTE', descricao: 'Visualize clientes, faturamento e desempenho do negócio em um único painel.' },
  { titulo: 'GESTÃO DE CLIENTES SIMPLIFICADA', descricao: 'Organize seus clientes, histórico e interações em um CRM claro e eficiente.' },
  { titulo: 'PROPOSTAS PROFISSIONAIS EM SEGUNDOS', descricao: 'Crie propostas organizadas e envie para seus clientes com apenas alguns cliques.' },
  { titulo: 'CONTRATOS AUTOMATIZADOS', descricao: 'Gere contratos automaticamente a partir de propostas aprovadas.' },
  { titulo: 'ASSINATURA DIGITAL COM VALIDADE JURÍDICA', descricao: 'Formalize acordos com segurança e validade legal em poucos cliques.' },
  { titulo: 'CONTROLE FINANCEIRO CENTRALIZADO', descricao: 'Acompanhe receitas, despesas e fluxo de caixa sem planilhas complicadas.' },
  { titulo: 'PROJETOS SEM CAOS', descricao: 'Gerencie tarefas, prazos e entregas com um sistema de projetos simples.' },
  { titulo: 'CAMPANHAS DE TRÁFEGO SOB CONTROLE', descricao: 'Acompanhe investimentos em anúncios e entenda o retorno das campanhas.' },
  { titulo: 'PERSONALIZAÇÃO COMPLETA DA PLATAFORMA', descricao: 'Adapte o Plify à identidade e ao fluxo de trabalho do seu negócio.' },
  { titulo: 'TUDO EM UM ÚNICO LUGAR', descricao: 'Clientes, vendas, projetos e finanças organizados dentro do Plify.' },
]

export function AuthSidePanel() {
  const [indiceFrase, setIndiceFrase] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndiceFrase((i) => (i + 1) % FRASES_CARROSSEL.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const frase = FRASES_CARROSSEL[indiceFrase]

  return (
    <div className="hidden lg:flex flex-[1.35] min-h-screen items-stretch p-4 bg-neutral-100">
      {/* Bloco com arredondamento nos 4 cantos */}
      <div className="flex flex-col w-full min-h-[calc(100vh-2rem)] rounded-2xl overflow-hidden relative bg-slate-900 shadow-xl">
        {/* Foto */}
        <div className="absolute inset-0">
          <Image
            src="/homemfogo.jpeg"
            alt=""
            fill
            className="object-cover object-center"
            sizes="(min-width: 1024px) 58vw, 0vw"
            quality={85}
            priority
            fetchPriority="high"
          />
        </div>
        {/* Overlay escuro leve para legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
        {/* Conteúdo em cima da imagem */}
        <div className="relative z-10 flex flex-col flex-1 min-h-0 p-8">
          <div className="flex items-start justify-between flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image src={LOGO_BRANCO} alt="Logo" width={120} height={34} className="h-8 w-auto max-w-[120px] object-contain" priority />
            </Link>
            <span className="text-sm text-white/90">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex-1 min-h-0" />
          {/* Carrossel de frases */}
          <div className="flex-shrink-0 max-w-lg">
            <p className="text-white/90 text-xs font-medium tracking-widest uppercase mb-2 drop-shadow-md">
              {frase.titulo}
            </p>
            <p className="text-white text-xl font-bold leading-relaxed drop-shadow-md">
              {frase.descricao}
            </p>
            <div className="flex items-center gap-1.5 mt-4" aria-hidden>
              {FRASES_CARROSSEL.map((_, i) => (
                <span
                  key={i}
                  className={`h-0.5 rounded-full transition-all duration-300 ${
                    i === indiceFrase ? 'w-8 bg-white' : 'w-4 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
