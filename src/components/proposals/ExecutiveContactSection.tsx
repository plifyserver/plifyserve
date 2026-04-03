'use client'

import { useMemo, type CSSProperties } from 'react'
import {
  ArrowDownToLine,
  Check,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Play,
  Twitter,
  Youtube,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProposalData } from '@/components/proposals/ProposalPreview'
import { normalizeExternalUrl, whatsappHref, mailtoHref, telHref } from '@/lib/empresarialContactLinks'
import type { ExecutiveNeonAccent, ExecutivePage6 } from '@/types/executiveProposal'
import { executiveNeonHex, executiveNeonRgb } from '@/types/executiveProposal'

function ContactStarfield() {
  const dots = useMemo(() => {
    const out: { x: number; y: number; s: number; o: number }[] = []
    let seed = 44102
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < 72; i++) {
      out.push({
        x: rnd() * 100,
        y: rnd() * 100,
        s: 0.45 + rnd() * 1.25,
        o: 0.12 + rnd() * 0.5,
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

function socialHref(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  return normalizeExternalUrl(t) || null
}

export function ExecutiveContactSection({
  p6,
  neonAccent,
  company,
  hasPlansSection,
}: {
  p6: ExecutivePage6
  neonAccent: ExecutiveNeonAccent
  company: ProposalData['company']
  hasPlansSection: boolean
}) {
  const rgb = executiveNeonRgb(neonAccent)
  const hex = executiveNeonHex(neonAccent)
  const isWhite = neonAccent === 'white'

  const plansHref = hasPlansSection ? '#executive-planos' : '#executive-proposta-corpo'
  const waSource = p6.whatsappPhone.trim().length > 0 ? p6.whatsappPhone : company.phone
  const waLink = whatsappHref(waSource)

  const displayAddress = p6.footerAddress.trim() || company.address.trim()
  const displayCnpj = p6.footerCnpj.trim() || company.document.trim()

  const trustVisible = p6.trustLines.map((t) => t.trim()).filter(Boolean)

  const socialItems: { key: string; href: string; label: string; Icon: typeof Instagram }[] = []
  const ig = socialHref(p6.socialInstagram)
  if (ig) socialItems.push({ key: 'ig', href: ig, label: 'Instagram', Icon: Instagram })
  const fb = socialHref(p6.socialFacebook)
  if (fb) socialItems.push({ key: 'fb', href: fb, label: 'Facebook', Icon: Facebook })
  const li = socialHref(p6.socialLinkedin)
  if (li) socialItems.push({ key: 'li', href: li, label: 'LinkedIn', Icon: Linkedin })
  const yt = socialHref(p6.socialYoutube)
  if (yt) socialItems.push({ key: 'yt', href: yt, label: 'YouTube', Icon: Youtube })
  const tw = socialHref(p6.socialTwitter)
  if (tw) socialItems.push({ key: 'tw', href: tw, label: 'X / Twitter', Icon: Twitter })
  const web = socialHref(p6.socialWebsite)
  if (web) socialItems.push({ key: 'web', href: web, label: 'Site', Icon: Globe })

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

  const mail = company.email.trim()
  const phone = company.phone.trim()

  return (
    <section
      className="relative overflow-hidden border-t border-white/10 bg-black pb-0 pt-16 md:pt-24"
      aria-labelledby="executive-contact-heading"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-[18%] h-[min(100vw,640px)] w-[min(100vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px] opacity-[0.32]"
        style={{
          background: `radial-gradient(circle, rgba(${rgb}, 0.5) 0%, rgba(${rgb}, 0.1) 50%, transparent 72%)`,
        }}
      />
      <ContactStarfield />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_18%,rgba(255,255,255,0.05),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="relative mx-auto mb-10 flex h-36 w-36 items-center justify-center sm:mb-12 sm:h-40 sm:w-40">
          <div
            className="pointer-events-none absolute inset-[-8px] rounded-full border border-white/[0.12]"
            style={{ boxShadow: `0 0 60px -8px rgba(${rgb}, 0.35)` }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-[-28px] rounded-full border border-dashed border-white/15 opacity-80 motion-safe:animate-[spin_28s_linear_infinite]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-[-48px] rounded-full border border-white/[0.07] opacity-60 motion-safe:animate-[spin_42s_linear_infinite_reverse]"
            aria-hidden
          />
          <div
            className="relative flex h-[5.25rem] w-[5.25rem] items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/90 shadow-2xl sm:h-24 sm:w-24"
            style={{
              boxShadow: `0 0 48px -6px rgba(${rgb}, 0.55), 0 0 0 1px rgba(${rgb}, 0.2) inset`,
            }}
          >
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.name?.trim() || 'Logo'}
                className="max-h-[85%] max-w-[85%] object-contain"
                draggable={false}
              />
            ) : (
              <span className="text-2xl font-bold tracking-tight text-white">
                {(company.name?.trim() || 'Sua marca').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <h2
          id="executive-contact-heading"
          className="text-balance text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
        >
          {p6.title}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/55 md:text-lg">
          {p6.subtitle}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href={plansHref} className={primaryBtnClass} style={primaryBtnStyle}>
            <ArrowDownToLine className="h-4 w-4 shrink-0 opacity-90" />
            {p6.plansButtonLabel}
          </a>
          {waLink !== '#' ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className={secondaryBtnClass}>
              <Play className="h-4 w-4 shrink-0 opacity-90" fill="currentColor" />
              {p6.whatsappButtonLabel}
            </a>
          ) : null}
        </div>

        {trustVisible.length > 0 ? (
          <ul className="mx-auto mt-10 flex max-w-2xl flex-col flex-wrap items-center justify-center gap-3 text-sm text-white/50 sm:flex-row sm:gap-x-8 sm:gap-y-2">
            {trustVisible.map((line, i) => (
              <li key={`${i}-${line.slice(0, 12)}`} className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `rgba(${rgb}, 0.2)`,
                    color: isWhite ? '#e2e8f0' : hex,
                  }}
                  aria-hidden
                >
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
                <span className="text-left">{line}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <footer
        className="relative z-10 mt-20 border-t border-white/10"
        style={{
          background: `linear-gradient(180deg, rgba(${rgb}, 0.08) 0%, rgba(0,0,0,0.92) 45%, #000 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-70"
          style={{
            background: `radial-gradient(ellipse 80% 100% at 50% 0%, rgba(${rgb}, 0.22), transparent 65%)`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-12 md:grid-cols-3 md:gap-10">
            <div className="text-center md:text-left">
              <p className="text-lg font-semibold text-white">{company.name?.trim() || 'Sua empresa'}</p>
              {p6.footerTagline.trim() ? (
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/50 md:mx-0 md:max-w-none">
                  {p6.footerTagline}
                </p>
              ) : null}
            </div>

            <div className="space-y-4 text-center md:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Dados</p>
              {displayAddress ? (
                <p className="flex items-start justify-center gap-2 text-sm text-white/60 md:justify-start">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/35" aria-hidden />
                  <span className="text-pretty">{displayAddress}</span>
                </p>
              ) : null}
              {displayCnpj ? (
                <p className="text-sm text-white/60">
                  <span className="text-white/40">CNPJ </span>
                  {displayCnpj}
                </p>
              ) : null}
              {mail ? (
                <a
                  href={mailtoHref(mail)}
                  className="flex items-center justify-center gap-2 text-sm text-white/60 transition-colors hover:text-white md:justify-start"
                >
                  <Mail className="h-4 w-4 shrink-0 text-white/35" aria-hidden />
                  {mail}
                </a>
              ) : null}
              {phone ? (
                <a
                  href={telHref(phone)}
                  className="flex items-center justify-center gap-2 text-sm text-white/60 transition-colors hover:text-white md:justify-start"
                >
                  <Phone className="h-4 w-4 shrink-0 text-white/35" aria-hidden />
                  {phone}
                </a>
              ) : null}
            </div>

            <div className="text-center md:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Redes</p>
              {socialItems.length > 0 ? (
                <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                  {socialItems.map(({ key, href, label, Icon }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={label}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-all hover:border-white/25 hover:bg-white/10 hover:text-white"
                      style={{ boxShadow: `0 0 24px -8px rgba(${rgb}, 0.35)` }}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                      <span className="sr-only">{label}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-white/35">Adicione links nas redes na edição da proposta.</p>
              )}
            </div>
          </div>
        </div>
      </footer>
    </section>
  )
}
