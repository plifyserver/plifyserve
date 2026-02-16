'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { TemplateStructure, ProposalPlan } from '@/types'
import { COLOR_PALETTES } from '@/types'

interface ProposalTemplate3DProps {
  content: TemplateStructure
  confirmButtonText: string
  colorPalette: string
  onConfirm?: () => void
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

export function ProposalTemplate3D({
  content,
  confirmButtonText,
  colorPalette,
  onConfirm,
  isViewMode = false,
}: ProposalTemplate3DProps) {
  const palette = COLOR_PALETTES.find((p) => p.id === colorPalette) || COLOR_PALETTES[0]
  const [primary, accent] = palette.colors
  const [carouselIndex, setCarouselIndex] = useState(0)
  const gallery = content.gallery?.filter(Boolean) || []

  const emails = (content.companyEmails?.length ? content.companyEmails : content.companyEmail ? [content.companyEmail] : []) as string[]
  const welcomeName = content.clientesGerais ? '' : (content.clientName || '').trim()
  const pricingMode = content.pricingMode || (content.plans?.length ? 'plans' : 'single')
  const plans = (content.plans || []) as ProposalPlan[]

  useEffect(() => {
    if (gallery.length <= 1) return
    const t = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % gallery.length)
    }, 4000)
    return () => clearInterval(t)
  }, [gallery.length])

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Botão flutuante: Aceitar proposta */}
      {!isViewMode && onConfirm && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-4 rounded-xl font-semibold text-lg text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{
              backgroundColor: primary,
              boxShadow: `0 8px 24px ${primary}50`,
            }}
          >
            {confirmButtonText}
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* 1. Bem-vindo */}
        <section className="px-4 pt-10 pb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {welcomeName ? (
              <>Bem-vindo, {welcomeName}!</>
            ) : (
              <>Bem-vindo!</>
            )}
          </h1>
          <p className="mt-2 text-gray-500">Confira nossa proposta abaixo.</p>
        </section>

        {/* 2. Rolo de fotos (carousel) */}
        {gallery.length > 0 && (
          <section className="w-full overflow-hidden mb-8">
            <div className="relative w-full aspect-[2/1] sm:aspect-[3/1] bg-gray-200">
              {gallery.map((url, i) => (
                <div
                  key={url}
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{
                    opacity: i === carouselIndex ? 1 : 0,
                    zIndex: i === carouselIndex ? 1 : 0,
                  }}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              ))}
              {gallery.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === carouselIndex ? 'bg-white scale-125' : 'bg-white/50'
                      }`}
                      onClick={() => setCarouselIndex(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 3. Cabeçalho: logo, empresa, contato, data */}
        <section className="px-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            {content.companyLogo ? (
              <Image
                src={content.companyLogo}
                alt={content.companyName || 'Logo'}
                width={80}
                height={80}
                className="mx-auto object-contain rounded-xl mb-4"
              />
            ) : (
              <div
                className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-2xl font-bold text-white mb-4"
                style={{ backgroundColor: accent }}
              >
                {content.companyName?.charAt(0) || '?'}
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900">{content.companyName}</h2>
            {content.proposalDate && (
              <p className="text-sm text-gray-500 mt-1">Proposta de {formatDate(content.proposalDate)}</p>
            )}
            {content.companyPhone && (
              <p className="text-gray-600 mt-2">{content.companyPhone}</p>
            )}
            {emails.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {emails.map((e, i) => (
                  <a key={i} href={`mailto:${e}`} className="text-sm text-gray-600 hover:underline">
                    {e}
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 4. Descrição do produto + foto */}
        {(content.productDescription || content.serviceDescription || content.productPhotoUrl) && (
          <section className="px-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">O que oferecemos</h2>
                <div className="flex flex-col sm:flex-row gap-6">
                  {content.productPhotoUrl && (
                    <div className="relative w-full sm:w-64 h-48 sm:h-52 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <Image
                        src={content.productPhotoUrl}
                        alt="Produto"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line flex-1">
                    {content.productDescription || content.serviceDescription || '—'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. Rolagem de texto (marquee) */}
        {content.marqueeText && (
          <section className="mb-8 overflow-hidden border-y border-gray-200 bg-white/80 py-3">
            <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
              {[1, 2, 3, 4].map((dup) => (
                <span key={dup} className="flex items-center gap-8 shrink-0">
                  <span
                    className="text-sm font-medium px-4 py-2 rounded-full"
                    style={{ backgroundColor: `${accent}20`, color: primary }}
                  >
                    {content.marqueeText}
                  </span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 6. Preços: único ou planos */}
        <section className="px-4 mb-8">
          {pricingMode === 'plans' && plans.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 text-center mb-6">Planos e investimento</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.slice(0, 6).map((plan, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border-2 p-6"
                    style={{ borderColor: i === 0 ? accent : undefined }}
                  >
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-2xl font-bold mt-2" style={{ color: accent }}>
                      R$ {formatCurrency(plan.price)}
                    </p>
                    {plan.includes?.length > 0 && (
                      <ul className="mt-4 space-y-1 text-sm text-gray-600">
                        {plan.includes.map((inc, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: accent }} />
                            {inc}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            (content.value != null && content.value > 0) || (content.includes?.length ?? 0) > 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{
                  backgroundColor: `${accent}12`,
                  border: `1px solid ${accent}30`,
                }}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Valor do pacote</h2>
                {content.value != null && content.value > 0 && (
                  <p className="text-3xl font-bold" style={{ color: primary }}>
                    R$ {formatCurrency(content.value)}
                  </p>
                )}
                {((content.singleIncludes && content.singleIncludes.length > 0) || (content.includes && content.includes.length > 0)) && (
                  <ul className="mt-6 text-left max-w-md mx-auto space-y-2 text-gray-700">
                    {(content.singleIncludes || content.includes || []).map((item, i) => (
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
          <section className="px-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Por que me escolher?</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{content.whyChooseMe}</p>
            </div>
          </section>
        )}

        {/* 8. Contato e CTA */}
        <section className="px-4 mb-12">
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: `linear-gradient(135deg, ${accent}18, ${primary}12)`,
              border: `1px solid ${accent}30`,
            }}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">Entre em contato</h2>
            {emails.length > 0 && (
              <p className="text-gray-700">
                E-mail: {emails.map((e, i) => (
                  <a key={i} href={`mailto:${e}`} className="font-medium underline" style={{ color: primary }}>
                    {e}
                  </a>
                )).reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, ', ', el]), [])}
              </p>
            )}
            {content.companyPhone && (
              <p className="text-gray-700 mt-1">Telefone: {content.companyPhone}</p>
            )}
            {content.contactCta && (
              <p className="mt-4 text-lg font-medium text-gray-900">{content.contactCta}</p>
            )}
          </div>
        </section>
      </div>

      {isViewMode && <div className="h-16" />}
    </div>
  )
}
