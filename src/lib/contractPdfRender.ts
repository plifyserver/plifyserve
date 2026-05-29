import type { PDFDocumentProxy } from 'pdfjs-dist'

export const CONTRACT_PDFJS_WORKER =
  'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs'

export const CONTRACT_PDF_MAX_SCALE = 1.55

export function viewportScaleForWidth(
  pageWidthAtScale1: number,
  containerWidth: number,
  maxScale = CONTRACT_PDF_MAX_SCALE
): number {
  const w = Math.max(1, containerWidth - 8)
  return Math.min(maxScale, Math.max(0.35, w / pageWidthAtScale1))
}

export async function initPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = CONTRACT_PDFJS_WORKER
  return pdfjs
}

/** Carrega o PDF via fetch (mais fiável no mobile que URL direta no pdf.js). */
export async function loadContractPdfDocument(pdfUrl: string): Promise<PDFDocumentProxy> {
  const pdfjs = await initPdfJs()
  try {
    const res = await fetch(pdfUrl, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.arrayBuffer()
    return await pdfjs.getDocument({ data }).promise
  } catch {
    return await pdfjs.getDocument({ url: pdfUrl, withCredentials: false }).promise
  }
}

export async function waitForCanvasRefs(
  refs: { current: (HTMLCanvasElement | null)[] },
  count: number,
  maxFrames = 48
): Promise<boolean> {
  for (let f = 0; f < maxFrames; f++) {
    let ok = true
    for (let i = 0; i < count; i++) {
      if (!refs.current[i]) {
        ok = false
        break
      }
    }
    if (ok) return true
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
  }
  return false
}

export async function renderPdfPagesToCanvases(
  pdf: PDFDocumentProxy,
  canvases: (HTMLCanvasElement | null)[],
  containerWidth: number
): Promise<number> {
  const count = pdf.numPages
  let rendered = 0
  for (let i = 0; i < count; i++) {
    const canvas = canvases[i]
    if (!canvas) continue
    const page = await pdf.getPage(i + 1)
    const baseVp = page.getViewport({ scale: 1 })
    const scale = viewportScaleForWidth(baseVp.width, containerWidth)
    const viewport = page.getViewport({ scale })
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: ctx, viewport }).promise
    rendered++
  }
  return rendered
}

export function measurePdfContainerWidth(
  stackEl: HTMLElement | null,
  fallback = 360
): number {
  if (stackEl?.clientWidth && stackEl.clientWidth > 0) return stackEl.clientWidth
  if (typeof window !== 'undefined') return Math.min(window.innerWidth - 32, 720)
  return fallback
}
