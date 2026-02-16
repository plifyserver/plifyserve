'use client'

import Image from 'next/image'
import Link from 'next/link'

export function AuthSidePanel() {
  return (
    <div className="hidden lg:flex flex-1 min-h-screen relative overflow-hidden">
      {/* Foto ocupa 100% da coluna direita */}
      <div className="absolute inset-0">
        <Image
          src="/homemfogo.jpeg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="(min-width: 1024px) 100vw, 0vw"
          quality={95}
          priority
        />
      </div>
      {/* Overlay escuro leve para legibilidade do texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
      {/* Conteúdo em cima da imagem */}
      <div className="relative z-10 flex flex-col w-full min-h-screen p-8">
        <div className="flex items-start justify-between flex-shrink-0">
          <Link href="/" className="text-2xl font-bold text-white">
            Plify
          </Link>
          <span className="text-sm text-white/90">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex-1 min-h-0" />
        <p className="flex-shrink-0 text-white text-base leading-relaxed max-w-md drop-shadow-md">
          Propostas modernas, Kanban visual, agenda integrada e planejamento estratégico tudo em um só lugar.
        </p>
      </div>
    </div>
  )
}
