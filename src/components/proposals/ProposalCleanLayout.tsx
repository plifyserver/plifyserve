'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import type { ProposalData } from '@/components/proposals/ProposalPreview'
import { CleanTopBar, CleanPage3Section } from '@/components/proposals/CleanPage3Section'
import { CleanPage4Section } from '@/components/proposals/CleanPage4Section'
import { CleanPage5Section } from '@/components/proposals/CleanPage5Section'
import { getCleanPromotionWhatsappButtonHref } from '@/lib/cleanPromotionWhatsApp'
import {
  mergeCleanPage1,
  mergeCleanPage2,
  mergeCleanPage3,
  mergeCleanPage4,
  mergeCleanPage5,
  mergeCleanPromotionCta,
} from '@/types/cleanProposal'

function CleanParallaxImageSection({ imageUrl }: { imageUrl: string | null }) {
  const sectionRef = useRef<HTMLElement>(null)
  const [t, setT] = useState(0)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const start = vh * 0.9
      const p = 1 - Math.min(1, Math.max(0, rect.top / start))
      setT(p)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const translateY = (1 - t) * 6
  const blurPx = Math.max(0, 6 * (1 - t))

  if (!imageUrl) {
    return (
      <section
        ref={sectionRef}
        className="relative flex min-h-[100dvh] w-full items-center justify-center bg-zinc-950 text-zinc-500"
      >
        <p className="text-sm px-6 text-center">Adicione uma imagem na página 2 do modelo Clean (editor).</p>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="relative min-h-[130dvh] w-full overflow-hidden bg-black">
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <div
          className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 will-change-transform"
          style={{
            transform: `translateY(${translateY}%)`,
            filter: `blur(${blurPx}px)`,
          }}
        >
          <img
            src={imageUrl}
            alt=""
            className="max-h-full max-w-full object-contain"
            draggable={false}
            decoding="async"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"
          style={{ opacity: 0.85 - t * 0.35 }}
        />
      </div>
    </section>
  )
}

function displayKeywordPill(s: string) {
  const x = s.trim()
  if (!x) return null
  const text = x.replace(/^\*\s*/, '').trim()
  return text.length > 0 ? text : null
}

const FAB_CLASS =
  'fixed bottom-6 right-6 z-[200] inline-flex max-w-[min(100vw-2rem,18rem)] items-center justify-center gap-2 rounded-full border border-white/20 bg-emerald-600 px-5 py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-white shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-transform hover:scale-[1.02] hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none sm:bottom-8 sm:right-8'

function WhatsappLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={22}
      height={22}
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      />
    </svg>
  )
}

/** Portal → `document.body` para o FAB não ser cortado por `overflow`/`transform` do preview (editor, dashboard). */
function CleanFloatingWhatsappButton({ href, label }: { href: string; label: string }) {
  const [root, setRoot] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setRoot(document.body)
  }, [])
  if (!root) return null
  return createPortal(
    <a href={href} target="_blank" rel="noopener noreferrer" className={FAB_CLASS}>
      <WhatsappLogoIcon className="h-[1.35rem] w-[1.35rem] shrink-0 text-white" />
      <span className="min-w-0 leading-tight">{label}</span>
    </a>,
    root
  )
}

interface ProposalCleanLayoutProps {
  data: ProposalData
  className?: string
  selectedPlanId?: string | null
  onSelectPlan?: (planId: string) => void
  onOpenPlanAccept?: (planId: string) => void
}

export function ProposalCleanLayout({
  data,
  className,
}: ProposalCleanLayoutProps) {
  const p1 = mergeCleanPage1(data.cleanPage1)
  const p2 = mergeCleanPage2(data.cleanPage2)
  const p3 = mergeCleanPage3(data.cleanPage3)
  const p4 = mergeCleanPage4(data.cleanPage4)
  const p5 = mergeCleanPage5(data.cleanPage5)
  const promo = mergeCleanPromotionCta(data.cleanPromotionCta)
  const whatsappHref = getCleanPromotionWhatsappButtonHref(promo.whatsappTarget)

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const logoSrc = p1.logoUrl || data.company.logo
  const headline = p1.headline.trim() || data.company.name || 'Nome da empresa'

  const topBarProps = {
    logoSrc,
    companyName: data.company.name || '',
    contactLabel: p1.contactButtonLabel,
    onContact: () => scrollToId('clean-contato'),
  }

  return (
    <div className={cn('relative w-full overflow-x-hidden bg-black text-white', className)}>
      {/* Página 1 — hero escuro (única com barra logo + contato) */}
      <section className="relative flex min-h-[100dvh] w-full flex-col bg-black">
        <div className="px-0 pt-2 sm:pt-3">
          <CleanTopBar {...topBarProps} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-4 text-center sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[displayKeywordPill(p1.keyword1), displayKeywordPill(p1.keyword2)].filter(Boolean).map((text, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85"
              >
                <span className="h-1 w-1 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" aria-hidden />
                {text}
              </span>
            ))}
          </div>

          <h1 className="mt-8 max-w-[18ch] text-[clamp(2.5rem,10vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-white">
            {headline}
          </h1>

          <div className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6">
            {p1.meta.map((m, i) => (
              <div key={i} className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-widest text-white/35">{m.label}</p>
                <p className="mt-2 text-sm font-semibold text-white sm:text-base">{m.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CleanParallaxImageSection imageUrl={p2.imageUrl} />

      <CleanPage3Section page={p3} />

      <CleanPage4Section page={p4} />

      <CleanPage5Section
        page={p5}
        company={{
          name: data.company.name,
          email: data.company.email,
          phone: data.company.phone,
          address: data.company.address,
        }}
      />

      {whatsappHref ? (
        <CleanFloatingWhatsappButton href={whatsappHref} label={promo.buttonLabel} />
      ) : null}
    </div>
  )
}
