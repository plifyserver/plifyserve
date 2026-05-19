import { motion } from 'framer-motion'
import {
  WAKE_QUIZ_DEFAULT_QUIZ_ACCENT,
  buildAccentGradient,
  coerceHexColor,
  hexToRgba,
} from '@/lib/wakeQuizThemeColors'
import { typographyToStyle } from '@/lib/wakeQuizTypography'

export default function QuizProgress({ current, total, accentColor, progressTypography }) {
  const progress = ((current + 1) / total) * 100
  const accent = coerceHexColor(accentColor, WAKE_QUIZ_DEFAULT_QUIZ_ACCENT)
  const barGrad = buildAccentGradient(accent)
  const typo = typographyToStyle(progressTypography)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-medium ${progressTypography?.color ? '' : 'text-muted-foreground'}`}
          style={typo}
        >
          Pergunta {current + 1} de {total}
        </span>
        <span
          className="text-xs font-semibold"
          style={{
            ...typo,
            color: progressTypography?.color ?? accent,
          }}
        >
          {Math.round(progress)}%
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{
          background: hexToRgba(accent, 0.12),
          border: `1px solid ${hexToRgba(accent, 0.22)}`,
        }}
      >
        <motion.div
          className="h-full w-full origin-left rounded-full"
          style={{
            background: barGrad,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}
