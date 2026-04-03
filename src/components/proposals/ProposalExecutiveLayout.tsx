'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ArrowDownToLine, ArrowUp, Play, Star, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProposalData } from '@/components/proposals/ProposalPreview'
import { ProposalCommerceSections, type CommerceSectionStyles } from '@/components/proposals/ProposalCommerceSections'
import { ExecutivePlansSection } from '@/components/proposals/ExecutivePlansSection'
import { ExecutiveFaqSection } from '@/components/proposals/ExecutiveFaqSection'
import { ExecutiveWhyChooseSection } from '@/components/proposals/ExecutiveWhyChooseSection'
import { ExecutiveContactSection } from '@/components/proposals/ExecutiveContactSection'
import { normalizeExternalUrl } from '@/lib/empresarialContactLinks'
import {
  mergeExecutivePage1,
  mergeExecutivePage2,
  mergeExecutivePage3,
  mergeExecutivePage4,
  mergeExecutivePage5,
  mergeExecutivePage6,
  executiveNeonHex,
  executiveNeonRgb,
  type ExecutiveNeonAccent,
  type ExecutivePage2,
  type ExecutiveTestimonial,
} from '@/types/executiveProposal'

const CAROUSEL_INTERVAL_MS = 3200

function Starfield() {
  const dots = useMemo(() => {
    const out: { x: number; y: number; s: number; o: number }[] = []
    let seed = 12345
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < 85; i++) {
      out.push({
        x: rnd() * 100,
        y: rnd() * 100,
        s: 0.6 + rnd() * 1.4,
        o: 0.15 + rnd() * 0.55,
      })
    }
    return out
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.s,
            height: d.s,
            opacity: d.o,
          }}
        />
      ))}
    </div>
  )
}

function TrustpilotWordmark() {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-[#00B67A]" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0" fill="none">
        <path
          fill="#00B67A"
          d="M12 2.5 14.8 9h7.4l-6 4.4 2.3 7.1L12 16.4 5.5 20.5 7.8 13.4 1.8 9h7.4L12 2.5z"
        />
      </svg>
      <span className="text-sm tracking-tight">Trustpilot</span>
    </span>
  )
}

function ExecutiveBrandCarousel({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (urls.length <= 1) return
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % urls.length)
    }, CAROUSEL_INTERVAL_MS)
    return () => window.clearInterval(t)
  }, [urls.length])

  if (urls.length === 0) return null

  return (
    <div className="relative mx-auto flex h-14 w-full max-w-3xl items-center justify-center py-2">
      {urls.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          className={cn(
            'absolute max-h-10 w-auto max-w-[160px] object-contain grayscale transition-opacity duration-700 ease-in-out motion-reduce:transition-none',
            i === index ? 'opacity-80' : 'pointer-events-none opacity-0'
          )}
          draggable={false}
          decoding="async"
        />
      ))}
    </div>
  )
}

function testimonialIsVisible(t: ExecutiveTestimonial): boolean {
  return Boolean(t.quote?.trim() || t.name?.trim())
}

function ExecutiveTestimonialCard({ t }: { t: ExecutiveTestimonial }) {
  const stars = Math.min(5, Math.max(1, Math.round(t.starCount)))
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-4 shadow-lg shadow-black/20 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-3.5 w-3.5',
                i < stars ? 'fill-white text-white' : 'fill-white/15 text-white/15'
              )}
              strokeWidth={0}
            />
          ))}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-white/45">{t.ratingLabel}</span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-white/85">{t.quote.trim() || '—'}</p>
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
          {t.photoUrl ? (
            <img src={t.photoUrl} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/35">
              <User className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{t.name.trim() || '—'}</p>
          <p className="truncate text-xs text-white/50">{t.role.trim() || '—'}</p>
        </div>
      </div>
    </div>
  )
}

function ExecutiveMarqueeColumn({
  items,
  direction,
}: {
  items: ExecutiveTestimonial[]
  direction: 'up' | 'down'
}) {
  if (items.length === 0) return null
  const loop = [...items, ...items]
  const durSec = Math.max(22, items.length * 13)

  return (
    <div className="relative h-[min(560px,72dvh)] overflow-hidden">
      <div
        className={cn(
          'flex flex-col gap-4',
          direction === 'up' ? 'executiva-marquee-track-up' : 'executiva-marquee-track-down'
        )}
        style={{ ['--executiva-marquee-dur' as string]: `${durSec}s` } as CSSProperties}
      >
        {loop.map((t, i) => (
          <ExecutiveTestimonialCard key={`${t.name}-${t.quote}-${i}`} t={t} />
        ))}
      </div>
    </div>
  )
}

function sectionTitleStyle(accent: ExecutiveNeonAccent): CSSProperties {
  const h = executiveNeonHex(accent)
  if (accent === 'white') {
    return {
      backgroundImage: 'linear-gradient(105deg, #ffffff 0%, #e2e8f0 55%, #94a3b8 100%)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
    }
  }
  return {
    backgroundImage: `linear-gradient(105deg, #ffffff 0%, ${h} 45%, ${h} 100%)`,
    filter: `drop-shadow(0 0 28px rgba(${executiveNeonRgb(accent)}, 0.35))`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  }
}

function ExecutivePage2Section({
  p2,
  neonAccent,
}: {
  p2: ExecutivePage2
  neonAccent: ExecutiveNeonAccent
}) {
  const { colUp, colDown } = useMemo(() => {
    const t = p2.testimonials
    const up = [0, 2, 4, 6].map((i) => t[i]).filter(testimonialIsVisible)
    const down = [1, 3, 5, 7].map((i) => t[i]).filter(testimonialIsVisible)
    return { colUp: up, colDown: down }
  }, [p2.testimonials])

  const hasMarquee = colUp.length > 0 || colDown.length > 0

  return (
    <section className="relative border-t border-white/5 bg-black py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40" aria-hidden>
        <Starfield />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-16">
          <div>
            <p className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm text-white/55">
              <span>{p2.reviewsLead}</span>
              <span className="font-semibold text-white/90">{p2.reviewsCount}</span>
              <span>{p2.reviewsTrail}</span>
              {p2.showTrustpilotBadge ? <TrustpilotWordmark /> : null}
            </p>
            <h2
              className="mb-5 text-balance text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.35rem]"
              style={sectionTitleStyle(neonAccent)}
            >
              {p2.sectionTitle}
            </h2>
            <p className="max-w-lg text-pretty text-base leading-relaxed text-white/60 md:text-lg">
              {p2.sectionDescription}
            </p>
          </div>

          {hasMarquee ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <ExecutiveMarqueeColumn items={colUp} direction="up" />
              <ExecutiveMarqueeColumn items={colDown} direction="down" />
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center text-sm text-white/40">
              Adicione nome ou depoimento em Clientes · pág. 2 para ver as colunas animadas.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ExecutiveScrollToTop({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const onScroll = () => setVisible(window.scrollY > 380)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enabled])

  if (!enabled) return null

  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      className={cn(
        'fixed bottom-6 right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-slate-900/95 text-white shadow-xl backdrop-blur-md transition-all hover:bg-slate-800 hover:scale-105',
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
      onClick={() => {
        document.getElementById('executive-top')?.scrollIntoView({ behavior: 'smooth' })
      }}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}

interface ProposalExecutiveLayoutProps {
  data: ProposalData
  className?: string
  selectedPlanId?: string | null
  onSelectPlan?: (planId: string) => void
  onOpenPlanAccept?: (planId: string) => void
}

export function ProposalExecutiveLayout({
  data,
  className,
  selectedPlanId,
  onSelectPlan,
  onOpenPlanAccept,
}: ProposalExecutiveLayoutProps) {
  const p1 = mergeExecutivePage1(data.executivePage1)
  const p2 = mergeExecutivePage2(data.executivePage2)
  const p3 = mergeExecutivePage3(data.executivePage3)
  const p4 = mergeExecutivePage4(data.executivePage4)
  const p5 = mergeExecutivePage5(data.executivePage5)
  const p6 = mergeExecutivePage6(data.executivePage6)
  const rgb = executiveNeonRgb(p1.neonAccent)
  const hasPlansSection = data.paymentType === 'plans' && data.plans.length > 0
  const hex = executiveNeonHex(p1.neonAccent)
  const isWhite = p1.neonAccent === 'white'

  const rawProducts = p1.productsButtonUrl.trim()
  const rawContact = p1.contactButtonUrl.trim()
  const productsHref = rawProducts.startsWith('#')
    ? rawProducts
    : normalizeExternalUrl(rawProducts) || '#executive-proposta-corpo'
  const contactHref = rawContact.startsWith('#')
    ? rawContact
    : normalizeExternalUrl(rawContact) ||
      (data.company.email ? `mailto:${data.company.email.trim()}` : '#executive-proposta-corpo')

  const styles: CommerceSectionStyles = {
    sectionRadius: '0.75rem',
    cardShadow: 'shadow-lg',
  }

  const primaryBtnClass = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide transition-transform hover:scale-[1.02] active:scale-[0.98]',
    isWhite ? 'text-slate-900 shadow-lg' : 'text-white shadow-lg shadow-black/20'
  )

  const primaryBtnStyle: CSSProperties = isWhite
    ? {
        background: `linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)`,
        boxShadow: `0 0 40px rgba(${rgb}, 0.35)`,
      }
    : {
        background: `linear-gradient(135deg, ${hex} 0%, rgba(${rgb}, 0.75) 100%)`,
        boxShadow: `0 0 32px rgba(${rgb}, 0.45)`,
      }

  const secondaryBtnClass =
    'inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/5 px-7 py-3.5 text-sm font-semibold tracking-wide text-white backdrop-blur-sm transition-colors hover:border-white/55 hover:bg-white/10'

  return (
    <div id="executive-top" className={cn('overflow-hidden bg-black', className)}>
      <ExecutiveScrollToTop enabled={p2.showBackToTop} />

      <section className="relative min-h-[min(92dvh,920px)] w-full overflow-hidden pb-4 pt-10 md:pt-14">
        <Starfield />

        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-[55%] w-[200%] max-w-none -translate-x-1/2"
          style={{
            background: `radial-gradient(ellipse 55% 70% at 50% 100%, rgba(${rgb}, 0.42) 0%, rgba(${rgb}, 0.12) 35%, transparent 62%)`,
            filter: isWhite ? 'blur(48px)' : 'blur(40px)',
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent"
          aria-hidden
        />
        <svg
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 w-full text-black"
          viewBox="0 0 1440 48"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path fill="currentColor" d="M0,48 L0,28 Q720,0 1440,28 L1440,48 Z" />
        </svg>

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
          <div className="mb-8 flex items-center gap-2 text-white/90">
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-white text-white" strokeWidth={0} />
              ))}
            </span>
            <span className="text-sm font-medium tabular-nums">{p1.ratingLabel}</span>
          </div>

          <div className="mb-6 flex min-h-[4.5rem] items-center justify-center">
            {data.company.logo ? (
              <img
                src={data.company.logo}
                alt={data.company.name || 'Logo'}
                className="max-h-28 w-auto max-w-[min(100%,320px)] object-contain"
                draggable={false}
              />
            ) : (
              <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                {data.company.name?.trim() || 'Sua empresa'}
              </h1>
            )}
          </div>

          <p className="mb-10 max-w-2xl text-pretty text-base leading-relaxed text-white/65 md:text-lg">
            {p1.heroDescription}
          </p>

          <div className="mb-16 flex flex-wrap items-center justify-center gap-4">
            <a href={productsHref} className={primaryBtnClass} style={primaryBtnStyle}>
              <ArrowDownToLine className="h-4 w-4 shrink-0 opacity-90" />
              NOSSOS PRODUTOS
            </a>
            <a href={contactHref} className={secondaryBtnClass}>
              <Play className="h-4 w-4 shrink-0 opacity-90" fill="currentColor" />
              CONTATO
            </a>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/5 bg-black px-6 pb-12 pt-8">
          <p className="mx-auto mb-8 max-w-2xl text-center text-sm leading-relaxed text-white/55 md:text-base">
            {p1.trustedByText}
          </p>
          <ExecutiveBrandCarousel urls={p1.brandLogos} />
        </div>
      </section>

      <ExecutivePage2Section p2={p2} neonAccent={p1.neonAccent} />

      {hasPlansSection ? (
        <ExecutivePlansSection
          plans={data.plans}
          p3={p3}
          neonAccent={p1.neonAccent}
          selectedPlanId={selectedPlanId}
          onSelectPlan={onSelectPlan}
          onOpenPlanAccept={onOpenPlanAccept}
        />
      ) : null}

      <ExecutiveFaqSection p4={p4} neonAccent={p1.neonAccent} companyPhone={data.company.phone} />

      <ExecutiveWhyChooseSection page5={p5} neonRgb={rgb} />

      <ExecutiveContactSection
        p6={p6}
        neonAccent={p1.neonAccent}
        company={data.company}
        hasPlansSection={hasPlansSection}
      />

      <div id="executive-proposta-corpo" className="bg-white">
        <ProposalCommerceSections
          data={data}
          styles={styles}
          selectedPlanId={selectedPlanId}
          onSelectPlan={onSelectPlan}
          onOpenPlanAccept={onOpenPlanAccept}
          hidePlansSection
        />
      </div>
    </div>
  )
}
