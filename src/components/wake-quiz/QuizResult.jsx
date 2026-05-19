import { useState, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, MessageCircle } from 'lucide-react'
import {
  WAKE_QUIZ_DEFAULT_QUIZ_ACCENT,
  WAKE_QUIZ_DEFAULT_QUIZ_BG_TINT,
  buildAccentGradient,
  buildQuizQuestionPageBackground,
  coerceHexColor,
  hexToRgba,
  mixHex,
} from '@/lib/wakeQuizThemeColors'
import { typographyToStyle } from '@/lib/wakeQuizTypography'

function splitStyleNoColor(style) {
  if (!style || typeof style !== 'object') return {}
  const { color: _c, ...rest } = style
  return rest
}

function logoHeaderTextStyle(typography, gradient) {
  const t = typographyToStyle(typography)
  const fs = t.fontSize ?? '1.1rem'
  if (typography?.color) return { ...t, fontSize: fs }
  return {
    ...splitStyleNoColor(t),
    fontSize: fs,
    background: gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }
}

function taglineHeaderStyle(typography, fallbackColor) {
  return {
    ...typographyToStyle(typography),
    ...(typography?.color ? {} : { color: fallbackColor }),
  }
}

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
const loadingSteps = [
  { label: 'Analisando suas respostas', icon: '🔍' },
  { label: 'Identificando oportunidades para seu salão', icon: '💡' },
  { label: 'Criando seu plano personalizado', icon: '🚀' },
]

function LoadingScreen({ onComplete, hero }) {
  const gradId = useId().replace(/:/g, 'g')
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const bgTint = coerceHexColor(hero?.quizScreenBgTint, WAKE_QUIZ_DEFAULT_QUIZ_BG_TINT)
  const accent = coerceHexColor(hero?.quizAccentColor, WAKE_QUIZ_DEFAULT_QUIZ_ACCENT)
  const pageBg = buildQuizQuestionPageBackground(bgTint)
  const accentGradStop = mixHex(accent, '#ffffff', 0.28)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 1.5
      })
    }, 40)
    return () => clearInterval(interval)
  }, [onComplete])

  useEffect(() => {
    if (progress > 33 && step === 0) setStep(1)
    if (progress > 66 && step === 1) setStep(2)
  }, [progress, step])

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden"
      style={{ background: pageBg }}
    >
      <div className="relative z-10 max-w-sm w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="relative w-28 h-28 mx-auto mb-8"
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke={hexToRgba(accent, 0.14)} strokeWidth="6" />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={`url(#lgrad-${gradId})`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={283}
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
              transition={{ duration: 0.1 }}
              transform="rotate(-90 50 50)"
            />
            <defs>
              <linearGradient id={`lgrad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={accent} />
                <stop offset="100%" stopColor={accentGradStop} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-2xl font-bold font-grotesk"
              style={{
                ...typographyToStyle(hero?.quizLoadingTypography),
                color: hero?.quizLoadingTypography?.color ?? accent,
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </motion.div>

        <div className="space-y-3 mb-6">
          {loadingSteps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: step >= i ? 1 : 0.3, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.2 }}
              className="flex items-center gap-3 justify-center"
            >
              <span className="text-xl">{s.icon}</span>
              <span
                className={`text-sm font-medium ${hero?.quizLoadingTypography?.color ? '' : step >= i ? 'text-foreground' : 'text-muted-foreground'}`}
                style={{
                  ...typographyToStyle(hero?.quizLoadingTypography),
                  ...(hero?.quizLoadingTypography?.color ? { opacity: step >= i ? 1 : 0.45 } : {}),
                }}
              >
                {s.label}
              </span>
              {step > i && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle className="w-4 h-4" style={{ color: accent }} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function pickRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function countryCallingCode(country) {
  switch (country) {
    case 'PT':
      return '351'
    case 'US':
      return '1'
    case 'MX':
      return '52'
    case 'AR':
      return '54'
    case 'CL':
      return '56'
    case 'CO':
      return '57'
    case 'BR':
    default:
      return '55'
  }
}

function ResultScreen({ leadData, hero, logoUrl, editMode, onEditSection }) {
  const bgTint = coerceHexColor(hero?.quizScreenBgTint, WAKE_QUIZ_DEFAULT_QUIZ_BG_TINT)
  const accent = coerceHexColor(hero?.quizAccentColor, WAKE_QUIZ_DEFAULT_QUIZ_ACCENT)
  const pageBg = buildQuizQuestionPageBackground(bgTint)
  const accentGrad = buildAccentGradient(accent)
  const cardBg = mixHex(bgTint, '#ffffff', 0.38)
  const cardBorder = hexToRgba(accent, 0.26)
  const iconTileBg = hexToRgba(accent, 0.12)

  const [crescimento] = useState(() => pickRandom(30, 40))
  const [clientes] = useState(() => pickRandom(15, 30))
  const baseStats =
    Array.isArray(hero?.resultStats) && hero.resultStats.length === 3
      ? hero.resultStats
      : [
          { icon: '📈', label: 'Potencial de crescimento', value: `+${crescimento}%`, barPct: 86 },
          { icon: '👥', label: 'Novos clientes estimados/mês', value: `${clientes}+`, barPct: 76 },
          { icon: '⚡', label: 'Tempo para primeiros resultados', value: '30 dias', barPct: 66 },
        ]
  const stats = baseStats.map((s, i) => {
    const value =
      typeof s.value === 'string' && s.value.trim().length
        ? s.value
        : i === 0
          ? `+${crescimento}%`
          : i === 1
            ? `${clientes}+`
            : '30 dias'
    const barPct = typeof s.barPct === 'number' ? Math.max(0, Math.min(100, Math.round(s.barPct))) : 70
    return { ...s, value, barPct }
  })

  const cc = countryCallingCode(hero?.whatsappCountry)
  const digits = String(hero?.whatsappNumber ?? '').replace(/\D/g, '')
  const whatsappNumber = `${cc}${digits}`
  const msg = String(hero?.whatsappMessage ?? '').trim()
  const whatsappMsg = encodeURIComponent(msg.length ? msg : 'Olá! Acabei de fazer o quiz e quero saber mais.')
  const whatsappUrl = digits.length >= 8 ? `https://wa.me/${whatsappNumber}?text=${whatsappMsg}` : null

  const logoImgMaxH = Math.min(280, Math.max(40, Number(hero?.logoImageMaxHeightPx ?? 88) || 88))

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-start px-5 py-8 overflow-hidden"
      style={{ background: pageBg }}
    >
      <div className="relative z-10 max-w-lg w-full">
        <div className="flex items-center justify-center mb-6">
          <EditableBlock editMode={editMode} onEdit={() => onEditSection?.('logo')} className="px-2 py-1 -mx-2">
            <div className="flex flex-col items-center gap-1">
              {logoUrl ? (
                <div
                  className="mx-auto flex w-[min(360px,92vw)] items-center justify-center"
                  style={{ maxHeight: `${logoImgMaxH}px` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt={hero?.logoText ?? 'Logo'}
                    className="w-auto max-w-full object-contain"
                    style={{ maxHeight: `${logoImgMaxH}px` }}
                  />
                </div>
              ) : (
                <span className="font-grotesk font-black tracking-tight" style={logoHeaderTextStyle(hero?.logoTextTypography, accentGrad)}>
                  {hero?.logoText ?? 'SILVA YARIN'}
                </span>
              )}
              {(hero?.tagline ?? '').trim() ? (
                <span
                  className="text-[8px] tracking-widest uppercase font-semibold"
                  style={taglineHeaderStyle(hero?.taglineTypography, hexToRgba(accent, 0.72))}
                >
                  {hero.tagline}
                </span>
              ) : null}
            </div>
          </EditableBlock>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="text-center mb-6"
        >
          <div className="mb-4 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <EditableBlock editMode={editMode} onEdit={() => onEditSection?.('result_icon')} className="inline-flex">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 1, delay: 0.2 }}
                className="inline-flex items-center justify-center w-18 h-18 rounded-3xl"
                style={{
                  background: accentGrad,
                  padding: '20px',
                  borderRadius: '24px',
                  boxShadow: `0 8px 32px ${hexToRgba(accent, 0.35)}`,
                }}
              >
                {(hero?.resultTopIcon ?? '✨').trim() ? (
                  <span className="text-4xl leading-none" aria-hidden>
                    {hero?.resultTopIcon ?? '✨'}
                  </span>
                ) : null}
              </motion.div>
            </EditableBlock>

            <EditableBlock editMode={editMode} onEdit={() => onEditSection?.('result_badge')} className="inline-flex">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border"
                style={{
                  background: hexToRgba(accent, 0.1),
                  color: accent,
                  borderColor: cardBorder,
                }}
              >
                {(hero?.resultBadgeIcon ?? '🎉').trim() ? (
                  <span aria-hidden>{hero?.resultBadgeIcon ?? '🎉'}</span>
                ) : null}
                <span style={typographyToStyle(hero?.resultBadgeTypography)}>
                  {(hero?.resultBadgeText ?? 'Seu plano está pronto!').replace(
                    '{nome}',
                    leadData?.nome?.split(' ')[0] ?? ''
                  )}
                </span>
              </motion.div>
            </EditableBlock>
          </div>

          <EditableBlock editMode={editMode} onEdit={() => onEditSection?.('result_title')}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-2xl md:text-3xl font-grotesk font-bold text-foreground mb-2 leading-tight"
            >
              <span style={typographyToStyle(hero?.resultTitleLine1Typography)}>
                {hero?.resultTitleLine1 ?? 'Montamos um plano exclusivo'}
              </span>
              <br />
              <span
                style={(() => {
                  const t = typographyToStyle(hero?.resultTitleLine2Typography)
                  if (hero?.resultTitleLine2Typography?.color) return t
                  return {
                    ...splitStyleNoColor(t),
                    background: accentGrad,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }
                })()}
              >
                {hero?.resultTitleLine2 ?? 'para lotar seu salão 💈'}
              </span>
            </motion.h2>
          </EditableBlock>

          <EditableBlock editMode={editMode} onEdit={() => onEditSection?.('result_title')}>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-muted-foreground text-sm max-w-sm mx-auto"
              style={typographyToStyle(hero?.resultSubtitleTypography)}
            >
              {hero?.resultSubtitle ??
                'Com base nas suas respostas, vamos elevar o marketing do seu salão e lotar sua agenda com previsibilidade.'}
            </motion.p>
          </EditableBlock>
        </motion.div>

        <EditableBlock editMode={editMode} onEdit={() => onEditSection?.('result_stats')}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid gap-3 mb-6"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={`${stat.label}-${i}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.15 }}
                className="flex items-center gap-4 p-4 rounded-2xl border"
                style={{ background: cardBg, borderColor: cardBorder }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: iconTileBg }}
                  aria-hidden
                >
                  {(stat.icon ?? '').trim() ? stat.icon : ''}
                </div>
                <div className="flex-1">
                  <div
                    className="text-xs text-muted-foreground"
                    style={typographyToStyle(hero?.resultStatLabelTypography)}
                  >
                    {stat.label}
                  </div>
                  <div
                    className="font-bold font-grotesk text-lg text-foreground"
                    style={typographyToStyle(hero?.resultStatValueTypography)}
                  >
                    {stat.value}
                  </div>
                </div>
                <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: hexToRgba(accent, 0.15) }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.barPct}%` }}
                    transition={{ delay: 1.2 + i * 0.2, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${accent}, ${mixHex(accent, '#ffffff', 0.35)})` }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </EditableBlock>

        <EditableBlock editMode={editMode} onEdit={() => onEditSection?.('result_contact')}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="p-4 rounded-2xl border mb-6 text-center"
            style={{ background: cardBg, borderColor: cardBorder }}
          >
            <p
              className="text-sm font-semibold text-foreground mb-1"
              style={typographyToStyle(hero?.resultContactTitleTypography)}
            >
              {hero?.resultContactTitle ?? '📞 Em breve entraremos em contato!'}
            </p>
            <p
              className="text-xs text-muted-foreground"
              style={typographyToStyle(hero?.resultContactBodyTypography)}
            >
              {hero?.resultContactBody ??
                'Nossa equipe vai entrar em contato com você em até 24h para marcar nossa reunião gratuita de diagnóstico.'}
            </p>
          </motion.div>
        </EditableBlock>

        <EditableBlock editMode={editMode} onEdit={() => onEditSection?.('result_whatsapp')}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mb-4"
          >
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-shadow duration-300 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    boxShadow: '0 6px 24px rgba(34,197,94,0.3)',
                  }}
                >
                  <MessageCircle className="w-5 h-5" style={{ color: hero?.whatsappButtonTypography?.color ?? 'white' }} />
                  <span
                    style={{
                      ...typographyToStyle(hero?.whatsappButtonTypography),
                      color: hero?.whatsappButtonTypography?.color ?? 'white',
                    }}
                  >
                    {hero?.whatsappButtonLabel ?? 'Falar no WhatsApp Agora'}
                  </span>
                </motion.div>
              </a>
            ) : (
              <div
                className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 border bg-white"
                style={{
                  borderColor: hexToRgba(accent, 0.35),
                  color: mixHex(accent, '#0f172a', 0.4),
                }}
              >
                Defina seu WhatsApp no editor
              </div>
            )}
            <EditableBlock editMode={editMode} onEdit={() => onEditSection?.('result_footer')}>
              <p
                className="text-center text-xs text-muted-foreground mt-2"
                style={typographyToStyle(hero?.resultAfterWhatsappTypography)}
              >
                {hero?.resultAfterWhatsappText ??
                  'Ou aguarde — entraremos em contato em até 24h para marcar sua reunião 📅'}
              </p>
            </EditableBlock>
          </motion.div>
        </EditableBlock>

        <EditableBlock editMode={editMode} onEdit={() => onEditSection?.('result_footer')}>
          <p
            className="text-center text-xs text-muted-foreground pb-6"
            style={typographyToStyle(hero?.resultFooterSmallTypography)}
          >
            {hero?.resultFooterSmallText ?? '🔒 Seus dados estão seguros'}
          </p>
        </EditableBlock>
      </div>
    </div>
  )
}

export default function QuizResult({ leadData, hero, logoUrl, editMode, onEditSection }) {
  const [showResult, setShowResult] = useState(false)

  if (!showResult) {
    return <LoadingScreen onComplete={() => setShowResult(true)} hero={hero} />
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="result"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <ResultScreen
          leadData={leadData}
          hero={hero}
          logoUrl={logoUrl}
          editMode={editMode}
          onEditSection={onEditSection}
        />
      </motion.div>
    </AnimatePresence>
  )
}
