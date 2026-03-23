'use client'

import type { LucideIcon } from 'lucide-react'
import {
  Dribbble,
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  Palette,
  Phone,
  Twitter,
  Youtube,
  Music,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CleanPage5 } from '@/types/cleanProposal'
import type { EmpresarialPage5Platform } from '@/types/empresarialProposal'
import { mailtoHref, normalizeExternalUrl, telHref } from '@/lib/empresarialContactLinks'

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

type CompanyContact = {
  name: string
  email: string
  phone: string
  address: string
}

type Props = {
  id?: string
  page: CleanPage5
  company: CompanyContact
}

function ContactDot() {
  return (
    <span
      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.75)]"
      aria-hidden
    />
  )
}

export function CleanPage5Section({ id = 'clean-contato', page, company }: Props) {
  const brandName = company.name.trim() || 'Sua empresa'
  const email = company.email.trim()
  const phone = company.phone.trim()
  const addressLines = company.address.split('\n').map((l) => l.trim()).filter(Boolean)

  const validSocials = page.socialLinks.filter((l) => normalizeExternalUrl(l.url))

  return (
    <footer id={id} className="w-full bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20 lg:items-start">
          <div className="max-w-xl">
            <h2 className="whitespace-pre-wrap text-[clamp(1.75rem,4.2vw,3rem)] font-bold leading-[1.12] tracking-tight text-white">
              {page.headline}
            </h2>
            {validSocials.length > 0 ? (
              <ul className="mt-10 flex flex-wrap gap-3" aria-label="Redes sociais">
                {validSocials.map((link) => {
                  const href = normalizeExternalUrl(link.url)
                  const Icon = PLATFORM_ICONS[link.platform]
                  return (
                    <li key={link.id}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/90 transition-colors hover:border-white/25 hover:bg-white/10"
                      >
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                        <span className="sr-only">{link.platform}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-10 text-sm text-white/40">Adicione redes na página 5 do editor (opcional).</p>
            )}
          </div>

          <div className="lg:pt-1">
            <div className="flex items-start gap-2.5">
              <ContactDot />
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">Contato</h3>
            </div>
            <div className="mt-8 space-y-5 text-sm leading-relaxed text-white/85 sm:text-base">
              {email ? (
                <a href={mailtoHref(email)} className="block transition-colors hover:text-white">
                  {email}
                </a>
              ) : null}
              {phone ? (
                <a href={telHref(phone)} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                  <Phone className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
                  {phone}
                </a>
              ) : null}
              {addressLines.length > 0 ? (
                <p className="inline-flex items-start gap-2 text-white/80">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/45" aria-hidden />
                  <span>
                    {addressLines.map((line, i) => (
                      <span key={i}>
                        {i > 0 ? <br /> : null}
                        {line}
                      </span>
                    ))}
                  </span>
                </p>
              ) : null}
              {!email && !phone && addressLines.length === 0 ? (
                <p className="text-white/45">Preencha e-mail, telefone ou morada na secção Empresa do editor.</p>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className={cn(
            'mt-20 border-t border-white/10 pt-14 sm:mt-28 sm:pt-20 lg:mt-32 lg:pt-24',
            'select-none'
          )}
        >
          <p
            className="w-full break-words text-left font-bold uppercase leading-[0.88] tracking-[-0.02em] text-white"
            style={{ fontSize: 'clamp(2.25rem, 11vw, 6.5rem)' }}
          >
            {brandName}
          </p>
        </div>
      </div>
    </footer>
  )
}
