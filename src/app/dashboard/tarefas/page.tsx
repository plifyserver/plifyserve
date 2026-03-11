'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TarefasPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/projetos')
  }, [router])
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-slate-500">Redirecionando para Projetos...</p>
    </div>
  )
}
