'use client'

import { useCallback, useEffect, useRef, useState, type ElementRef, type ReactNode } from 'react'
import {
  ArrowUp,
  Check,
  Dribbble,
  Facebook,
  Github,
  Instagram,
  Link2,
  Linkedin,
  MessageCircle,
  Music2,
  Palette,
  Star,
  Twitter,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProposalData } from '@/components/proposals/ProposalPreview'
import {
  ModernSurfaceProvider,
  useModernSurface,
  modernSectionShell,
  modernBorderTop,
  modernPlaceholderBox,
  type ModernPalette,
} from '@/components/proposals/modernProposalSurface'
import { ProposalCommerceSections, type CommerceSectionStyles } from '@/components/proposals/ProposalCommerceSections'
import { planBillingSuffix, type Plan } from '@/components/proposals/PlanCard'
import { mailtoHref, normalizeExternalUrl, telHref } from '@/lib/empresarialContactLinks'
import { proposalHtmlHasVisibleText } from '@/lib/proposalContent'
import { SITE_GUTTER_X } from '@/lib/siteLayout'
import {
  DEFAULT_MODERN_PAGE3,
  DEFAULT_MODERN_PAGE4_TITLE,
  mergeModernPage1,
  mergeModernPage2,
  mergeModernPage3,
  mergeModernPage4,
  mergeModernPage5,
  mergeModernPage6,
  mergeModernPage7,
  mergeModernPage8,
  type ModernPage4PlanRowView,
  type ModernPage6Item,
  type ModernPage7Testimonial,
  type ModernPage8,
  type ModernPage8SocialPlatform,
} from '@/types/modernProposal'

const MODERN_SOCIAL_ICONS: Record<ModernPage8SocialPlatform, LucideIcon> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  dribbble: Dribbble,
  github: Github,
  whatsapp: MessageCircle,
  tiktok: Music2,
  behance: Palette,
  other: Link2,
}

const MODERN_CAROUSEL_INTERVAL_MS = 4500

function ModernCommerceReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true)
      },
      { threshold: 0.06, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'will-change-transform transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      )}
    >
      {children}
    </div>
  )
}

/** Entrada suave ao entrar na viewport (secções sem animação própria). Respeita prefers-reduced-motion via Tailwind. */
function ModernScrollReveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true)
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'will-change-transform transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0',
        className
      )}
    >
      {children}
    </div>
  )
}

function SocialHandle({
  label,
  url,
  className,
}: {
  label: string
  url: string
  className?: string
}) {
  const { surface } = useModernSurface()
  const isDark = surface === 'dark'
  const href = normalizeExternalUrl(url)
  const text = label.trim() || '—'
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'text-[11px] font-medium uppercase tracking-[0.22em] underline-offset-4 transition-opacity hover:opacity-100 hover:underline sm:text-xs',
          isDark ? 'text-white/90' : 'text-slate-700',
          className
        )}
      >
        {text}
      </a>
    )
  }
  return (
    <span
      className={cn(
        'text-[11px] font-medium uppercase tracking-[0.22em] sm:text-xs',
        isDark ? 'text-white/55' : 'text-slate-500',
        className
      )}
    >
      {text}
    </span>
  )
}

function ModernPage2Block({
  imageUrl,
  keywords,
}: {
  imageUrl: string | null
  keywords: readonly string[]
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setEntered(true)
      },
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const display = keywords.map((k) => (k.trim() ? k.trim().toUpperCase() : '—'))

  const imageMotion =
    'transform-gpu will-change-transform transition-[transform,opacity,filter] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:scale-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-none'

  const { surface, palette } = useModernSurface()
  const shell = modernSectionShell(surface, palette)
  const kwText = surface === 'dark' ? 'text-white' : 'text-slate-800'

  return (
    <section ref={sectionRef} className={cn('flex min-h-[100dvh] w-full flex-col', shell.className)} style={shell.style}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            'flex min-h-0 flex-1 items-center justify-center overflow-hidden py-6 sm:py-10',
            SITE_GUTTER_X
          )}
        >
          <div
            className={cn(
              'flex w-full max-w-[min(100%,1600px)] items-center justify-center',
              imageMotion,
              entered
                ? 'translate-y-0 scale-100 opacity-100 blur-0'
                : 'translate-y-14 scale-[0.9] opacity-0 blur-sm'
            )}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="max-h-[min(78dvh,820px)] w-full object-contain"
                draggable={false}
                decoding="async"
              />
            ) : (
              <div
                className={cn(
                  'flex max-w-md flex-col items-center justify-center gap-3 rounded-2xl border px-8 py-16 text-center text-sm',
                  modernPlaceholderBox(surface)
                )}
              >
                <p>Adicione uma imagem na página 2 (editor).</p>
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            'shrink-0 border-t py-4 transition-[transform,opacity] duration-1000 ease-out sm:py-5 motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
            SITE_GUTTER_X,
            modernBorderTop(surface),
            shell.className,
            entered ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          )}
          style={{ ...shell.style, transitionDelay: entered ? '240ms' : '0ms' }}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-between sm:gap-x-4 md:gap-x-6">
            {display.map((word, i) => (
              <span
                key={i}
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-[0.12em] transition-[transform,opacity] duration-700 ease-out sm:text-[11px] md:text-xs md:tracking-[0.18em] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
                  kwText,
                  entered ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                )}
                style={{ transitionDelay: entered ? `${280 + i * 45}ms` : '0ms' }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ModernPage3Block({
  headline,
  images,
  accent,
}: {
  headline: string
  images: string[]
  accent: string
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const [entered, setEntered] = useState(false)
  const n = images.length
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setEntered(true)
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (n < 3) return
    const id = window.setInterval(() => {
      setOffset((o) => (o + 1) % n)
    }, MODERN_CAROUSEL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [n])

  const displayHeadline = (headline.trim() || DEFAULT_MODERN_PAGE3.headline).toUpperCase()
  const triple = n >= 3 ? ([0, 1, 2].map((i) => images[(offset + i) % n]) as [string, string, string]) : null

  const { surface, palette } = useModernSurface()
  const shell = modernSectionShell(surface, palette)

  return (
    <section ref={sectionRef} className={cn('w-full py-16 sm:py-24', SITE_GUTTER_X, shell.className)} style={shell.style}>
      <div
        className={cn(
          'mx-auto max-w-5xl transition-all duration-[1000ms] ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
          entered ? 'translate-y-0 opacity-100' : 'translate-y-14 opacity-0'
        )}
      >
        <h2
          className="whitespace-pre-line text-center text-[clamp(1.35rem,4.8vw,3rem)] font-black uppercase leading-[1.08] tracking-[-0.02em]"
          style={{ color: accent }}
        >
          {displayHeadline}
        </h2>
      </div>

      <div
        className={cn(
          'mx-auto mt-12 max-w-6xl sm:mt-16 motion-reduce:transition-none',
          'transition-all duration-[900ms] ease-out motion-reduce:opacity-100 motion-reduce:translate-y-0',
          entered ? 'translate-y-0 opacity-100 delay-150' : 'translate-y-10 opacity-0'
        )}
        style={{ transitionDelay: entered ? '120ms' : '0ms' }}
      >
        {n < 3 ? (
          <div
            className={cn(
              'flex min-h-[240px] w-full items-center justify-center rounded-2xl border px-6 py-14 text-center text-sm',
              modernPlaceholderBox(surface)
            )}
          >
            Adicione entre 3 e 4 imagens no carrossel (editor — página 3 do modelo Moderno).
          </div>
        ) : (
          <>
            <div key={offset} className="grid gap-6 opacity-100 transition-opacity duration-500 md:grid-cols-3 md:gap-5">
              {triple!.map((src, i) => {
                const idx = (offset + i) % n
                return (
                  <article
                    key={`${offset}-${idx}-${src}`}
                    className="mx-auto flex w-full max-w-sm flex-col rounded-xl bg-[#efe8dc] p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] sm:p-5"
                  >
                    <p
                      className="text-center font-mono text-xs font-bold tracking-wide sm:text-sm"
                      style={{ color: accent }}
                    >
                      [{String(idx + 1).padStart(3, '0')}]
                    </p>
                    <div className="relative mt-4 aspect-[3/4] w-full overflow-hidden rounded-lg bg-black/[0.06]">
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-contain"
                        draggable={false}
                        decoding="async"
                      />
                    </div>
                  </article>
                )
              })}
            </div>
            {n > 3 ? (
              <div className="mt-8 flex justify-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setOffset(i)}
                    className={cn(
                      'h-2 w-2 rounded-full transition-all',
                      offset === i ? 'scale-125' : 'opacity-40 hover:opacity-70'
                    )}
                    style={{
                      backgroundColor:
                        offset === i
                          ? accent
                          : surface === 'dark'
                            ? 'rgba(255,255,255,0.35)'
                            : 'rgba(15,23,42,0.25)',
                    }}
                  />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}

function NumberedArrowLine({ index }: { index: number }) {
  const { surface } = useModernSurface()
  const isDark = surface === 'dark'
  const n = String(index + 1).padStart(2, '0')
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className={cn('font-mono text-xs font-semibold tracking-widest', isDark ? 'text-white' : 'text-slate-900')}>
        {n}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-0.5">
        <span className={cn('h-px flex-1', isDark ? 'bg-white/40' : 'bg-slate-400')} />
        <span
          className={cn(
            'inline-block h-0 w-0 border-y-[3px] border-l-[5px] border-y-transparent',
            isDark ? 'border-l-white/55' : 'border-l-slate-500'
          )}
          aria-hidden
        />
      </div>
    </div>
  )
}

function PlanRowTiltImage({ src, alt }: { src: string | null; alt: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [straighten, setStraighten] = useState(1)
  const { surface } = useModernSurface()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      if (mq.matches) {
        setStraighten(1)
        return
      }
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const centerY = rect.top + rect.height / 2
      const band = vh * 0.42
      const d = Math.abs(centerY - vh / 2)
      const p = Math.max(0, Math.min(1, 1 - d / band))
      setStraighten(p)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      ro.disconnect()
    }
  }, [])

  const t = straighten
  const rotateX = (1 - t) * 12
  const rotateY = (1 - t) * -14
  const rotateZ = (1 - t) * -6
  const scale = 0.92 + t * 0.08

  if (!src) {
    return (
      <div
        className={cn(
          'flex aspect-[4/3] w-full max-w-xl items-center justify-center rounded-2xl border text-sm',
          modernPlaceholderBox(surface)
        )}
      >
        Sem imagem (adicione na vitrine ou no plano)
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-xl">
      <div
        className="transform-gpu will-change-transform motion-reduce:!transform-none"
        style={{
          transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
          transition: 'transform 120ms ease-out',
        }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full rounded-2xl object-cover shadow-[0_28px_80px_-12px_rgba(0,0,0,0.75)]"
          draggable={false}
          decoding="async"
        />
      </div>
    </div>
  )
}

function PlanModernDarkCard({
  plan,
  accent,
  primaryColor,
  isSelected,
  onSelectPlan,
  onOpenPlanAccept,
}: {
  plan: Plan
  accent: string
  primaryColor: string
  isSelected: boolean
  onSelectPlan?: (planId: string) => void
  onOpenPlanAccept?: (planId: string) => void
}) {
  const { surface } = useModernSurface()
  const isLight = surface === 'light'
  const isPublicPlanFlow = Boolean(onOpenPlanAccept)
  const isSelectableLegacy = Boolean(onSelectPlan) && !isPublicPlanFlow
  const billing = planBillingSuffix(plan.priceType)
  const billingLabel =
    plan.priceType === 'monthly' ? 'Mensal' : plan.priceType === 'annual' ? 'Anual' : 'Pagamento único'

  const t = {
    h: isLight ? 'text-slate-900' : 'text-white',
    body: isLight ? 'text-slate-600' : 'text-white/60',
    price: isLight ? 'text-slate-900' : 'text-white',
    meta: isLight ? 'text-slate-500' : 'text-white/45',
    meta2: isLight ? 'text-slate-400' : 'text-white/40',
    li: isLight ? 'text-slate-800' : 'text-white/85',
    btn: 'text-white',
  }

  const cardShell = isLight
    ? 'border border-slate-200 bg-white shadow-lg'
    : 'border border-white/10 bg-zinc-950/90 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-sm'

  const cardBody = (
    <>
      {plan.highlighted && !isSelected && (
        <div
          className="mb-4 inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
          style={{ backgroundColor: accent }}
        >
          Recomendado
        </div>
      )}
      {isSelected && (
        <div className="mb-4 flex justify-end">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}
      <h4 className={cn('text-lg font-bold uppercase tracking-wide', t.h)}>{plan.name || 'Plano'}</h4>
      <p className={cn('mt-2 text-sm leading-relaxed', t.body)}>{plan.description}</p>
      <div className="mt-5 flex flex-wrap items-baseline gap-2">
        <span className={cn('text-3xl font-bold sm:text-4xl', t.price)}>
          R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
        {billing ? <span className={cn('text-sm', t.meta)}>{billing}</span> : null}
        <span className={cn('ml-auto text-[10px] font-semibold uppercase tracking-widest', t.meta2)}>
          {billingLabel}
        </span>
      </div>
      <ul className="mt-6 space-y-3">
        {plan.benefits
          .filter((b) => b.trim())
          .map((benefit, j) => (
            <li key={j} className={cn('flex items-start gap-3 text-sm', t.li)}>
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${primaryColor}33` }}
              >
                <Check className="h-3 w-3" style={{ color: primaryColor }} />
              </span>
              {benefit}
            </li>
          ))}
      </ul>
      {isPublicPlanFlow && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenPlanAccept?.(plan.id)
          }}
          className={cn('mt-8 w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-opacity hover:opacity-90', t.btn)}
          style={{
            backgroundColor: isSelected ? primaryColor : plan.highlighted ? accent : primaryColor,
          }}
        >
          {isSelected ? 'Plano escolhido — aceitar abaixo' : 'Selecionar plano'}
        </button>
      )}
      {isSelectableLegacy && (
        <span
          className={cn('pointer-events-none mt-8 block w-full rounded-xl py-3.5 text-center text-sm font-semibold', t.btn)}
          style={{
            backgroundColor: isSelected ? primaryColor : plan.highlighted ? accent : primaryColor,
          }}
        >
          {isSelected ? 'Plano selecionado' : 'Selecionar'}
        </span>
      )}
      {!isPublicPlanFlow && !isSelectableLegacy && (
        <div
          className={cn('mt-8 w-full rounded-xl py-3.5 text-center text-sm font-semibold', t.btn, !isLight && 'text-white/90')}
          style={{ backgroundColor: plan.highlighted ? accent : primaryColor }}
        >
          Selecionar
        </div>
      )}
    </>
  )

  const ringOff = isLight ? 'ring-offset-white' : 'ring-offset-black'

  if (isSelectableLegacy) {
    return (
      <button
        type="button"
        onClick={() => onSelectPlan?.(plan.id)}
        className={cn(
          'w-full rounded-2xl p-6 text-left transition-all sm:p-8',
          cardShell,
          isLight
            ? 'cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300'
            : 'cursor-pointer hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30',
          plan.highlighted && !isSelected && cn('ring-1 ring-offset-2', ringOff),
          isSelected && cn('ring-2 ring-offset-2', ringOff)
        )}
        style={{
          ...(plan.highlighted && !isSelected ? { borderColor: `${accent}88` } : {}),
          ...(isSelected ? { borderColor: primaryColor, boxShadow: `0 0 0 2px ${primaryColor}` } : {}),
        }}
      >
        {cardBody}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl p-6 text-left sm:p-8',
        cardShell,
        plan.highlighted && !isSelected && cn('ring-1 ring-offset-2', ringOff),
        isSelected && cn('ring-2 ring-offset-2', ringOff)
      )}
      style={{
        ...(plan.highlighted && !isSelected ? { borderColor: `${accent}88` } : {}),
        ...(isSelected ? { borderColor: primaryColor, boxShadow: `0 0 0 2px ${primaryColor}` } : {}),
      }}
    >
      {cardBody}
    </div>
  )
}

function ModernPlanRowArticle({
  row,
  index,
  plan,
  accent,
  primaryColor,
  isSelected,
  borderRow,
  titlePlan,
  subPlan,
  onSelectPlan,
  onOpenPlanAccept,
}: {
  row: ModernPage4PlanRowView
  index: number
  plan: Plan
  accent: string
  primaryColor: string
  isSelected: boolean
  borderRow: string
  titlePlan: string
  subPlan: string
  onSelectPlan?: (planId: string) => void
  onOpenPlanAccept?: (planId: string) => void
}) {
  const ref = useRef<ElementRef<'article'>>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setEntered(true)
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <article
      ref={ref}
      className={cn(
        'mb-20 border-b pb-20 transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 last:mb-0 last:border-0 last:pb-0 sm:mb-28 sm:pb-28',
        borderRow,
        entered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      )}
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 lg:items-start">
        <div className="flex flex-col gap-8 lg:pt-2">
          <div>
            <NumberedArrowLine index={index} />
            <h3 className={cn('text-[clamp(1.35rem,3.8vw,2.5rem)] font-bold uppercase leading-[1.05] tracking-tight', titlePlan)}>
              {row.headline}
            </h3>
            {row.subline.trim() ? (
              <p className={cn('mt-3 text-[11px] font-medium uppercase tracking-[0.25em] sm:text-xs', subPlan)}>
                {row.subline}
              </p>
            ) : null}
          </div>
          <PlanModernDarkCard
            plan={plan}
            accent={accent}
            primaryColor={primaryColor}
            isSelected={isSelected}
            onSelectPlan={onSelectPlan}
            onOpenPlanAccept={onOpenPlanAccept}
          />
        </div>
        <div className="lg:pt-2">
          <PlanRowTiltImage src={row.imageUrl} alt="" />
        </div>
      </div>
    </article>
  )
}

function ModernPage4Block({
  eyebrow,
  sectionTitle,
  planRows,
  plans,
  accent,
  primaryColor,
  selectedPlanId,
  onSelectPlan,
  onOpenPlanAccept,
}: {
  eyebrow: string
  sectionTitle: string
  planRows: ModernPage4PlanRowView[]
  plans: Plan[]
  accent: string
  primaryColor: string
  selectedPlanId?: string | null
  onSelectPlan?: (planId: string) => void
  onOpenPlanAccept?: (planId: string) => void
}) {
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerEntered, setHeaderEntered] = useState(false)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setHeaderEntered(true)
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const { surface, palette } = useModernSurface()
  const shell = modernSectionShell(surface, palette)
  const borderRow = surface === 'dark' ? 'border-white/[0.07]' : 'border-slate-200'
  const titlePlan = surface === 'dark' ? 'text-white' : 'text-slate-900'
  const subPlan = surface === 'dark' ? 'text-white/55' : 'text-slate-600'

  if (planRows.length === 0) return null

  return (
    <section
      id="modern-planos"
      className={cn('relative scroll-mt-4 py-16 pb-24 sm:py-24 sm:pb-32', SITE_GUTTER_X, shell.className)}
      style={shell.style}
    >
      <div className="mx-auto max-w-7xl">
        <div
          ref={headerRef}
          className={cn(
            'mb-16 flex flex-col gap-8 lg:mb-24 lg:flex-row lg:items-start lg:justify-between transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
            headerEntered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          )}
        >
          <div className="flex max-w-full items-center gap-3 lg:max-w-[min(100%,280px)]">
            <span
              className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: accent }}
            >
              {eyebrow}
            </span>
            <span className="hidden h-px min-w-[4rem] flex-1 sm:block" style={{ backgroundColor: accent }} />
          </div>
          <h2
            className="whitespace-pre-line text-left text-[clamp(1.75rem,6vw,3.75rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] lg:max-w-[min(100%,520px)] lg:text-right"
            style={{ color: accent }}
          >
            {sectionTitle.trim() || DEFAULT_MODERN_PAGE4_TITLE}
          </h2>
        </div>

        {planRows.map((row, i) => {
          const plan = plans.find((p) => p.id === row.planId)
          if (!plan) return null
          const isSelected = selectedPlanId === plan.id
          return (
            <ModernPlanRowArticle
              key={row.planId}
              row={row}
              index={i}
              plan={plan}
              accent={accent}
              primaryColor={primaryColor}
              isSelected={isSelected}
              borderRow={borderRow}
              titlePlan={titlePlan}
              subPlan={subPlan}
              onSelectPlan={onSelectPlan}
              onOpenPlanAccept={onOpenPlanAccept}
            />
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          'fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full border bg-white text-black shadow-lg transition motion-reduce:transition-none',
          surface === 'dark' ? 'border-white/15 hover:bg-white/90' : 'border-slate-200 hover:bg-slate-50'
        )}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.25} />
      </button>
    </section>
  )
}

function AboutEyebrowLine({ label, accent }: { label: string; accent: string }) {
  const { surface } = useModernSurface()
  return (
    <div className="flex w-full max-w-[min(100%,320px)] items-center gap-2 sm:gap-3">
      <span
        className={cn(
          'shrink-0 text-[10px] font-semibold uppercase tracking-[0.28em]',
          surface === 'dark' ? 'text-white' : 'text-slate-800'
        )}
      >
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-0.5">
        <span className="h-px flex-1" style={{ backgroundColor: accent }} />
        <span
          className="inline-block h-0 w-0 border-y-[3px] border-l-[5px] border-y-transparent"
          style={{ borderLeftColor: accent }}
          aria-hidden
        />
      </div>
    </div>
  )
}

function ModernPage5Block({
  mainTitle,
  eyebrow,
  body,
  brands,
  accent,
}: {
  mainTitle: string
  eyebrow: string
  body: string
  brands: readonly { imageUrl: string | null; caption: string }[]
  accent: string
}) {
  const { surface, palette } = useModernSurface()
  const shell = modernSectionShell(surface, palette)
  const bodyCls = surface === 'dark' ? 'text-white/80' : 'text-slate-600'
  const brandCap = surface === 'dark' ? 'text-white/70' : 'text-slate-600'
  const brandEmpty = surface === 'dark' ? 'text-white/25' : 'text-slate-400'
  const lineCls = surface === 'dark' ? 'bg-white/15' : 'bg-slate-200'

  return (
    <section
      id="modern-sobre"
      className={cn('relative scroll-mt-4 py-20 sm:py-28', SITE_GUTTER_X, shell.className)}
      style={shell.style}
    >
      <div
        className="pointer-events-none absolute left-[clamp(1rem,5vw,2.75rem)] top-6 h-2 w-2 rounded-full sm:top-8"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <ModernScrollReveal className="mx-auto max-w-6xl">
        <h2
          className="max-w-[min(100%,640px)] whitespace-pre-line text-[clamp(1.85rem,5.5vw,3.25rem)] font-black uppercase leading-[1.02] tracking-[-0.02em]"
          style={{ color: accent }}
        >
          {mainTitle}
        </h2>

        <div className="mt-14 flex flex-col gap-10 lg:mt-20 lg:flex-row lg:items-start lg:gap-16 xl:gap-24">
          <AboutEyebrowLine label={eyebrow} accent={accent} />
          <p
            className={cn(
              'flex-1 text-[11px] font-medium uppercase leading-relaxed tracking-[0.18em] sm:text-xs sm:tracking-[0.22em] lg:max-w-3xl lg:text-[13px]',
              bodyCls
            )}
          >
            {body.trim() || 'Edite o texto na página 5 do editor.'}
          </p>
        </div>

        <div
          className={cn(
            'mt-20 grid grid-cols-1 gap-12 border-t pt-16 sm:grid-cols-3 sm:gap-8 sm:pt-20',
            surface === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
          )}
        >
          {brands.map((b, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="flex h-24 w-full max-w-[200px] items-center justify-center sm:h-28">
                {b.imageUrl ? (
                  <img
                    src={b.imageUrl}
                    alt=""
                    className="max-h-full max-w-full object-contain opacity-90"
                    draggable={false}
                    decoding="async"
                  />
                ) : (
                  <span className={cn('text-[10px] uppercase tracking-widest', brandEmpty)}>Logo {i + 1}</span>
                )}
              </div>
              <div className={cn('mt-5 h-px w-full max-w-[160px]', lineCls)} />
              <p className={cn('mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-[11px]', brandCap)}>
                {b.caption || `Marca ${i + 1}`}
              </p>
            </div>
          ))}
        </div>
      </ModernScrollReveal>
    </section>
  )
}

function ParallaxPortraitCard({
  item,
  index,
  accent,
  mode,
}: {
  item: ModernPage6Item
  index: number
  accent: string
  mode: 'team' | 'products'
}) {
  const { surface } = useModernSurface()
  const isLight = surface === 'light'
  const wrapRef = useRef<HTMLDivElement>(null)
  const [ty, setTy] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mult = 0.32 + (index % 4) * 0.1
    const tick = () => {
      if (mq.matches) {
        setTy(0)
        return
      }
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const start = vh * 1.02
      const raw = (start - r.top) / (vh * 0.9)
      const p = Math.max(0, Math.min(1, raw))
      setTy((1 - p) * 80 * mult)
    }
    tick()
    window.addEventListener('scroll', tick, { passive: true })
    window.addEventListener('resize', tick)
    return () => {
      window.removeEventListener('scroll', tick)
      window.removeEventListener('resize', tick)
    }
  }, [index])

  const staggerY = ['lg:translate-y-8', 'lg:-translate-y-8', 'lg:translate-y-16', 'lg:translate-y-2', 'lg:translate-y-10', 'lg:-translate-y-4']
  const rounded = item.frame === 'arch' ? 'rounded-t-[48%] rounded-b-2xl' : 'rounded-2xl'

  return (
    <div
      ref={wrapRef}
      className={cn(
        'relative flex justify-center transition-transform duration-75 ease-out motion-reduce:transform-none',
        staggerY[index % staggerY.length]
      )}
      style={{ transform: `translateY(${ty}px)` }}
    >
      <div
        className={cn(
          'group relative aspect-[3/4] w-full max-w-[240px] overflow-hidden border sm:max-w-[270px]',
          isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-white/[0.04]',
          rounded
        )}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
            decoding="async"
          />
        ) : (
          <div
            className={cn(
              'flex h-full items-center justify-center p-4 text-center text-[10px] uppercase tracking-wider',
              isLight ? 'text-slate-400' : 'text-white/30'
            )}
          >
            Imagem
          </div>
        )}
        <div
          className={cn(
            'absolute inset-0 flex flex-col justify-end p-4 transition-opacity duration-300',
            isLight
              ? 'bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent'
              : 'bg-gradient-to-t from-black/90 via-black/25 to-transparent',
            'opacity-0 group-hover:opacity-100 motion-reduce:opacity-100'
          )}
        >
          <p
            className={cn(
              'text-[11px] font-bold tracking-wide text-white',
              mode === 'team' ? 'uppercase tracking-[0.22em]' : 'normal-case'
            )}
          >
            {mode === 'team' ? (item.line1 || '—').toUpperCase() : item.line1 || '—'}
          </p>
          <p
            className={cn(
              'mt-1.5 whitespace-pre-line text-[10px] font-medium leading-snug text-white/75',
              mode === 'team' ? 'uppercase tracking-wider' : 'normal-case tracking-normal'
            )}
          >
            {item.line2 || '—'}
          </p>
        </div>
        <span
          className="pointer-events-none absolute right-3 top-3 hidden h-0.5 w-6 sm:block"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
      </div>
    </div>
  )
}

function ModernPage6Block({
  mode,
  title,
  subtitle,
  items,
  accent,
}: {
  mode: 'team' | 'products'
  title: string
  subtitle: string
  items: ModernPage6Item[]
  accent: string
}) {
  const gridClass =
    items.length <= 4
      ? 'grid-cols-2 lg:grid-cols-4'
      : items.length === 5
        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3'

  const { surface, palette } = useModernSurface()
  const shell = modernSectionShell(surface, palette)

  return (
    <section
      id="modern-equipa"
      className={cn('relative scroll-mt-4 py-20 sm:py-28', SITE_GUTTER_X, shell.className)}
      style={shell.style}
    >
      <div
        className="pointer-events-none absolute left-[clamp(1rem,5vw,2.75rem)] top-10 h-2 w-2 rounded-full sm:top-12"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <ModernScrollReveal className="w-full">
        <div className="mx-auto max-w-6xl text-center">
          <h2
            className="whitespace-pre-line text-[clamp(1.65rem,5vw,2.85rem)] font-black uppercase leading-[1.05] tracking-[-0.02em]"
            style={{ color: accent }}
          >
            {title}
          </h2>
          <p
            className={cn(
              'mx-auto mt-6 max-w-2xl text-sm font-medium leading-relaxed sm:text-base',
              surface === 'dark' ? 'text-white/75' : 'text-slate-600'
            )}
          >
            {subtitle}
          </p>
        </div>

        <div className={cn('mx-auto mt-16 grid max-w-6xl gap-y-16 gap-x-6 sm:gap-x-8', gridClass)}>
          {items.map((item, i) => (
            <ParallaxPortraitCard key={i} item={item} index={i} accent={accent} mode={mode} />
          ))}
        </div>
      </ModernScrollReveal>

      <p className="sr-only">{mode === 'team' ? 'Membros da equipa' : 'Produtos em destaque'}</p>
    </section>
  )
}

function TestimonialCard({ item }: { item: ModernPage7Testimonial }) {
  const { surface } = useModernSurface()
  const isLight = surface === 'light'
  const score = Math.max(0, Math.min(5, Number(item.ratingScore) || 0))
  const stars = Math.max(0, Math.min(5, Math.round(Number(item.starCount) || 0)))
  const q = item.quote.trim()

  return (
    <article
      className={cn(
        'w-[min(100vw-2.5rem,320px)] shrink-0 snap-start rounded-[1.75rem] border p-6 sm:w-[340px] sm:p-8',
        isLight
          ? 'border-slate-200 bg-white shadow-md'
          : 'border-white/[0.08] bg-zinc-900/90 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.85)]'
      )}
    >
      <h3 className={cn('text-base font-bold sm:text-lg', isLight ? 'text-slate-900' : 'text-white')}>
        {item.clientName.trim() || 'Cliente'}
      </h3>
      <p className={cn('mt-1 text-xs font-medium sm:text-sm', isLight ? 'text-slate-500' : 'text-white/50')}>
        {item.clientRole.trim() || 'Cargo'}
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <span
          className={cn(
            'text-[2.25rem] font-bold leading-none tabular-nums tracking-tight sm:text-5xl',
            isLight ? 'text-slate-900' : 'text-white'
          )}
        >
          {score.toFixed(1)}
        </span>
        <div className="flex gap-0.5 pb-1" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                'h-4 w-4 sm:h-5 sm:w-5',
                i < stars ? 'fill-amber-400 text-amber-400' : isLight ? 'fill-none text-slate-300' : 'fill-none text-white/25'
              )}
              strokeWidth={i < stars ? 0 : 1.25}
            />
          ))}
        </div>
      </div>

      {q ? (
        <p className={cn('mt-6 text-sm leading-relaxed sm:text-[15px]', isLight ? 'text-slate-700' : 'text-white/90')}>
          <span className={isLight ? 'text-slate-400' : 'text-white/50'}>&ldquo;</span>
          {q}
          <span className={isLight ? 'text-slate-400' : 'text-white/50'}>&rdquo;</span>
        </p>
      ) : (
        <p className={cn('mt-6 text-sm italic', isLight ? 'text-slate-400' : 'text-white/35')}>
          Sem texto do depoimento.
        </p>
      )}
    </article>
  )
}

function ModernPage7Block({
  sectionTitle,
  items,
  accent,
}: {
  sectionTitle: string
  items: ModernPage7Testimonial[]
  accent: string
}) {
  const { surface, palette } = useModernSurface()
  const shell = modernSectionShell(surface, palette)

  return (
    <section
      id="modern-depoimentos"
      className={cn('relative scroll-mt-4 py-20 sm:py-28', SITE_GUTTER_X, shell.className)}
      style={shell.style}
    >
      <ModernScrollReveal className="mx-auto max-w-7xl">
        <div className="mb-12 flex max-w-6xl flex-wrap items-center gap-3 sm:mb-16">
          <span
            className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.3em] sm:text-[11px]"
            style={{ color: accent }}
          >
            {sectionTitle}
          </span>
          <span className="h-px min-w-[4rem] flex-1 max-w-[min(100%,280px)]" style={{ backgroundColor: accent }} />
        </div>

        {items.length === 0 ? (
          <div
            className={cn(
              'rounded-[1.75rem] border py-16 text-center text-sm',
              modernPlaceholderBox(surface)
            )}
          >
            Adicione recomendações na página 7 do editor.
          </div>
        ) : (
          <div
            className="-mx-1 flex gap-5 overflow-x-auto px-1 pb-4 pt-2 [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin] sm:gap-6 snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {items.map((item, i) => (
              <TestimonialCard key={i} item={item} />
            ))}
          </div>
        )}
      </ModernScrollReveal>
    </section>
  )
}

function FooterColumnHeading({ children, accent }: { children: ReactNode; accent: string }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white">{children}</span>
    </div>
  )
}

function ModernPage8Block({ m8, accent }: { m8: ModernPage8; accent: string }) {
  const { surface, palette } = useModernSurface()
  const isDark = surface === 'dark'
  const socialVisible = m8.socialLinks.filter((s) => s.url.trim().length > 0)
  const pills = m8.clickableLinks.filter((l) => l.label.trim() && l.url.trim())
  const showPills = pills.length > 0
  const hasContact =
    Boolean(m8.contactEmail.trim()) || Boolean(m8.contactPhone.trim()) || Boolean(m8.contactAddress.trim())

  const gridCols = showPills ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
  const footStyle = isDark ? { backgroundColor: '#000000' } : { backgroundColor: palette.secondary }
  const pillCls = isDark
    ? 'rounded-full border border-white/10 bg-white/[0.07] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 transition hover:border-white/25 hover:bg-white/10'
    : 'rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/95 transition hover:bg-white/15'
  const socIcon = isDark
    ? 'flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:border-white/25 hover:bg-white/10'
    : 'flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/15'

  return (
    <footer
      id="modern-rodape"
      className={cn('relative scroll-mt-4 pb-28 pt-16 text-white sm:pb-32 sm:pt-24', SITE_GUTTER_X)}
      style={footStyle}
    >
      <ModernScrollReveal className="mx-auto max-w-7xl">
        <div className={cn('grid gap-12 lg:gap-10', gridCols)}>
          <div>
            <h2 className="mb-8 max-w-[16rem] text-2xl font-bold leading-[1.15] tracking-tight text-white sm:text-3xl">
              {m8.socialColumnTitle}
            </h2>
            {socialVisible.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {socialVisible.map((s, i) => {
                  const href = normalizeExternalUrl(s.url)
                  const Icon = MODERN_SOCIAL_ICONS[s.platform] ?? Link2
                  const label =
                    s.platform === 'other' && s.customLabel?.trim()
                      ? s.customLabel.trim()
                      : s.platform === 'facebook'
                        ? 'Facebook'
                        : s.platform === 'twitter'
                          ? 'X / Twitter'
                          : s.platform === 'instagram'
                            ? 'Instagram'
                            : s.platform === 'linkedin'
                              ? 'LinkedIn'
                              : s.platform === 'youtube'
                                ? 'YouTube'
                                : s.platform === 'dribbble'
                                  ? 'Dribbble'
                                  : s.platform === 'github'
                                    ? 'GitHub'
                                    : s.platform === 'whatsapp'
                                      ? 'WhatsApp'
                                      : s.platform === 'tiktok'
                                        ? 'TikTok'
                                        : s.platform === 'behance'
                                          ? 'Behance'
                                          : 'Link'
                  return (
                    <a
                      key={`${s.platform}-${i}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={socIcon}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </a>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-white/50">Adicione links de redes na página 8 do editor.</p>
            )}
          </div>

          {showPills ? (
            <div>
              <FooterColumnHeading accent={accent}>{m8.linksColumnTitle}</FooterColumnHeading>
              <div className="flex flex-wrap gap-2">
                {pills.map((l, i) => (
                  <a
                    key={i}
                    href={normalizeExternalUrl(l.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={pillCls}
                  >
                    {l.label.trim()}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className={cn(!showPills && 'lg:col-span-1')}>
            <FooterColumnHeading accent={accent}>{m8.contactColumnTitle}</FooterColumnHeading>
            {hasContact ? (
              <div className="space-y-3 text-sm text-white/85">
                {m8.contactEmail.trim() ? (
                  <a href={mailtoHref(m8.contactEmail)} className="block hover:underline">
                    {m8.contactEmail.trim()}
                  </a>
                ) : null}
                {m8.contactPhone.trim() ? (
                  <a href={telHref(m8.contactPhone)} className="block hover:underline">
                    {m8.contactPhone.trim()}
                  </a>
                ) : null}
                {m8.contactAddress.trim() ? (
                  <p className="whitespace-pre-line leading-relaxed text-white/75">{m8.contactAddress.trim()}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-white/50">Preencha email, telefone ou morada na página 8.</p>
            )}
          </div>
        </div>

        <div className={cn('mt-16 border-t pt-12 sm:mt-20 sm:pt-16', isDark ? 'border-white/10' : 'border-white/15')}>
          <p
            className="whitespace-pre-line text-center text-[clamp(1.75rem,10vw,5.5rem)] font-black uppercase leading-[0.88] tracking-[-0.04em] sm:text-left"
            style={{ color: accent }}
          >
            {m8.footerBrandText}
          </p>

          <div className="relative mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <p className="max-w-xl text-[10px] leading-relaxed text-white/55 sm:text-[11px]">{m8.copyrightLine}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-white/55 sm:text-[11px]">
              {m8.termsUrl.trim() ? (
                <a
                  href={normalizeExternalUrl(m8.termsUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {m8.termsLabel}
                </a>
              ) : null}
              {m8.privacyUrl.trim() ? (
                <a
                  href={normalizeExternalUrl(m8.privacyUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {m8.privacyLabel}
                </a>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-full border border-white/25 bg-white text-black shadow-lg transition hover:bg-white/90 motion-reduce:transition-none sm:absolute sm:bottom-0 sm:right-0 sm:self-auto"
              aria-label="Voltar ao topo"
            >
              <ArrowUp className="h-5 w-5" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </ModernScrollReveal>
    </footer>
  )
}

interface ProposalModernLayoutProps {
  data: ProposalData
  className?: string
  commerceStyles: CommerceSectionStyles
  selectedPlanId?: string | null
  onSelectPlan?: (planId: string) => void
  onOpenPlanAccept?: (planId: string) => void
}

function ProposalModernLayoutInner({
  data,
  className,
  commerceStyles,
  selectedPlanId,
  onSelectPlan,
  onOpenPlanAccept,
}: ProposalModernLayoutProps) {
  const m = mergeModernPage1(data.modernPage1)
  const m2 = mergeModernPage2(data.modernPage2)
  const m3 = mergeModernPage3(data.modernPage3)
  const m4 = mergeModernPage4(data.modernPage4, data.plans)
  const m5 = mergeModernPage5(data.modernPage5)
  const m6 = mergeModernPage6(data.modernPage6)
  const m7 = mergeModernPage7(data.modernPage7)
  const m8 = mergeModernPage8(data.modernPage8, data.company)
  const accent = data.colorPalette?.accent ?? '#E85D4C'
  const primaryColor = data.colorPalette?.primary ?? '#6366F1'
  const companyName = data.company.name?.trim() || 'Sua empresa'
  const displayName = companyName.toUpperCase()

  const hasModernCommerceBody =
    proposalHtmlHasVisibleText(data.description) ||
    (data.blocks?.length ?? 0) > 0 ||
    (data.paymentType === 'single' && data.singlePrice > 0)

  const scrollToContent = useCallback(() => {
    const id = hasModernCommerceBody ? 'modern-conteudo' : 'modern-planos'
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hasModernCommerceBody])

  const taglineLines = m.heroTagline.split('\n').map((l) => l.trim()).filter(Boolean)
  const displayTagline =
    taglineLines.length > 0 ? taglineLines : [m.heroTagline.trim() || 'Sua frase aqui']

  const { surface, palette } = useModernSurface()
  const heroShell = modernSectionShell(surface, palette)
  const isLight = surface === 'light'

  return (
    <div className={cn('w-full overflow-x-hidden', heroShell.className, className)} style={heroShell.style}>
      <section className="relative">
        <ModernScrollReveal
          className={cn('flex min-h-[100dvh] flex-col pb-10 pt-5 sm:pb-14 sm:pt-6', SITE_GUTTER_X)}
        >
        <header className="relative z-20 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            {data.company.logo ? (
              <img
                src={data.company.logo}
                alt={data.company.name || 'Logo'}
                className="h-8 w-auto max-w-[200px] object-contain object-left sm:h-9"
              />
            ) : (
              <span
                className={cn(
                  'text-sm font-semibold uppercase tracking-[0.18em]',
                  isLight ? 'text-slate-800' : 'text-white/90'
                )}
              >
                {data.company.name?.trim() || 'Logo'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={scrollToContent}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors sm:px-5 sm:text-[11px]',
              isLight ? 'hover:bg-black/[0.04]' : 'text-white hover:bg-white/5'
            )}
            style={{ borderColor: accent, color: isLight ? accent : '#fff' }}
          >
            {m.contactButtonLabel}
          </button>
        </header>

        <div className="relative z-10 mt-10 grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:mt-14 sm:gap-6">
          <SocialHandle label={m.leftHandle} url={m.leftUrl} className="justify-self-start text-left" />
          <div className="max-w-[12rem] text-center sm:max-w-none">
            {displayTagline.map((line, i) => (
              <p
                key={i}
                className={cn(
                  'text-[10px] font-semibold uppercase leading-snug tracking-[0.28em] sm:text-xs sm:tracking-[0.32em]',
                  isLight ? 'text-slate-600' : 'text-white/85'
                )}
              >
                {line}
              </p>
            ))}
          </div>
          <SocialHandle label={m.rightHandle} url={m.rightUrl} className="justify-self-end text-right" />
        </div>

        <div className="relative z-0 mt-auto flex flex-1 flex-col justify-end pt-8 sm:pt-12">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[min(50vw,280px)] w-[min(50vw,280px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[80px]"
            style={{ background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)` }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-[42%] top-[40%] h-32 w-32 rounded-full bg-emerald-400/15 blur-3xl sm:h-40 sm:w-40"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-[38%] top-[48%] h-24 w-24 rounded-full bg-amber-300/10 blur-2xl sm:h-32 sm:w-32"
            aria-hidden
          />

          <h1
            className="relative z-[1] w-full text-center text-[clamp(2.75rem,14vw,7.5rem)] font-bold uppercase leading-[0.88] tracking-[-0.04em]"
            style={{ color: accent }}
          >
            {displayName}
          </h1>

          <p
            className={cn(
              'relative z-[1] mt-6 text-center text-[10px] font-medium uppercase tracking-[0.35em]',
              isLight ? 'text-slate-400' : 'text-white/25'
            )}
          >
            Role para ver a proposta
          </p>
        </div>
        </ModernScrollReveal>
      </section>

      <ModernPage2Block imageUrl={m2.imageUrl} keywords={m2.keywords} />

      <ModernPage3Block headline={m3.headline} images={m3.carouselImages} accent={accent} />

      <ModernPage4Block
        eyebrow={m4.eyebrow}
        sectionTitle={m4.sectionTitle}
        planRows={m4.planRows}
        plans={data.plans}
        accent={accent}
        primaryColor={primaryColor}
        selectedPlanId={selectedPlanId}
        onSelectPlan={onSelectPlan}
        onOpenPlanAccept={onOpenPlanAccept}
      />

      <ModernPage5Block
        mainTitle={m5.mainTitle}
        eyebrow={m5.eyebrow}
        body={m5.body}
        brands={m5.brands}
        accent={accent}
      />

      <ModernPage6Block
        mode={m6.mode}
        title={m6.title}
        subtitle={m6.subtitle}
        items={m6.items}
        accent={accent}
      />

      <ModernPage7Block sectionTitle={m7.sectionTitle} items={m7.items} accent={accent} />

      {hasModernCommerceBody ? (
        <div id="modern-conteudo" className="scroll-mt-2">
          <ModernCommerceReveal>
            <ProposalCommerceSections
              data={data}
              styles={commerceStyles}
              selectedPlanId={selectedPlanId}
              onSelectPlan={onSelectPlan}
              onOpenPlanAccept={onOpenPlanAccept}
              hidePlansSection={m4.planRows.length > 0}
              hideDeliverySection
              hideFooterSection
              embedModernSurface={surface}
            />
          </ModernCommerceReveal>
        </div>
      ) : null}

      <ModernPage8Block m8={m8} accent={accent} />
    </div>
  )
}

const MODERN_FALLBACK_PALETTE: ModernPalette = {
  primary: '#6366F1',
  secondary: '#1E293B',
  accent: '#E85D4C',
  background: '#FFFFFF',
  text: '#334155',
}

export function ProposalModernLayout(props: ProposalModernLayoutProps) {
  const palette: ModernPalette = {
    ...MODERN_FALLBACK_PALETTE,
    ...props.data.colorPalette,
  }
  const surface = props.data.modernSurfaceTheme === 'light' ? 'light' : 'dark'
  return (
    <ModernSurfaceProvider surface={surface} palette={palette}>
      <ProposalModernLayoutInner {...props} />
    </ModernSurfaceProvider>
  )
}
