'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Target } from 'lucide-react'
import {
  WAKE_QUIZ_DEFAULT_QUIZ_ACCENT,
  WAKE_QUIZ_DEFAULT_QUIZ_BG_TINT,
  buildAccentGradient,
  buildQuizQuestionPageBackground,
  coerceHexColor,
  hexToRgba,
  mixHex,
} from '@/lib/wakeQuizThemeColors'
import { badgeFontStack, WAKE_QUIZ_HERO_DEFAULTS } from '@/lib/wakeQuizHero'
import { typographyToStyle } from '@/lib/wakeQuizTypography'

function splitStyleNoColor(style) {
  if (!style || typeof style !== 'object') return {}
  const { color: _c, ...rest } = style
  return rest
}

/**
 * @param {object} props
 * @param {() => void} props.onStart
 * @param {import('@/lib/wakeQuizHero').WakeQuizHeroContent} [props.content]
 * @param {string | null | undefined} props.logoUrl
 * @param {boolean} [props.editMode] — dashboard: clique para editar cada bloco
 * @param {(s: import('@/lib/wakeQuizHero').WakeQuizHeroEditSection) => void} [props.onEditSection]
 * @param {boolean} [props.layoutEmbedded] — dentro do dashboard: altura ≈ vista útil, hero mais centrada
 */
function EditableBlock({ children, editMode, onEdit, className = '' }) {
  if (!editMode) return children
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onEdit?.()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit?.()
        }
      }}
      className={`group relative cursor-pointer rounded-2xl outline-none ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 z-[4] rounded-2xl ring-2 ring-transparent transition-shadow group-hover:ring-orange-400/65 group-focus-visible:ring-orange-500" />
      {children}
    </div>
  )
}

export default function QuizHero({
  onStart,
  content = WAKE_QUIZ_HERO_DEFAULTS,
  logoUrl,
  editMode,
  onEditSection,
  layoutEmbedded = false,
}) {
  const c = content
  const pillars = Array.isArray(c.pillars) && c.pillars.length === 3 ? c.pillars : WAKE_QUIZ_HERO_DEFAULTS.pillars

  const bgTint = coerceHexColor(c.quizScreenBgTint, WAKE_QUIZ_DEFAULT_QUIZ_BG_TINT)
  const accent = coerceHexColor(c.quizAccentColor, WAKE_QUIZ_DEFAULT_QUIZ_ACCENT)
  const pageBg = buildQuizQuestionPageBackground(bgTint)
  const accentGrad = buildAccentGradient(accent)
  const pillBg = hexToRgba(accent, 0.11)
  const pillBorder = hexToRgba(accent, 0.22)
  const taglineMuted = hexToRgba(accent, 0.72)
  const hintLink = mixHex(accent, '#0f172a', 0.38)

  const logoImgMaxH = Math.min(
    280,
    Math.max(
      40,
      typeof c.logoImageMaxHeightPx === 'number' && !Number.isNaN(c.logoImageMaxHeightPx)
        ? c.logoImageMaxHeightPx
        : (WAKE_QUIZ_HERO_DEFAULTS.logoImageMaxHeightPx ?? 88)
    )
  )

  const badgeStyle = {
    fontFamily: badgeFontStack(c.badgeFontKey),
    fontSize: typeof c.badgeFontSizePx === 'number' ? `${c.badgeFontSizePx}px` : '14px',
    fontWeight: c.badgeBold ? 700 : 500,
    fontStyle: c.badgeItalic ? 'italic' : 'normal',
    textDecoration: c.badgeUnderline ? 'underline' : 'none',
    color: c.badgeTextColor || accent,
  }

  const open = (section) => {
    if (editMode && onEditSection) onEditSection(section)
  }

  const minH =
    layoutEmbedded ?
      'min-h-[calc(100dvh-clamp(9.5rem,24vh,16.5rem))] min-h-[calc(100vh-clamp(9.5rem,24vh,16.5rem))]'
    : 'min-h-dvh min-h-[100vh]'

  return (
    <div
      className={`relative box-border flex w-full flex-col items-center justify-center overflow-hidden px-6 pt-[max(3.25rem,calc(env(safe-area-inset-top,0px)+2.75rem))] pb-[max(3.25rem,calc(env(safe-area-inset-bottom,0px)+2.75rem))] sm:pt-16 sm:pb-16 md:pt-[4.75rem] md:pb-[4.75rem] ${minH} ${editMode ? '!pb-28 md:!pb-36' : ''}`}
      style={{
        background: pageBg,
      }}
    >
      {editMode ? (
        <div className="absolute bottom-3 left-0 right-0 z-[3] mx-auto max-w-md space-y-2 px-4 text-center">
          <p className="text-[11px] text-slate-500">
            Toque nos blocos para editar. No botão principal: clique para editar o texto; use o botão abaixo
            para iniciar o quiz.
          </p>
          <button
            type="button"
            onClick={() => open('quiz_theme')}
            className="text-[11px] font-semibold underline underline-offset-2 hover:opacity-90"
            style={{ color: hintLink }}
          >
            Personalizar cores do quiz
          </button>
        </div>
      ) : null}

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 sm:mb-10"
        >
          <motion.div className="inline-flex flex-col items-center gap-1">
            <EditableBlock editMode={editMode} onEdit={() => open('logo')} className="px-2 py-1 -mx-2">
              <div className="relative flex flex-col items-center gap-2">
                {logoUrl ? (
                  <>
                    <div
                      className="mx-auto flex w-[min(360px,92vw)] items-center justify-center"
                      style={{ maxHeight: `${logoImgMaxH}px` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt={c.logoText || 'Logo'}
                        className={`w-auto max-w-full object-contain ${editMode ? 'cursor-pointer' : ''}`}
                        style={{ maxHeight: `${logoImgMaxH}px` }}
                      />
                    </div>
                    {editMode ? (
                      <p className="text-[11px] font-medium" style={{ color: mixHex(accent, '#0f172a', 0.32) }}>
                        Clique na imagem para tamanho e ficheiro
                      </p>
                    ) : null}
                  </>
                ) : (
                  <div className="relative">
                    <span
                      className="font-grotesk font-black tracking-tight leading-none select-none block"
                      style={(() => {
                        const t = typographyToStyle(c.logoTextTypography)
                        const fs = t.fontSize || 'clamp(2.375rem, 5.25vmin, 2.875rem)'
                        if (c.logoTextTypography?.color) {
                          return { ...t, fontSize: fs }
                        }
                        return {
                          ...splitStyleNoColor(t),
                          fontSize: fs,
                          background: accentGrad,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          filter: `drop-shadow(0 2px 8px ${hexToRgba(accent, 0.35)})`,
                        }
                      })()}
                    >
                      {c.logoText || 'SILVA YARIN'}
                    </span>
                    <div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 opacity-60"
                      style={{
                        background: `linear-gradient(to right, transparent, ${hexToRgba(accent, 0.55)}, transparent)`,
                      }}
                    />
                  </div>
                )}
                {(c.tagline || '').trim() ? (
                  <span
                    className="text-[10px] font-semibold tracking-[0.25em] uppercase mt-1"
                    style={{
                      ...typographyToStyle(c.taglineTypography),
                      ...(!c.taglineTypography?.color ? { color: taglineMuted } : {}),
                    }}
                  >
                    {c.tagline}
                  </span>
                ) : null}
              </div>
            </EditableBlock>
          </motion.div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 flex justify-center"
        >
          <EditableBlock editMode={editMode} onEdit={() => open('badge')}>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full max-w-[95vw] flex-wrap justify-center"
              style={{ background: pillBg, borderWidth: 1, borderStyle: 'solid', borderColor: pillBorder }}
            >
              <span className="text-lg leading-none shrink-0 select-none" aria-hidden>
                {c.badgeIcon ?? '⚡'}
              </span>
              <span className="font-medium text-left" style={badgeStyle}>
                {c.badgeText ?? 'Quiz Exclusivo para Salões • 2 min'}
              </span>
            </div>
          </EditableBlock>
        </motion.div>

        {/* Title */}
        <EditableBlock editMode={editMode} onEdit={() => open('title')}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="text-4xl md:text-5xl font-grotesk font-bold text-foreground leading-tight mb-4"
          >
            <span style={typographyToStyle(c.titleLine1Typography)}>{c.titleLine1 ?? 'Descubra como'}</span>
            <br />
            <span
              style={(() => {
                const t = typographyToStyle(c.titleLine2Typography)
                if (c.titleLine2Typography?.color) return t
                return {
                  ...splitStyleNoColor(t),
                  background: accentGrad,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }
              })()}
            >
              {c.titleLine2 ?? 'lotar sua agenda'}
            </span>
          </motion.h1>
        </EditableBlock>

        <EditableBlock editMode={editMode} onEdit={() => open('subtitle')}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-muted-foreground text-base md:text-lg mb-10 max-w-sm mx-auto leading-relaxed"
            style={typographyToStyle(c.subtitleTypography)}
          >
            {c.subtitle ??
              'Responda em 2 minutos e receba uma estratégia personalizada de marketing para o seu salão de beleza.'}
          </motion.p>
        </EditableBlock>

        {/* Pillars */}
        <div className="relative mb-10">
          <EditableBlock editMode={editMode} onEdit={() => open('pillars')}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.55 }}
              className="flex justify-center gap-6 flex-wrap"
            >
              {pillars.map((item, i) => (
                <div
                  key={`${item.label}-${i}`}
                  className={`wake-quiz-pillar-float wake-quiz-pillar-float--${i} flex flex-col items-center gap-1.5`}
                >
                  <div
                    className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl"
                    style={{
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: hexToRgba(accent, 0.18),
                      boxShadow: `0 10px 25px -5px ${hexToRgba(accent, 0.15)}`,
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    className="text-[10px] font-medium text-muted-foreground"
                    style={typographyToStyle(c.pillarLabelsTypography)}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </EditableBlock>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="space-y-2"
        >
          <EditableBlock editMode={editMode} onEdit={() => open('cta')}>
            <motion.button
              type="button"
              onClick={(e) => {
                if (editMode) {
                  e.preventDefault()
                  e.stopPropagation()
                  open('cta')
                } else {
                  onStart()
                }
              }}
              whileHover={editMode ? {} : { scale: 1.04, y: -2 }}
              whileTap={editMode ? {} : { scale: 0.97 }}
              className="relative group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold text-lg shadow-xl transition-shadow duration-300 max-w-full"
              style={{
                background: accentGrad,
                boxShadow: `0 8px 32px ${hexToRgba(accent, 0.35)}`,
              }}
            >
              <span
                className="text-left"
                style={{
                  ...typographyToStyle(c.ctaTypography),
                  color: c.ctaTypography?.color ?? 'white',
                }}
              >
                {c.ctaLabel ?? 'Quero ter previsibilidade no salão'}
              </span>
              <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </EditableBlock>
          {editMode ? (
            <button
              type="button"
              onClick={onStart}
              className="w-full rounded-xl border-2 border-dashed bg-white/80 py-2.5 text-sm font-semibold transition-colors hover:bg-white"
              style={{
                borderColor: hexToRgba(accent, 0.45),
                color: mixHex(accent, '#0f172a', 0.45),
              }}
            >
              Iniciar quiz (pré-visualização)
            </button>
          ) : null}
        </motion.div>

        {/* Trust */}
        <EditableBlock editMode={editMode} onEdit={() => open('footer')}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap px-2 pb-8"
          >
            {(c.footerIcon || '').trim() ? (
              <span className="text-base leading-none" aria-hidden>
                {c.footerIcon}
              </span>
            ) : (
              <Target className="w-3.5 h-3.5 shrink-0" style={{ color: hexToRgba(accent, 0.55) }} />
            )}
            <span style={typographyToStyle(c.footerTypography)}>
              {c.footerText ?? '+150 salões já transformados pela Wake'}
            </span>
          </motion.div>
        </EditableBlock>
      </div>
    </div>
  )
}
