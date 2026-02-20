'use client'

import { X, Zap, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LimitReachedModalProps {
  open: boolean
  onClose: () => void
  currentCount: number
  maxLimit: number
}

export function LimitReachedModal({
  open,
  onClose,
  currentCount,
  maxLimit,
}: LimitReachedModalProps) {
  const router = useRouter()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 p-8 max-w-md w-full mx-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Limite de Templates Atingido
          </h2>

          <p className="text-zinc-400 mb-6">
            Você já criou{' '}
            <span className="text-white font-semibold">{currentCount}</span> de{' '}
            <span className="text-white font-semibold">{maxLimit}</span>{' '}
            templates disponíveis no seu plano Essential.
          </p>

          <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Templates usados</span>
              <span className="text-sm font-medium text-white">
                {currentCount}/{maxLimit}
              </span>
            </div>
            <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <p className="text-sm text-zinc-500 mb-6">
            Faça upgrade para o plano Pro e tenha templates ilimitados!
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onClose()
                router.push('/dashboard/planos')
              }}
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Ver Planos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
