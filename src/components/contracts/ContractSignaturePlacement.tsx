'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Move } from 'lucide-react'
import {
  loadContractPdfDocument,
  measurePdfContainerWidth,
  renderPdfPagesToCanvases,
  waitForCanvasRefs,
} from '@/lib/contractPdfRender'

export type SignaturePlacement = {
  pageIndex: number
  /** Normalizado 0–1: canto superior esquerdo da caixa da assinatura */
  x: number
  y: number
  w: number
  h: number
}

type Props = {
  pdfUrl: string
  signatureDataUrl: string
  onConfirm: (placement: SignaturePlacement) => void
  onBack: () => void
}

/**
 * Tamanho normalizado (0–1) da caixa no canvas, proporcional à imagem da assinatura,
 * com leve margem e limite máximo para não ocupar a página inteira.
 */
function computeNormalizedSignatureBox(
  canvasW: number,
  canvasH: number,
  imgW: number,
  imgH: number
): { w: number; h: number } {
  const iw = Math.max(1, imgW)
  const ih = Math.max(1, imgH)
  const margin = 1.1
  const maxWpx = canvasW * 0.44
  const maxHpx = canvasH * 0.38
  const k = Math.min(maxWpx / iw, maxHpx / ih, 1)
  let w = (iw * k * margin) / canvasW
  let h = (ih * k * margin) / canvasH
  const scaleDown = 0.6
  w *= scaleDown
  h *= scaleDown
  w = Math.max(0.025, Math.min(0.5, w))
  h = Math.max(0.02, Math.min(0.45, h))
  return { w, h }
}

function findVerticalScrollParent(el: HTMLElement | null): HTMLElement | null {
  const marked = el?.closest('[data-signature-placement-scroll]') as HTMLElement | null
  if (marked) return marked
  let node: HTMLElement | null = el
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
      return node
    }
    node = node.parentElement
  }
  return document.documentElement.scrollHeight > document.documentElement.clientHeight
    ? document.documentElement
    : null
}

/** Qual página do PDF está sob o cursor (para arrastar entre páginas). */
function pageIndexAtPoint(
  clientX: number,
  clientY: number,
  wraps: (HTMLDivElement | null)[]
): number | null {
  for (let i = 0; i < wraps.length; i++) {
    const wrap = wraps[i]
    if (!wrap) continue
    const rect = wrap.getBoundingClientRect()
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return i
    }
  }
  return null
}

function coordsOnPageCanvas(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
): { nx: number; ny: number } | null {
  const rect = canvas.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return null
  return {
    nx: (clientX - rect.left) / rect.width,
    ny: (clientY - rect.top) / rect.height,
  }
}

export default function ContractSignaturePlacement({ pdfUrl, signatureDataUrl, onConfirm, onBack }: Props) {
  const stackRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const pageWrapRefs = useRef<(HTMLDivElement | null)[]>([])
  const pdfDocRef = useRef<Awaited<ReturnType<typeof loadContractPdfDocument>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pagesRendered, setPagesRendered] = useState(0)
  const [placement, setPlacement] = useState<SignaturePlacement>({
    pageIndex: 0,
    x: 0.35,
    y: 0.28,
    w: 0.12,
    h: 0.05,
  })
  const overlayRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ active: boolean; grabX: number; grabY: number } | null>(null)
  const scrollParentRef = useRef<HTMLElement | null>(null)
  const placementRef = useRef(placement)
  placementRef.current = placement

  const activePage = placement.pageIndex

  useEffect(() => {
    let cancelled = false
    canvasRefs.current = []
    pageWrapRefs.current = []
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
            'Não foi possível carregar o PDF para posicionar a assinatura. Verifique sua conexão e tente novamente.'
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
        setError('Não foi possível preparar o documento. Recarregue a página e tente de novo.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const pdf = pdfDocRef.current
        if (!pdf) return
        const containerW = measurePdfContainerWidth(stackRef.current)
        const rendered = await renderPdfPagesToCanvases(pdf, canvasRefs.current, containerW)
        if (cancelled) return
        if (rendered < numPages) {
          setError(`Só ${rendered} de ${numPages} páginas carregaram. Recarregue e tente novamente.`)
        }
        setPagesRendered(rendered)
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setError(
            'Não foi possível carregar o PDF para posicionar a assinatura. Verifique sua conexão e tente novamente.'
          )
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

  /** Caixa proporcional ao tamanho real da imagem da assinatura (página ativa). */
  useEffect(() => {
    if (loading || error || !signatureDataUrl) return
    const img = new Image()
    img.onload = () => {
      requestAnimationFrame(() => {
        const canvas = canvasRefs.current[activePage]
        if (!canvas?.width) return
        const { w, h } = computeNormalizedSignatureBox(
          canvas.width,
          canvas.height,
          img.naturalWidth,
          img.naturalHeight
        )
        setPlacement((p) => {
          const cx = p.x + p.w / 2
          const cy = p.y + p.h / 2
          let nx = cx - w / 2
          let ny = cy - h / 2
          nx = Math.max(0, Math.min(1 - w, nx))
          ny = Math.max(0, Math.min(1 - h, ny))
          return { ...p, w, h, x: nx, y: ny }
        })
      })
    }
    img.src = signatureDataUrl
  }, [loading, error, activePage, signatureDataUrl])

  useEffect(() => {
    if (loading || error) return
    const t = window.setTimeout(() => {
      pageWrapRefs.current[activePage]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 120)
    return () => window.clearTimeout(t)
  }, [loading, error, activePage])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d?.active) return
      e.preventDefault()
      const scroller = scrollParentRef.current
      if (scroller) {
        const sb = scroller.getBoundingClientRect()
        const edge = 56
        const step = 18
        if (e.clientY > sb.bottom - edge) {
          scroller.scrollTop += step
        } else if (e.clientY < sb.top + edge) {
          scroller.scrollTop -= step
        }
      }

      const pageIdx = pageIndexAtPoint(e.clientX, e.clientY, pageWrapRefs.current)
      if (pageIdx === null) return
      const canvas = canvasRefs.current[pageIdx]
      if (!canvas) return
      const coords = coordsOnPageCanvas(e.clientX, e.clientY, canvas)
      if (!coords) return

      const p = placementRef.current
      let x = coords.nx - d.grabX
      let y = coords.ny - d.grabY
      x = Math.min(1 - p.w, Math.max(0, x))
      y = Math.min(1 - p.h, Math.max(0, y))
      setPlacement({ ...p, pageIndex: pageIdx, x, y })
    }
    const onUp = () => {
      if (dragRef.current?.active) {
        dragRef.current = null
        scrollParentRef.current = null
      }
    }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRefs.current[activePage]
    if (!canvas) return
    scrollParentRef.current = findVerticalScrollParent(canvas)
    const coords = coordsOnPageCanvas(e.clientX, e.clientY, canvas)
    if (!coords) return
    e.preventDefault()
    e.stopPropagation()
    const p = placementRef.current
    dragRef.current = {
      active: true,
      grabX: coords.nx - p.x,
      grabY: coords.ny - p.y,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerUpLocal = (e: React.PointerEvent) => {
    if (dragRef.current?.active) {
      dragRef.current = null
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
  }

  /** Toque no canvas de outra página move a assinatura para lá. */
  const onInactivePagePointerDown = (pageIdx: number) => (e: React.PointerEvent) => {
    if (placementRef.current.pageIndex === pageIdx) return
    const canvas = canvasRefs.current[pageIdx]
    if (!canvas) return
    const coords = coordsOnPageCanvas(e.clientX, e.clientY, canvas)
    if (!coords) return
    e.preventDefault()
    const p = placementRef.current
    let x = coords.nx - p.w / 2
    let y = coords.ny - p.h / 2
    x = Math.max(0, Math.min(1 - p.w, x))
    y = Math.max(0, Math.min(1 - p.h, y))
    setPlacement({ ...p, pageIndex: pageIdx, x, y })
  }

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex flex-wrap gap-2 justify-end sm:justify-between sm:items-start gap-y-3 order-first">
        <div className="w-full sm:w-auto sm:flex-1 min-w-0 order-2 sm:order-1">
          <h3 className="text-lg font-semibold text-slate-900">Posicione sua assinatura no documento</h3>
          <p className="text-sm text-slate-500 mt-1">
            Role para ver todas as páginas do PDF. Arraste o retângulo da assinatura ou toque na página desejada
            para colocá-la ali. Ao arrastar perto da borda da tela, a área rola automaticamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto order-1 sm:order-2 shrink-0">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onBack}>
            Voltar
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
            disabled={loading || !!error}
            onClick={() => onConfirm(placement)}
          >
            Confirmar posição
          </Button>
        </div>
      </div>

      {numPages > 1 && !loading && !error && (
        <p className="text-sm text-slate-600">
          Documento com <strong>{numPages} páginas</strong> — assinatura na página{' '}
          <strong>{activePage + 1}</strong>
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-100 mx-auto p-2 sm:p-3 flex justify-center w-full min-w-0">
        <div ref={stackRef} className="flex flex-col gap-4 sm:gap-5 w-full max-w-full items-center">
          {loading && numPages === 0 && (
            <div className="flex items-center justify-center py-16 w-full">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
          )}

          {numPages > 0 &&
            Array.from({ length: numPages }, (_, i) => (
              <div
                key={i}
                ref={(el) => {
                  pageWrapRefs.current[i] = el
                }}
                className={`w-full max-w-full rounded-lg shadow-sm bg-white ${
                  activePage === i ? 'ring-2 ring-indigo-400/50' : ''
                }`}
              >
                <p className="text-center text-[11px] font-medium text-slate-500 py-1.5 px-2 border-b border-slate-100">
                  Página {i + 1} de {numPages}
                </p>
                <div className="flex justify-center p-1 sm:p-2">
                  <div className="relative inline-block align-top max-w-full">
                    {loading && pagesRendered <= i && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-lg min-h-[120px]">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      </div>
                    )}
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[i] = el
                      }}
                      className="block max-w-full select-none"
                      draggable={false}
                      onPointerDown={activePage !== i ? onInactivePagePointerDown(i) : undefined}
                    />
                  {!loading && !error && activePage === i && (
                    <>
                      <div
                        ref={overlayRef}
                        className="absolute border-2 border-indigo-600 ring-2 ring-indigo-400/35 shadow-md rounded-lg overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center touch-none z-20 bg-transparent"
                        style={{
                          left: `${placement.x * 100}%`,
                          top: `${placement.y * 100}%`,
                          width: `${placement.w * 100}%`,
                          height: `${placement.h * 100}%`,
                        }}
                        onPointerDown={onPointerDown}
                        onPointerUp={onPointerUpLocal}
                        onPointerCancel={onPointerUpLocal}
                      >
                        <img
                          src={signatureDataUrl}
                          alt=""
                          className="max-w-full max-h-full w-full h-full object-contain pointer-events-none"
                        />
                      </div>
                      <div
                        className="absolute z-[21] flex justify-center pointer-events-none"
                        style={{
                          left: `${placement.x * 100}%`,
                          width: `${placement.w * 100}%`,
                          top: `${(placement.y + placement.h) * 100}%`,
                          marginTop: 6,
                        }}
                      >
                        <span className="text-[9px] text-indigo-700 font-medium flex items-center gap-1 whitespace-nowrap rounded bg-white/95 px-1.5 py-0.5 shadow-sm border border-indigo-100">
                          <Move className="w-3 h-3 shrink-0" /> Arrastar
                        </span>
                      </div>
                    </>
                  )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
