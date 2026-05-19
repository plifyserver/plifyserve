import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Palette } from 'lucide-react'
import QuizProgress from './QuizProgress'
import {
  WAKE_QUIZ_DEFAULT_QUIZ_ACCENT,
  WAKE_QUIZ_DEFAULT_QUIZ_BG_TINT,
  buildAccentGradient,
  buildQuizQuestionPageBackground,
  coerceHexColor,
  hexToRgba,
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

/**
 * @param {object} props
 * @param {import('@/lib/wakeQuizQuestions').WakeQuizQuestion[]} props.questions
 * @param {number} props.currentStep
 * @param {Record<string, string>} props.answers
 * @param {(field: string, value: string) => void} props.onAnswer
 * @param {() => void} props.onNext
 * @param {() => void} props.onBack
 * @param {{ line1?: string; line2?: string }} [props.brand]
 * @param {string | null | undefined} [props.logoUrl]
 * @param {number | undefined} [props.headerLogoMaxHeightPx]
 * @param {boolean} [props.headerLogoEditable]
 * @param {() => void} [props.onHeaderLogoPress]
 * @param {string | undefined} [props.quizScreenBgTint] — tom médio do fundo (guardado no hero)
 * @param {import('@/lib/wakeQuizTypography').WakeQuizBlockTypography | undefined} [props.logoTextTypography]
 * @param {import('@/lib/wakeQuizTypography').WakeQuizBlockTypography | undefined} [props.taglineTypography]
 * @param {import('@/lib/wakeQuizTypography').WakeQuizBlockTypography | undefined} [props.quizProgressTypography]
 * @param {import('@/lib/wakeQuizTypography').WakeQuizBlockTypography | undefined} [props.quizContinueTypography]
 * @param {boolean} [props.questionUiEditMode] — dashboard: mostrar atalho para editar cores
 * @param {() => void} [props.onEditQuizTheme]
 */
export default function QuizQuestion({
  questions,
  currentStep,
  answers,
  onAnswer,
  onNext,
  onBack,
  brand,
  logoUrl,
  headerLogoMaxHeightPx,
  headerLogoEditable = false,
  onHeaderLogoPress,
  quizScreenBgTint,
  quizAccentColor,
  logoTextTypography,
  taglineTypography,
  quizProgressTypography,
  quizContinueTypography,
  questionUiEditMode = false,
  onEditQuizTheme,
}) {
  const bgTint = coerceHexColor(quizScreenBgTint, WAKE_QUIZ_DEFAULT_QUIZ_BG_TINT)
  const accent = coerceHexColor(quizAccentColor, WAKE_QUIZ_DEFAULT_QUIZ_ACCENT)
  const pageBg = buildQuizQuestionPageBackground(bgTint)
  const accentGrad = buildAccentGradient(accent)
  const borderSoft = hexToRgba(accent, 0.22)
  const borderLight = hexToRgba(accent, 0.32)
  const taglineColor = hexToRgba(accent, 0.72)

  const question = questions[currentStep]
  if (!question) {
    return (
      <div
        className="relative min-h-screen flex items-center justify-center px-5"
        style={{ background: pageBg }}
      >
        <p className="text-sm text-muted-foreground">Nenhuma pergunta configurada.</p>
      </div>
    )
  }

  const raw = answers[question.field] ?? ''
  const textVal = typeof raw === 'string' ? raw : String(raw)
  const selectedAnswer = question.type === 'selection' ? textVal : textVal.trim()

  const canContinue =
    question.type === 'selection' ? Boolean(selectedAnswer?.trim()) : Boolean(textVal.trim())

  const line1 = brand?.line1?.trim() || 'SILVA YARIN'
  const line2raw = brand?.line2?.trim()
  const line2 = line2raw || 'Wake'

  const headerLogoH = Math.min(
    96,
    Math.max(
      24,
      typeof headerLogoMaxHeightPx === 'number' && Number.isFinite(headerLogoMaxHeightPx)
        ? Math.round(headerLogoMaxHeightPx)
        : 44
    )
  )

  const logoTextGradient = accentGrad

  return (
    <div
      className="relative min-h-screen flex flex-col px-5 py-6 overflow-hidden"
      style={{ background: pageBg }}
    >
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col flex-1">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between mb-5"
        >
          <motion.button
            type="button"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
            style={{ borderWidth: 1, borderStyle: 'solid', borderColor: borderSoft }}
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>

          <div className="flex flex-col items-center justify-center min-w-0 px-2 min-h-[2.5rem]">
            {logoUrl ? (
              <>
                {headerLogoEditable && typeof onHeaderLogoPress === 'function' ? (
                  <button
                    type="button"
                    onClick={onHeaderLogoPress}
                    title="Alterar logo e tamanho"
                    className="group relative mx-auto flex w-[min(220px,50vw)] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-transparent p-1 outline-none transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = borderLight
                      e.currentTarget.style.backgroundColor = hexToRgba(accent, 0.06)
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div className="flex w-full items-center justify-center" style={{ maxHeight: headerLogoH + 16 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt={line1 || 'Logo'}
                        className="pointer-events-none h-auto max-w-full w-auto object-contain"
                        style={{ maxHeight: headerLogoH }}
                      />
                    </div>
                  </button>
                ) : (
                  <div
                    className="mx-auto flex w-[min(220px,50vw)] items-center justify-center"
                    style={{ maxHeight: headerLogoH }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt={line1 || 'Logo'}
                      className="h-auto max-w-full w-auto object-contain"
                      style={{ maxHeight: headerLogoH }}
                    />
                  </div>
                )}
                {line2raw ? (
                  <span
                    className="mt-1 text-[8px] tracking-widest uppercase font-semibold truncate max-w-[200px]"
                    style={taglineHeaderStyle(taglineTypography, taglineColor)}
                  >
                    {line2raw}
                  </span>
                ) : null}
              </>
            ) : headerLogoEditable && typeof onHeaderLogoPress === 'function' ? (
              <button
                type="button"
                onClick={onHeaderLogoPress}
                title="Carregar ou editar logo e tamanho"
                className="group relative flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-4 py-2 outline-none transition-colors"
                style={{
                  borderColor: borderLight,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hexToRgba(accent, 0.06)
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <span
                  className="font-grotesk font-black tracking-tight leading-none select-none truncate max-w-[200px] sm:max-w-xs"
                  style={logoHeaderTextStyle(logoTextTypography, logoTextGradient)}
                >
                  {line1}
                </span>
                <span
                  className="text-[8px] tracking-widest uppercase font-semibold truncate max-w-[200px]"
                  style={taglineHeaderStyle(taglineTypography, taglineColor)}
                >
                  {line2}
                </span>
              </button>
            ) : (
              <>
                <span
                  className="font-grotesk font-black tracking-tight leading-none select-none truncate max-w-[200px] sm:max-w-xs"
                  style={logoHeaderTextStyle(logoTextTypography, logoTextGradient)}
                >
                  {line1}
                </span>
                <span
                  className="text-[8px] tracking-widest uppercase font-semibold truncate max-w-[200px]"
                  style={taglineHeaderStyle(taglineTypography, taglineColor)}
                >
                  {line2}
                </span>
              </>
            )}
          </div>

          <div className="w-10 shrink-0 flex justify-end">
            {questionUiEditMode && typeof onEditQuizTheme === 'function' ? (
              <button
                type="button"
                title="Cores da tela de perguntas"
                onClick={onEditQuizTheme}
                className="rounded-xl bg-white p-2 shadow-sm transition-all hover:shadow-md"
                style={{ borderWidth: 1, borderStyle: 'solid', borderColor: borderSoft }}
              >
                <Palette className="h-4 w-4" style={{ color: accent }} aria-hidden />
              </button>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-7"
        >
          <QuizProgress
            current={currentStep}
            total={questions.length}
            accentColor={accent}
            progressTypography={quizProgressTypography}
          />
        </motion.div>

        <div className="flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-4xl mb-3" aria-hidden>
                {question.emoji}
              </div>

              <h2
                className="text-2xl font-grotesk font-bold text-foreground mb-1.5 leading-tight"
                style={typographyToStyle(question.titleTypography)}
              >
                {question.title}
              </h2>

              <p
                className="text-muted-foreground text-sm mb-6"
                style={typographyToStyle(question.subtitleTypography)}
              >
                {question.subtitle}
              </p>

              {question.type === 'selection' ? (
                <div className="space-y-3">
                  {question.options.map((option, i) => {
                    const isSelected = selectedAnswer === option.id
                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        onClick={() => onAnswer(question.field, option.id)}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 + i * 0.06 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center gap-4"
                        style={{
                          background: isSelected
                            ? `linear-gradient(135deg, ${hexToRgba(accent, 0.09)}, ${hexToRgba(accent, 0.04)})`
                            : 'white',
                          borderColor: isSelected ? accent : '#e5e7eb',
                          boxShadow: isSelected
                            ? `0 4px 16px ${hexToRgba(accent, 0.22)}`
                            : '0 1px 4px rgba(0,0,0,0.05)',
                        }}
                      >
                        <span className="text-2xl flex-shrink-0">{option.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-semibold text-foreground text-sm"
                            style={typographyToStyle(question.optionLabelTypography)}
                          >
                            {option.label}
                          </div>
                          {option.desc ? (
                            <div
                              className="text-xs text-muted-foreground mt-0.5"
                              style={typographyToStyle(question.optionDescTypography)}
                            >
                              {option.desc}
                            </div>
                          ) : null}
                        </div>
                        <div
                          className="w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                          style={{
                            borderColor: isSelected ? accent : '#d1d5db',
                            background: isSelected ? accent : 'transparent',
                          }}
                        >
                          {isSelected ? (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              ) : question.type === 'text_large' ? (
                <textarea
                  value={textVal}
                  onChange={(e) => onAnswer(question.field, e.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors resize-y min-h-[120px]"
                  style={{ borderColor: hexToRgba(accent, 0.2) }}
                  onFocus={(e) => {
                    e.target.style.borderColor = borderLight
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = hexToRgba(accent, 0.2)
                  }}
                  placeholder="Escreva aqui..."
                />
              ) : (
                <input
                  type="text"
                  value={textVal}
                  onChange={(e) => onAnswer(question.field, e.target.value)}
                  className="w-full rounded-2xl border-2 bg-white px-4 py-3.5 text-sm text-foreground outline-none transition-colors"
                  style={{ borderColor: hexToRgba(accent, 0.2) }}
                  onFocus={(e) => {
                    e.target.style.borderColor = borderLight
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = hexToRgba(accent, 0.2)
                  }}
                  placeholder="Sua resposta..."
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-6 pb-4 shrink-0"
        >
          <motion.button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            whileHover={canContinue ? { scale: 1.02, y: -1 } : {}}
            whileTap={canContinue ? { scale: 0.98 } : {}}
            className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300"
            style={{
              background: canContinue ? accentGrad : '#e5e7eb',
              color: canContinue ? 'white' : '#9ca3af',
              boxShadow: canContinue ? `0 6px 24px ${hexToRgba(accent, 0.32)}` : 'none',
              cursor: canContinue ? 'pointer' : 'not-allowed',
            }}
          >
            <span
              style={{
                ...typographyToStyle(quizContinueTypography),
                color: quizContinueTypography?.color ?? (canContinue ? 'white' : '#9ca3af'),
              }}
            >
              Continuar
            </span>
            <ArrowRight
              className="w-4 h-4"
              style={{ color: quizContinueTypography?.color ?? (canContinue ? 'white' : '#9ca3af') }}
            />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
