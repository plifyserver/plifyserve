'use client'

import dynamic from 'next/dynamic'
import { isValidWakeQuizPublicSlug } from '@/lib/wakeQuizSlug'

const WakeQuizFlow = dynamic(() => import('@/components/wake-quiz/WakeQuizFlow'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[70vh] flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
    </div>
  ),
})

export function WakeQuizPublicClient({ slug }: { slug: string }) {
  const ok = isValidWakeQuizPublicSlug(slug)

  if (!ok) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold text-slate-800">Este link não é válido</p>
        <p className="mt-2 text-sm text-slate-500">Confirme o endereço que recebeu.</p>
      </div>
    )
  }

  return <WakeQuizFlow publicSlug={slug.trim()} />
}
