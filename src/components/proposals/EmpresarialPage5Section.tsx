'use client'

import type { LucideIcon } from 'lucide-react'
import {
  ArrowUp,
  Dribbble,
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Palette,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react'
import type { EmpresarialPage5Platform, EmpresarialSiteMode } from '@/types/empresarialProposal'
import { mergeEmpresarialPage5 } from '@/types/empresarialProposal'
import { getEmpresarialSiteVisual } from '@/lib/empresarialSiteTheme'
import {
  mailtoHref,
  normalizeExternalUrl,
  telHref,
  whatsappHref,
  digitsOnly,
} from '@/lib/empresarialContactLinks'
import { cn } from '@/lib/utils'

const PLATFORM_LABELS: Record<EmpresarialPage5Platform, string> = {
  instagram: 'Instagram',
  x: 'X',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  github: 'GitHub',
  behance: 'Behance',
  dribbble: 'Dribbble',
  website: 'Site',
}

const PLATFORM_ICONS: Record<EmpresarialPage5Platform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
  dribbble: Dribbble,
  x: Twitter,
  tiktok: Music,
  behance: Palette,
  website: Globe,
}

interface EmpresarialPage5SectionProps {
  siteMode: EmpresarialSiteMode
  raw: unknown
  companyName: string
  companyLogo: string | null
  accentColor?: string
  onBack: () => void
  /** Quando true: bloco no final da landing (sem barra “voltar” nem altura mínima de tela cheia) */
  embedded?: boolean
}

export function EmpresarialPage5Section({
  siteMode,
  raw,
  companyName,
  companyLogo,
  accentColor = '#f97316',
  onBack,
  embedded = false,
}: EmpresarialPage5SectionProps) {
  const p5 = mergeEmpresarialPage5(raw)
  const ev = getEmpresarialSiteVisual(siteMode)
  const t = ev.p5
  const L = ev.isLight
  const addressLines = p5.address.split('\n').map((l) => l.trim()).filter(Boolean)

  const emailOk = p5.email.trim().length > 0
  const phoneOk = p5.phone.trim().length > 0
  const waOk = digitsOnly(p5.whatsapp).length > 0

  const year = new Date().getFullYear()
  const copyright =
    p5.copyrightText.trim() ||
    (companyName.trim()
      ? `© ${year} ${companyName.trim()}. Todos os direitos reservados.`
      : `© ${year}. Todos os direitos reservados.`)

  return (
    <section
      className={cn(
        embedded
          ? L
            ? 'flex flex-col border-t border-slate-200 bg-neutral-100 text-slate-900'
            : 'flex flex-col border-t border-white/10 bg-[#121212] text-white'
          : t.section
      )}
    >
      {!embedded && (
        <div className={cn('px-4 py-6 md:px-10 md:py-8', t.topBar)}>
          <button type="button" onClick={onBack} className={t.backBtn}>
            ← Voltar ao início
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col px-4 py-10 md:px-10 md:py-14">
        <div className="mx-auto w-full max-w-6xl flex-1">
          <div
            className={cn(
              'mb-12 flex flex-col gap-6 border-b pb-12 md:mb-14 md:pb-14 lg:flex-row lg:items-start lg:justify-between',
              t.brandBorder
            )}
          >
            <div className="max-w-md">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName || 'Logo'}
                  className="mb-5 h-10 w-auto max-w-[200px] object-contain object-left md:h-11"
                />
              ) : (
                <p className={cn('mb-5 text-lg font-semibold uppercase tracking-wide', t.logoFallback)}>
                  {companyName || 'Sua empresa'}
                </p>
              )}
              {p5.tagline.trim() ? (
                <p className={cn('text-sm font-light leading-relaxed', t.tagline)}>{p5.tagline.trim()}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-12 md:gap-14 lg:grid-cols-3 lg:gap-10">
            <div className="space-y-6">
              <h3 className={cn('text-xs font-bold uppercase tracking-[0.2em]', t.colTitle)}>Contato</h3>
              <ul className="space-y-5 text-sm">
                {emailOk ? (
                  <li>
                    <a
                      href={mailtoHref(p5.email)}
                      className={cn('group flex items-start gap-3 transition-colors', t.contactLink)}
                    >
                      <Mail
                        className={cn('mt-0.5 h-4 w-4 shrink-0', t.contactIcon)}
                      />
                      <span className="break-all font-medium uppercase tracking-wide underline-offset-2 group-hover:underline">
                        {p5.email.trim()}
                      </span>
                    </a>
                  </li>
                ) : null}
                {phoneOk ? (
                  <li>
                    <a
                      href={telHref(p5.phone)}
                      className={cn('group flex items-start gap-3 transition-colors', t.contactLink)}
                    >
                      <Phone className={cn('mt-0.5 h-4 w-4 shrink-0', t.contactIcon)} />
                      <span className="font-medium tracking-wide underline-offset-2 group-hover:underline">
                        {p5.phone.trim()}
                      </span>
                    </a>
                  </li>
                ) : null}
                {waOk ? (
                  <li>
                    <a
                      href={whatsappHref(p5.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('group flex items-start gap-3 transition-colors', t.contactLink)}
                    >
                      <MessageCircle className={cn('mt-0.5 h-4 w-4 shrink-0', t.contactIcon)} />
                      <span className="font-medium tracking-wide underline-offset-2 group-hover:underline">
                        WhatsApp
                      </span>
                    </a>
                  </li>
                ) : null}
                {!emailOk && !phoneOk && !waOk ? (
                  <li className={cn('text-sm', t.empty)}>Configure e-mail, telefone ou WhatsApp no editor.</li>
                ) : null}
              </ul>
            </div>

            <div className="space-y-6 lg:text-center">
              <h3
                className={cn(
                  'text-xs font-bold uppercase tracking-[0.2em] lg:mx-auto lg:max-w-xs',
                  t.colTitle
                )}
              >
                Endereço
              </h3>
              {addressLines.length > 0 ? (
                <div className="flex gap-3 lg:mx-auto lg:max-w-sm lg:flex-col lg:items-center lg:gap-2">
                  <MapPin className={cn('mt-0.5 h-4 w-4 shrink-0 lg:mx-auto', t.addressIcon)} />
                  <address className="not-italic">
                    <ul className={cn('space-y-1 text-sm font-light leading-relaxed', t.addressText)}>
                      {addressLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </address>
                </div>
              ) : (
                <p className={cn('text-sm lg:mx-auto lg:max-w-xs', t.empty)}>Nenhum endereço informado.</p>
              )}
            </div>

            <div className="space-y-6 lg:text-right">
              <h3 className={cn('text-xs font-bold uppercase tracking-[0.2em]', t.colTitle)}>Redes sociais</h3>
              {p5.socialLinks.length > 0 ? (
                <ul className="flex flex-col gap-3 lg:items-end">
                  {p5.socialLinks.map((link) => {
                    const href = normalizeExternalUrl(link.url)
                    if (!href) return null
                    const Icon = PLATFORM_ICONS[link.platform]
                    const label = PLATFORM_LABELS[link.platform]
                    return (
                      <li key={link.id}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.12em] transition-colors',
                            t.socialLink
                          )}
                        >
                          <Icon className={cn('h-4 w-4 shrink-0', t.socialIcon)} />
                          <span className="underline-offset-2 group-hover:underline">{label}</span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className={cn('text-sm lg:ml-auto lg:max-w-xs', t.empty)}>Adicione links no editor.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={cn('mt-auto border-t px-4 py-5 md:px-10', t.bottomBar)}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p
            className={cn(
              'text-center text-[10px] font-medium uppercase tracking-[0.18em] sm:text-left',
              t.copyright
            )}
          >
            {copyright}
          </p>
          {embedded ? (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={t.topBtn}
              style={{ boxShadow: `0 0 0 1px ${accentColor}33` }}
              aria-label="Voltar ao topo"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className={t.topBtn}
              style={{ boxShadow: `0 0 0 1px ${accentColor}33` }}
              aria-label="Voltar ao início"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
