'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { WakeQuizShareBar } from '@/components/wake-quiz/WakeQuizShareBar'

const WakeQuizFlow = dynamic(() => import('@/components/wake-quiz/WakeQuizFlow'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
    </div>
  ),
})

export default function DashboardWakeQuizPage() {
  const [questionsEditorOpen, setQuestionsEditorOpen] = useState(false)

  return (
    <div className="relative pt-[10.75rem] sm:pt-[8.75rem] lg:pt-[7.25rem]">
      <WakeQuizShareBar onEditQuestions={() => setQuestionsEditorOpen(true)} />
      <WakeQuizFlow
        enableHeroEditor
        questionsEditorOpen={questionsEditorOpen}
        onCloseQuestionsEditor={() => setQuestionsEditorOpen(false)}
      />
    </div>
  )
}
