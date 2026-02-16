'use client'

import Image from 'next/image'
import type { TemplateStructure, ProposalPlan } from '@/types'
import { COLOR_PALETTES } from '@/types'

interface ProposalTemplate3DProps {
  content: TemplateStructure
  confirmButtonText: string
  colorPalette: string
  /** Chamado ao aceitar: sem arg = valor único; com arg = plano selecionado */
  onConfirm?: (selectedPlan?: ProposalPlan) => void
  isViewMode?: boolean
}

function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

const iconSize = 20
const SocialIcons = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" width={iconSize} height={iconSize} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" width={iconSize} height={iconSize} aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" width={iconSize} height={iconSize} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="currentColor" width={iconSize} height={iconSize} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  website: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={iconSize} height={iconSize} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  ),
}

export function ProposalTemplate3D({
  content,
  confirmButtonText,
  colorPalette,
  onConfirm,
  isViewMode = false,
}: ProposalTemplate3DProps) {
  const palette = COLOR_PALETTES.find((p) => p.id === colorPalette) || COLOR_PALETTES[0]
  const [primary, accent, light] = palette.colors
  const pageBg = `linear-gradient(180deg, ${light} 0%, ${accent}18 35%, ${accent}0a 70%, ${light} 100%)`
  const cardBg = `linear-gradient(145deg, ${light} 0%, ${accent}08 100%)`
  const cardBorder = `${accent}30`
  const gallery = content.gallery?.filter(Boolean) || []

  const emails = ((content.companyEmails?.length ? content.companyEmails : content.companyEmail ? [content.companyEmail] : []) as string[]).filter(Boolean)
  const phones = ((content.companyPhones?.length ? content.companyPhones : content.companyPhone ? [content.companyPhone] : []) as string[]).filter(Boolean)
  const social = content.socialLinks || {}
  const welcomeName = content.clientesGerais ? '' : (content.clientName || '').trim()
  const pricingMode = content.pricingMode || (content.plans?.length ? 'plans' : 'single')
  const plans = (content.plans || []) as ProposalPlan[]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: pageBg }}>
      {/* Cabeçalho tipo site */}
      <header
        className="sticky top-0 z-40 w-full border-b shrink-0"
        style={{ background: cardBg, borderColor: cardBorder }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3 min-w-0">
              {content.companyLogo ? (
                <Image
                  src={content.companyLogo}
                  alt=""
                  width={40}
                  height={40}
                  className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-lg"
                />
              ) : (
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: accent }}
                >
                  {content.companyName?.charAt(0) || '?'}
                </div>
              )}
              <span className="font-semibold truncate text-base sm:text-lg" style={{ color: primary }}>
                {content.companyName}
              </span>
            </div>
            <span className="text-xs sm:text-sm opacity-75 shrink-0" style={{ color: primary }}>
              Proposta
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-8 sm:pb-10 overflow-x-hidden">
        {/* 1. Bem-vindo */}
        <section className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: primary }}>
            {welcomeName ? (
              <>Bem-vindo, {welcomeName}!</>
            ) : (
              <>Bem-vindo!</>
            )}
          </h1>
          <p className="mt-2 text-sm sm:text-base opacity-80" style={{ color: primary }}>Confira nossa proposta abaixo.</p>
        </section>

        {/* 2. Card empresa: logo, contato, data */}
        <section className="mb-6 sm:mb-8">
          <div className="rounded-xl sm:rounded-2xl shadow-lg border p-4 sm:p-6 text-center" style={{ background: cardBg, borderColor: cardBorder }}>
            {content.companyLogo ? (
              <Image
                src={content.companyLogo}
                alt={content.companyName || 'Logo'}
                width={96}
                height={96}
                className="mx-auto object-contain rounded-xl mb-4 w-20 h-20 sm:w-24 sm:h-24"
              />
            ) : (
              <div
                className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-2xl font-bold text-white mb-4"
                style={{ backgroundColor: accent }}
              >
                {content.companyName?.charAt(0) || '?'}
              </div>
            )}
            <h2 className="text-xl font-bold" style={{ color: primary }}>{content.companyName}</h2>
            {content.proposalDate && (
              <p className="text-sm mt-1 opacity-75" style={{ color: primary }}>Proposta de {formatDate(content.proposalDate)}</p>
            )}
            {phones.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {phones.map((p, i) => (
                  <a key={i} href={`tel:${p.replace(/\D/g, '')}`} className="text-sm hover:underline" style={{ color: accent }}>
                    {p}
                  </a>
                ))}
              </div>
            )}
            {emails.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {emails.map((e, i) => (
                  <a key={i} href={`mailto:${e}`} className="text-sm hover:underline" style={{ color: accent }}>
                    {e}
                  </a>
                ))}
              </div>
            )}
            {(content.companyWebsite || social.instagram || social.facebook || social.tiktok || social.x) && (
              <div className="mt-4 flex justify-center flex-wrap gap-3">
                {content.companyWebsite && (
                  <a
                    href={content.companyWebsite.startsWith('http') ? content.companyWebsite : `https://${content.companyWebsite}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white"
                    style={{ backgroundColor: accent }}
                    aria-label="Site da empresa"
                  >
                    {SocialIcons.website}
                  </a>
                )}
                {social.instagram && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white"
                    style={{ background: 'radial-gradient(circle at 30% 30%, #feda77, #dd2a7b 40%, #8134af 70%, #515bd4)' }}
                    aria-label="Instagram"
                  >
                    {SocialIcons.instagram}
                  </a>
                )}
                {social.facebook && (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white"
                    style={{ backgroundColor: '#1877f2' }}
                    aria-label="Facebook"
                  >
                    {SocialIcons.facebook}
                  </a>
                )}
                {social.tiktok && (
                  <a
                    href={social.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white"
                    style={{ backgroundColor: '#000000' }}
                    aria-label="TikTok"
                  >
                    {SocialIcons.tiktok}
                  </a>
                )}
                {social.x && (
                  <a
                    href={social.x}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white"
                    style={{ backgroundColor: '#000000' }}
                    aria-label="X"
                  >
                    {SocialIcons.x}
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 3. Rolo de fotos (esteira – passa como marquee) */}
        {gallery.length > 0 && (
          <section className="w-full overflow-hidden mb-6 sm:mb-8 rounded-xl" style={{ backgroundColor: `${accent}18` }}>
            <div className="h-48 sm:h-56 overflow-hidden">
              <div className="flex h-full items-stretch gap-3 animate-marquee-gallery w-max">
                {[1, 2].map((blockId) => (
                  <div key={blockId} className="flex h-full items-center gap-3 shrink-0">
                    {gallery.map((url, i) => (
                      <div key={`${blockId}-${url}`} className="relative w-56 sm:w-72 h-full shrink-0 rounded-xl overflow-hidden bg-white/50 flex items-center justify-center">
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-contain"
                          sizes="288px"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. Descrição do produto + foto */}
        {(content.productDescription || content.serviceDescription || content.productPhotoUrl) && (
          <section className="mb-6 sm:mb-8">
            <div className="rounded-xl sm:rounded-2xl shadow-lg border overflow-hidden" style={{ background: cardBg, borderColor: cardBorder }}>
              <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-6">
                <h2 className="text-base sm:text-lg font-semibold sm:col-span-2" style={{ color: primary }}>O que oferecemos</h2>
                {content.productPhotoUrl && (
                  <div className="relative w-full sm:w-80 h-56 sm:h-64 rounded-xl overflow-hidden row-start-2">
                    <Image
                      src={content.productPhotoUrl}
                      alt="Produto"
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 100vw, 320px"
                    />
                  </div>
                )}
                <div className={content.productPhotoUrl ? 'sm:row-start-2 min-w-0 sm:pt-4' : 'sm:col-span-2'}>
                  <p className="leading-relaxed whitespace-pre-line opacity-90 m-0" style={{ color: primary }}>
                    {content.productDescription || content.serviceDescription || '—'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. Rolagem de texto (marquee) – até 3 textos, loop contínuo */}
        {(() => {
          const marqueeItems = (content.marqueeTexts?.filter(Boolean).length ? content.marqueeTexts!.filter(Boolean) : content.marqueeText ? [content.marqueeText] : []) as string[]
          if (marqueeItems.length === 0) return null
          const pill = (text: string, key: string) => (
            <span
              key={key}
              className="text-sm font-medium px-5 py-2.5 rounded-full whitespace-nowrap shrink-0"
              style={{ backgroundColor: `${accent}25`, color: primary }}
            >
              {text}
            </span>
          )
          const block = (id: string) => (
            <div key={id} className="flex items-center shrink-0 gap-6">
              {marqueeItems.map((text, i) => pill(text, `${id}-${i}`))}
            </div>
          )
          return (
            <section className="w-full mb-6 sm:mb-8 overflow-hidden py-4 isolate" style={{ contain: 'layout' }} aria-hidden="true">
              <div className="rounded-full border-2 py-3 overflow-hidden" style={{ borderColor: cardBorder, background: `${accent}15` }}>
                <div className="overflow-hidden" style={{ contain: 'layout paint' }}>
                  <div className="flex items-center gap-6 animate-marquee whitespace-nowrap w-max min-w-max">
                    {block('a')}
                    {block('b')}
                  </div>
                </div>
              </div>
            </section>
          )
        })()}

        {/* 5b. Duas fotos entre rolo de texto e planos */}
        {(() => {
          const middle = (content.middlePhotos?.filter(Boolean) || []) as string[]
          if (middle.length === 0) return null
          return (
            <section className="mb-6 sm:mb-8 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {middle.slice(0, 2).map((url, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 flex items-center justify-center" style={{ borderColor: cardBorder, background: cardBg }}>
                    <Image src={url} alt="" fill className="object-contain" sizes="(max-width: 640px) 100vw, 50vw" />
                  </div>
                ))}
              </div>
            </section>
          )
        })()}

        {/* 6. Preços: único ou planos */}
        <section className="mb-6 sm:mb-8">
          {pricingMode === 'plans' && plans.length > 0 ? (
            <div className="space-y-4 flex flex-col items-center w-full">
              <h2 className="text-xl font-bold text-center mb-6" style={{ color: primary }}>Planos e investimento</h2>
              <div className="flex flex-wrap justify-center gap-4 w-full">
                {plans.slice(0, 6).map((plan, i) => (
                  <div
                    key={i}
                    className="rounded-xl border-2 p-4 sm:p-6 w-full sm:w-[280px] lg:w-[300px] flex flex-col"
                    style={{ background: cardBg, borderColor: accent }}
                  >
                    <h3 className="font-bold" style={{ color: primary }}>{plan.name}</h3>
                    <p className="text-2xl font-bold mt-2" style={{ color: accent }}>
                      R$ {formatCurrency(plan.price)}
                    </p>
                    {plan.includes?.filter(Boolean).length > 0 && (
                      <ul className="mt-4 space-y-1 text-sm opacity-90 flex-1" style={{ color: primary }}>
                        {plan.includes.filter(Boolean).map((inc, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: accent }} />
                            {inc}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(onConfirm && !isViewMode) ? (
                      <button
                        type="button"
                        onClick={() => onConfirm(plan)}
                        className="mt-4 w-full px-4 py-3 rounded-xl font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: accent, boxShadow: `0 4px 12px ${primary}30` }}
                      >
                        {content.acceptPlanButtonText || 'Aceitar plano'}
                      </button>
                    ) : (
                      <div
                        className="mt-4 w-full px-4 py-3 rounded-xl font-semibold text-white text-center"
                        style={{ backgroundColor: accent, boxShadow: `0 4px 12px ${primary}30` }}
                      >
                        {content.acceptPlanButtonText || 'Aceitar plano'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            (content.value != null && content.value > 0) || (content.includes?.length ?? 0) > 0 ? (
              <div
                className="rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center max-w-2xl mx-auto"
                style={{
                  background: cardBg,
                  border: `2px solid ${cardBorder}`,
                }}
              >
                <h2 className="text-base sm:text-lg font-semibold mb-2" style={{ color: primary }}>Valor do pacote</h2>
                {content.value != null && content.value > 0 && (
                  <p className="text-3xl font-bold" style={{ color: primary }}>
                    R$ {formatCurrency(content.value)}
                  </p>
                )}
                {((content.singleIncludes && content.singleIncludes.length > 0) || (content.includes && content.includes.length > 0)) && (
                  <ul className="mt-6 text-left max-w-md mx-auto space-y-2 opacity-90" style={{ color: primary }}>
                    {(content.singleIncludes || content.includes || []).filter(Boolean).map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: accent }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null
          )}
        </section>

        {/* 7. Por que me escolher */}
        {content.whyChooseMe && (
          <section className="mb-6 sm:mb-8">
            <div className="rounded-xl sm:rounded-2xl shadow-lg border p-4 sm:p-6 lg:p-8" style={{ background: cardBg, borderColor: cardBorder }}>
              <h2 className="text-base sm:text-lg font-semibold mb-4" style={{ color: primary }}>Por que me escolher?</h2>
              <p className="leading-relaxed whitespace-pre-line opacity-90" style={{ color: primary }}>{content.whyChooseMe}</p>
            </div>
          </section>
        )}

        {/* 7c. CTA (frase chamativa para aceitar) */}
        {content.contactCta && (
          <section className="mb-6 sm:mb-8 text-center">
            <p className="text-lg sm:text-xl font-semibold whitespace-pre-line" style={{ color: primary }}>{content.contactCta}</p>
          </section>
        )}

        {/* 8. Botão Aceitar: valor único = um botão geral; vários planos = botão em cada card (já renderizado acima) */}
        {!(pricingMode === 'plans' && plans.length > 0) && (
          <section className="mb-10 sm:mb-12 flex justify-center">
            {(onConfirm && !isViewMode) ? (
              <button
                type="button"
                onClick={() => onConfirm()}
                className="w-full max-w-md px-6 py-5 rounded-2xl font-semibold text-lg sm:text-xl text-white shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 8px 24px ${primary}40`,
                }}
              >
                {confirmButtonText}
              </button>
            ) : (
              <div
                className="w-full max-w-md px-6 py-5 rounded-2xl font-semibold text-lg sm:text-xl text-white text-center"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 8px 24px ${primary}40`,
                }}
              >
                {confirmButtonText}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Rodapé tipo site */}
      <footer
        className="mt-auto w-full border-t shrink-0"
        style={{ background: primary, color: light, borderColor: `${accent}40` }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {(content.footerLogo ?? content.companyLogo) ? (
                  <Image
                    src={content.footerLogo ?? content.companyLogo!}
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain rounded"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: accent }}
                  >
                    {content.companyName?.charAt(0) || '?'}
                  </div>
                )}
                <span className="font-semibold text-sm sm:text-base">{content.companyName}</span>
              </div>
              <p className="text-sm opacity-90">
                {content.serviceType}
                {content.proposalDate && ` · Proposta de ${formatDate(content.proposalDate)}`}
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 opacity-90">Contato</p>
              <div className="space-y-1.5 text-sm">
                {phones.slice(0, 2).map((p, i) => (
                  <a key={i} href={`tel:${p.replace(/\D/g, '')}`} className="block opacity-90 hover:underline">
                    {p}
                  </a>
                ))}
                {emails.slice(0, 2).map((e, i) => (
                  <a key={i} href={`mailto:${e}`} className="block opacity-90 hover:underline truncate">
                    {e}
                  </a>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <p className="font-semibold text-sm mb-3 opacity-90">Site e redes sociais</p>
              <div className="flex flex-wrap gap-2">
                {content.companyWebsite && (
                  <a href={content.companyWebsite.startsWith('http') ? content.companyWebsite : `https://${content.companyWebsite}`} target="_blank" rel="noreferrer" className="opacity-90 hover:opacity-100 inline-flex items-center justify-center w-8 h-8 rounded-full text-white" style={{ backgroundColor: accent }} aria-label="Site da empresa">
                    {SocialIcons.website}
                  </a>
                )}
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noreferrer" className="opacity-90 hover:opacity-100 inline-flex items-center justify-center w-8 h-8 rounded-full text-white" style={{ background: 'radial-gradient(circle at 30% 30%, #feda77, #dd2a7b 40%, #8134af 70%, #515bd4)' }} aria-label="Instagram">
                    {SocialIcons.instagram}
                  </a>
                )}
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noreferrer" className="opacity-90 hover:opacity-100 inline-flex items-center justify-center w-8 h-8 rounded-full text-white" style={{ backgroundColor: '#1877f2' }} aria-label="Facebook">
                    {SocialIcons.facebook}
                  </a>
                )}
                {social.tiktok && (
                  <a href={social.tiktok} target="_blank" rel="noreferrer" className="opacity-90 hover:opacity-100 inline-flex items-center justify-center w-8 h-8 rounded-full text-white bg-black" aria-label="TikTok">
                    {SocialIcons.tiktok}
                  </a>
                )}
                {social.x && (
                  <a href={social.x} target="_blank" rel="noreferrer" className="opacity-90 hover:opacity-100 inline-flex items-center justify-center w-8 h-8 rounded-full text-white bg-black" aria-label="X">
                    {SocialIcons.x}
                  </a>
                )}
                {!content.companyWebsite && !social.instagram && !social.facebook && !social.tiktok && !social.x && (
                  <span className="text-sm opacity-70">—</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t text-center text-xs sm:text-sm opacity-80" style={{ borderColor: `${accent}30` }}>
            © {new Date().getFullYear()} {content.companyName}. Proposta gerada por Plify.
          </div>
        </div>
      </footer>

      {isViewMode && <div className="h-12" />}
    </div>
  )
}
