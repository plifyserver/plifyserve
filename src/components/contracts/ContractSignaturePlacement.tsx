'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Move } from 'lucide-react'

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
  /** 40% menor que o cálculo proporcional (pedido do produto). */
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

export default function ContractSignaturePlacement({ pdfUrl, signatureDataUrl, onConfirm, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(1)
  const [pageIndex, setPageIndex] = useState(0)
  const [placement, setPlacement] = useState<SignaturePlacement>({
    pageIndex: 0,
    x: 0.35,
    y: 0.28,
    /** Substituído após medir a imagem; placeholder (~40% menor que antes) */
    w: 0.12,
    h: 0.05,
  })
  const overlayRef = useRef<HTMLDivElement>(null)
  /** Arraste por “ponto de agarra” em coordenadas normalizadas no canvas (estável com scroll). */
  const dragRef = useRef<{ active: boolean; grabX: number; grabY: number } | null>(null)
  const scrollParentRef = useRef<HTMLElement | null>(null)
  const placementRef = useRef(placement)
  placementRef.current = placement

  const renderPage = useCallback(
    async (pdfjs: typeof import('pdfjs-dist'), pageIdx: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const loadingTask = pdfjs.getDocument({ url: pdfUrl, withCredentials: false })
      const pdf = await loadingTask.promise
      setNumPages(pdf.numPages)
      const page = await pdf.getPage(pageIdx + 1)
      const scale = 1.55
      const viewport = page.getViewport({ scale })
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      const task = page.render({ canvasContext: ctx, viewport })
      await task.promise
    },
    [pdfUrl]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`
        if (cancelled) return
        await renderPage(pdfjs, pageIndex)
      } catch (e) {
        console.error(e)
        setError(
          'Não foi possível carregar o PDF para posicionar a assinatura. Verifique se o arquivo está público e tente novamente.'
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pdfUrl, pageIndex, renderPage])

  useEffect(() => {
    setPlacement((p) => ({ ...p, pageIndex }))
  }, [pageIndex])

  /** Caixa proporcional ao tamanho real da imagem da assinatura (e à página atual do PDF). */
  useEffect(() => {
    if (loading || error || !signatureDataUrl) return
    const img = new Image()
    img.onload = () => {
      requestAnimationFrame(() => {
        const canvas = canvasRef.current
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
    img.onerror = () => {
      /* mantém placeholder */
    }
    img.src = signatureDataUrl
  }, [loading, error, pageIndex, signatureDataUrl])

  /** Garante que a caixa de assinatura entre na área visível após carregar o PDF. */
  useEffect(() => {
    if (loading || error) return
    const t = window.setTimeout(() => {
      overlayRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 100)
    return () => window.clearTimeout(t)
  }, [loading, error, pageIndex])

  /** Pointermove no window: posição recalculada pelo retângulo do canvas a cada frame (cobre a página inteira e scroll). */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      const canvas = canvasRef.current
      if (!d?.active || !canvas) return
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
      const rect = canvas.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return
      const nx = (e.clientX - rect.left) / rect.width
      const ny = (e.clientY - rect.top) / rect.height
      const p = placementRef.current
      let x = nx - d.grabX
      let y = ny - d.grabY
      x = Math.min(1 - p.w, Math.max(0, x))
      y = Math.min(1 - p.h, Math.max(0, y))
      setPlacement({ ...p, x, y })
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
    const canvas = canvasRef.current
    if (!canvas) return
    scrollParentRef.current = findVerticalScrollParent(canvas)
    const rect = canvas.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return
    e.preventDefault()
    e.stopPropagation()
    const p = placementRef.current
    const nx = (e.clientX - rect.left) / rect.width
    const ny = (e.clientY - rect.top) / rect.height
    dragRef.current = {
      active: true,
      grabX: nx - p.x,
      grabY: ny - p.y,
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

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex flex-wrap gap-2 justify-end sm:justify-between sm:items-start gap-y-3 order-first">
        <div className="w-full sm:w-auto sm:flex-1 min-w-0 order-2 sm:order-1">
          <h3 className="text-lg font-semibold text-slate-900">Posicione sua assinatura no documento</h3>
          <p className="text-sm text-slate-500 mt-1">
            Arraste o retângulo para qualquer ponto do PDF. Se o documento for mais alto que a tela, role esta janela
            para baixo ou, ao arrastar, encoste o cursor na borda inferior da área visível para rolar automaticamente.
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
            onClick={() => onConfirm({ ...placement, pageIndex })}
          >
            Confirmar posição
          </Button>
        </div>
      </div>

      {numPages > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600">Página:</span>
          <select
            value={pageIndex}
            onChange={(e) => setPageIndex(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
          >
            {Array.from({ length: numPages }, (_, i) => (
              <option key={i} value={i}>
                {i + 1} de {numPages}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      )}

      {/*
        Sem max-height/overflow interno: o canvas costuma ser mais alto que a tela; um painel interno com scroll
        impede que clientY alcance a parte inferior do PDF (coordenada normalizada trava). O scroll fica no modal/página.
      */}
      <div className="rounded-2xl border border-slate-200 bg-slate-100 mx-auto p-2 sm:p-3 flex justify-center w-full min-w-0">
        <div ref={wrapRef} className="relative inline-block align-top">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-lg">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
          )}
          <canvas ref={canvasRef} className="block max-w-full h-auto w-auto select-none" draggable={false} />
          {!loading && !error && (
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
  )
}
