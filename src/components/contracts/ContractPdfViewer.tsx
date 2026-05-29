'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  loadContractPdfDocument,
  measurePdfContainerWidth,
  renderPdfPagesToCanvases,
  waitForCanvasRefs,
} from '@/lib/contractPdfRender'

type Props = {
  pdfUrl: string
  className?: string
  /** Texto curto acima do documento */
  hint?: string
}

/**
 * Visualização do contrato: todas as páginas empilhadas (scroll vertical da página).
 * Substitui iframe, que no mobile costuma mostrar só a 1ª página.
 */
export default function ContractPdfViewer({ pdfUrl, className = '', hint }: Props) {
  const stackRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const pdfDocRef = useRef<Awaited<ReturnType<typeof loadContractPdfDocument>> | null>(null)

  const [numPages, setNumPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagesRendered, setPagesRendered] = useState(0)

  useEffect(() => {
    let cancelled = false
    canvasRefs.current = []
    pdfDocRef.current = null
    setNumPages(0)
    setPagesRendered(0)
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const pdf = await loadContractPdfDocument(pdfUrl)
        if (cancelled) return
        pdfDocRef.current = pdf
        setNumPages(pdf.numPages)
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setError(
            'Não foi possível carregar o PDF. Verifique sua conexão ou peça um novo link ao responsável.'
          )
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pdfUrl])

  useLayoutEffect(() => {
    if (numPages < 1 || !pdfDocRef.current) return

    let cancelled = false

    const run = async () => {
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
      if (cancelled) return

      const ready = await waitForCanvasRefs(canvasRefs, numPages, 48)
      if (cancelled) return
      if (!ready) {
        setError('Não foi possível preparar a visualização do documento. Tente recarregar a página.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const pdf = pdfDocRef.current
        if (!pdf) return
        const containerW = measurePdfContainerWidth(stackRef.current)
        const rendered = await renderPdfPagesToCanvases(pdf, canvasRefs.current, containerW)
        if (cancelled) return
        if (rendered < numPages) {
          setError(`Só foi possível exibir ${rendered} de ${numPages} páginas. Tente recarregar.`)
        }
        setPagesRendered(rendered)
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setError('Erro ao exibir o PDF. Tente recarregar a página.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [numPages, pdfUrl])

  return (
    <div className={className}>
      {hint ? <p className="text-xs text-slate-500 px-3 py-2 border-b border-slate-100 bg-slate-50">{hint}</p> : null}

      {error && (
        <div className="m-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {loading && numPages === 0 && !error && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" aria-hidden />
          <span className="sr-only">Carregando documento…</span>
        </div>
      )}

      <div
        ref={stackRef}
        className="flex flex-col gap-3 sm:gap-4 w-full items-center p-2 sm:p-3 bg-slate-100"
      >
        {numPages > 0 &&
          Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              className="w-full max-w-full rounded-lg shadow-sm bg-white overflow-hidden"
            >
              <p className="text-center text-[11px] font-medium text-slate-500 py-1.5 px-2 border-b border-slate-100">
                Página {i + 1} de {numPages}
              </p>
              <div className="flex justify-center p-1 sm:p-2">
                <div className="relative inline-block max-w-full">
                  {loading && pagesRendered <= i && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded min-h-[100px] min-w-[120px]">
                      <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                    </div>
                  )}
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[i] = el
                    }}
                    className="block max-w-full"
                    aria-label={`Página ${i + 1} do contrato`}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>

      {!loading && !error && numPages > 1 && (
        <p className="text-center text-xs text-slate-500 py-2 px-3 border-t border-slate-100">
          {numPages} páginas — role a tela para ler o documento completo
        </p>
      )}
    </div>
  )
}
