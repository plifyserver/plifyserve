'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, MonitorSmartphone } from 'lucide-react'
import { ProposalPreview, type ProposalData } from '@/components/proposals/ProposalPreview'
import {
  isValidLivePreviewSid,
  proposalLivePreviewChannelName,
  type ProposalLivePreviewMessage,
} from '@/lib/proposalLivePreview'

function LivePreviewContent() {
  const searchParams = useSearchParams()
  const sid = searchParams.get('sid')
  const [data, setData] = useState<ProposalData | null>(null)

  const validSid = isValidLivePreviewSid(sid)

  useEffect(() => {
    if (!validSid || typeof BroadcastChannel === 'undefined') return
    const name = proposalLivePreviewChannelName(sid)
    const ch = new BroadcastChannel(name)
    const onMsg = (ev: MessageEvent<ProposalLivePreviewMessage>) => {
      const msg = ev.data
      if (msg?.type === 'data' && msg.payload != null) {
        setData(msg.payload as ProposalData)
      }
    }
    ch.addEventListener('message', onMsg)
    return () => {
      ch.removeEventListener('message', onMsg)
      ch.close()
    }
  }, [sid, validSid])

  if (!validSid) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <p className="text-center text-slate-600 text-sm max-w-sm">
          Link de visualização inválido. Abra o preview a partir do editor de propostas no Plify.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-slate-100">
      <div className="shrink-0 w-full border-b border-indigo-100/90 bg-indigo-50/95 px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 text-sm text-indigo-950">
          <div className="flex items-center gap-2 font-medium">
            <MonitorSmartphone className="w-4 h-4 shrink-0 text-indigo-600" />
            Visualização ao vivo (como o cliente vê)
          </div>
          <p className="text-indigo-800/90 text-xs sm:text-sm sm:max-w-[min(100%,42rem)] sm:text-right">
            Atualiza em tempo real enquanto você edita no Plify. Aceitar planos só funciona no link público após publicar.
          </p>
        </div>
      </div>

      {!data ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm text-slate-600">Aguardando dados do editor…</p>
            <p className="mt-2 text-xs text-slate-400">Deixe esta aba aberta e edite a proposta na outra.</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 w-full flex-1">
          <ProposalPreview
            data={data}
            className="h-full min-h-full w-full rounded-none shadow-none"
          />
        </div>
      )}
    </div>
  )
}

export default function ProposalLivePreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
        </div>
      }
    >
      <LivePreviewContent />
    </Suspense>
  )
}
