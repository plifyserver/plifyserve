'use client'

import { Construction } from 'lucide-react'

export default function AdminCmsAgendaPage() {
  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">CMS Agenda</h1>
      </div>
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-6 py-10 text-center">
        <Construction className="w-14 h-14 text-amber-400 mx-auto mb-4" aria-hidden />
        <p className="text-lg font-semibold text-amber-200">Em criação</p>
        <p className="text-sm text-amber-100/80 mt-2 leading-relaxed">
          Esta área ainda não está disponível. Você poderá configurá-la depois.
        </p>
      </div>
    </div>
  )
}

