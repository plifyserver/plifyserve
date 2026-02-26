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
          sizes="(min-width: 1024px) 50vw, 0vw"
          quality={75}
          priority
          fetchPriority="high"
        />
      </div>
      {/* Overlay escuro leve para legibilidade do texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
      {/* Conteúdo em cima da imagem */}
      <div className="relative z-10 flex flex-col w-full min-h-screen p-8">
        <div className="flex items-start justify-between flex-shrink-0">
          <Link href="/" className="flex items-center">
            <Image src="/logobranco.png" alt="Logo" width={400} height={112} className="h-28 w-auto object-contain" priority />
          </Link>
          <span className="text-sm text-white/90">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex-1 min-h-0" />
        <p className="flex-shrink-0 text-white text-xl leading-relaxed max-w-lg drop-shadow-md font-light">
          Propostas modernas, Kanban visual, agenda integrada e planejamento estratégico tudo em um só lugar.
        </p>
      </div>
    </div>
  )
}
