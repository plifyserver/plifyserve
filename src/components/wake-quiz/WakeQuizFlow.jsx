'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { mergeWakeQuizHero } from '@/lib/wakeQuizHero'
import { mergeWakeQuizQuestions } from '@/lib/wakeQuizQuestions'
import QuizHeroComponent from './QuizHero'
import QuizQuestion from './QuizQuestion'
import QuizResult from './QuizResult'

const WakeQuizInlineEditor = dynamic(
  () =>
    import('@/components/wake-quiz/WakeQuizInlineEditor').then((m) => ({
      default: m.WakeQuizInlineEditor,
    })),
  { ssr: false }
)

const WakeQuizQuestionsEditor = dynamic(
  () =>
    import('@/components/wake-quiz/WakeQuizQuestionsEditor').then((m) => ({
      default: m.WakeQuizQuestionsEditor,
    })),
  { ssr: false }
)

const DEFAULT_QUIZ_PLAN = { maxQuestions: 5, unlimited: false }

export default function WakeQuizFlow(props) {
  const publicSlug = props?.publicSlug
  const enableHeroEditor = Boolean(props?.enableHeroEditor)
  const questionsEditorOpen = Boolean(props?.questionsEditorOpen)
  const onCloseQuestionsEditor = props?.onCloseQuestionsEditor

  const [hero, setHero] = useState(() => mergeWakeQuizHero(null))
  const [logoUrl, setLogoUrl] = useState(null)
  const [heroReady, setHeroReady] = useState(false)
  const [editSection, setEditSection] = useState(null)
  const [logoSizingContext, setLogoSizingContext] = useState(null)

  const [quizQuestions, setQuizQuestions] = useState(() => mergeWakeQuizQuestions(null))
  const [quizPlan, setQuizPlan] = useState(() => DEFAULT_QUIZ_PLAN)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const url = publicSlug
          ? `/api/public/wake-quiz/${encodeURIComponent(publicSlug)}/hero`
          : '/api/dashboard/wake-quiz/hero'
        const res = await fetch(url, { credentials: publicSlug ? 'omit' : 'include' })
        const data = await res.json()
        if (cancelled || !res.ok) return
        setHero(mergeWakeQuizHero(data.hero))
        setLogoUrl(data.logoUrl ?? null)
        setQuizQuestions(mergeWakeQuizQuestions(data.questions))
        if (data.quizPlan && typeof data.quizPlan === 'object') {
          setQuizPlan({
            maxQuestions: data.quizPlan.maxQuestions ?? DEFAULT_QUIZ_PLAN.maxQuestions,
            unlimited: Boolean(data.quizPlan.unlimited),
          })
        } else {
          setQuizPlan(DEFAULT_QUIZ_PLAN)
        }
      } catch {
        /* mantém defaults */
      } finally {
        if (!cancelled) setHeroReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [publicSlug])

  const patchHero = useCallback((patch) => {
    setHero((prev) => ({ ...prev, ...patch }))
  }, [])

  const [phase, setPhase] = useState('hero')
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [leadData, setLeadData] = useState(null)

  const nQuestions = quizQuestions.length

  const handleStart = useCallback(() => {
    setAnswers({})
    setCurrentStep(0)
    setPhase('quiz')
  }, [])

  const handleAnswer = useCallback((field, value) => {
    setAnswers((prev) => ({ ...prev, [field]: typeof value === 'string' ? value : String(value ?? '') }))
  }, [])

  const handleNext = useCallback(() => {
    if (nQuestions === 0) return
    if (currentStep < nQuestions - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      // Finalizou perguntas → vai direto para carregamento/resultado final
      const quizAnswers = {}
      for (const q of quizQuestions) {
        const v = answers[q.field]
        if (v === undefined || v === null) continue
        const s = String(v).trim()
        if (s) quizAnswers[q.field] = s
      }

      // Regista lead sem tela de captura (nome obrigatório no backend)
      ;(async () => {
        try {
          const url = publicSlug
            ? `/api/public/wake-quiz/${encodeURIComponent(publicSlug)}/lead`
            : '/api/dashboard/wake-quiz/leads'
          await fetch(url, {
            method: 'POST',
            credentials: publicSlug ? 'omit' : 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome: 'Lead do Quiz',
              whatsapp: null,
              email: null,
              quiz_answers: quizAnswers,
              status: 'novo',
            }),
          })
        } catch {
          /* não bloquear UX */
        }
      })()

      setLeadData(null)
      setPhase('result')
    }
  }, [answers, currentStep, nQuestions, publicSlug, quizQuestions])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    } else {
      setPhase('hero')
    }
  }, [currentStep])

  // (fase de captura removida)

  if (!heroReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  const heroEditMode = Boolean(enableHeroEditor && !publicSlug)
  const layoutEmbedded = Boolean(!publicSlug)

  return (
    <div className="min-h-dvh min-h-[100vh] bg-white relative font-inter text-foreground">
      {heroEditMode ? (
        <WakeQuizInlineEditor
          section={editSection}
          logoSizingContext={logoSizingContext}
          onClose={() => {
            setEditSection(null)
            setLogoSizingContext(null)
          }}
          hero={hero}
          onHeroPatch={patchHero}
          logoUrl={logoUrl}
          onLogoUrl={setLogoUrl}
        />
      ) : null}

      {heroEditMode ? (
        <WakeQuizQuestionsEditor
          open={questionsEditorOpen}
          onClose={() => onCloseQuestionsEditor?.()}
          questions={quizQuestions}
          quizPlan={quizPlan}
          onSaved={(next) => setQuizQuestions(next)}
        />
      ) : null}

      <AnimatePresence mode="wait">
        {phase === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.22 }}
          >
            <QuizHeroComponent
              onStart={handleStart}
              content={hero}
              logoUrl={logoUrl}
              editMode={heroEditMode}
              onEditSection={(section) => {
                setEditSection(section)
                setLogoSizingContext(section === 'logo' ? 'hero' : null)
              }}
              layoutEmbedded={layoutEmbedded}
            />
          </motion.div>
        )}

        {phase === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.22 }}
          >
            <QuizQuestion
              questions={quizQuestions}
              currentStep={currentStep}
              answers={answers}
              onAnswer={handleAnswer}
              onNext={handleNext}
              onBack={handleBack}
              logoUrl={logoUrl}
              headerLogoMaxHeightPx={hero.questionHeaderLogoMaxHeightPx}
              brand={{ line1: hero.logoText, line2: hero.tagline }}
              logoTextTypography={hero.logoTextTypography}
              taglineTypography={hero.taglineTypography}
              headerLogoEditable={heroEditMode}
              onHeaderLogoPress={() => {
                setLogoSizingContext('questions')
                setEditSection('logo')
              }}
              quizScreenBgTint={hero.quizScreenBgTint}
              quizAccentColor={hero.quizAccentColor}
              quizProgressTypography={hero.quizProgressTypography}
              quizContinueTypography={hero.quizContinueTypography}
              questionUiEditMode={heroEditMode}
              onEditQuizTheme={() => setEditSection('quiz_theme')}
            />
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <QuizResult
              leadData={leadData}
              hero={hero}
              logoUrl={logoUrl}
              editMode={heroEditMode}
              onEditSection={(section) => {
                setEditSection(section)
                setLogoSizingContext(section === 'logo' ? 'hero' : null)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
