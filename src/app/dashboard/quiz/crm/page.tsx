'use client'

import dynamic from 'next/dynamic'

const WakeQuizCRM = dynamic(() => import('@/components/wake-quiz/WakeQuizCRM'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  ),
})

export default function WakeQuizCRMPage() {
  return <WakeQuizCRM />
}
