import type { PalhaGridStyle, PalhaThumbSize } from '@/lib/palha/album-theme'
import type { PalhaMediaItem } from '@/lib/palha/site-settings-shared'

export type PalhaLaidItem = {
  item: PalhaMediaItem
  index: number
  width: number
  height: number
  objectFit: 'cover' | 'contain'
}

const DEFAULT_ASPECT = 3 / 2
const MOBILE_FALLBACK_ASPECT = 3 / 4
const WIDE_ASPECT = 1.18

export function palhaMediaAspect(item: PalhaMediaItem, sizes?: { width?: number; height?: number }) {
  const width = sizes?.width || item.width || 0
  const height = sizes?.height || item.height || 0
  if (item.frame === 'quadrado') return 1
  if (width > 0 && height > 0) return width / height
  return DEFAULT_ASPECT
}

function itemAspect(
  item: PalhaMediaItem,
  index: number,
  grid: PalhaGridStyle,
  sizes: Record<string, { width: number; height: number }> | undefined,
  narrow: boolean,
) {
  let aspect = palhaMediaAspect(item, sizes?.[item.id])
  if (!(item.width || sizes?.[item.id]?.width) && !(item.height || sizes?.[item.id]?.height) && item.frame !== 'quadrado') {
    aspect = narrow ? MOBILE_FALLBACK_ASPECT : DEFAULT_ASPECT
  }
  if (grid === 'quadrado') aspect = 1
  if (item.frame === 'largo') aspect = Math.max(aspect, 2.05)
  if (grid === 'mosaico' && item.frame === 'auto' && index % 7 === 0 && aspect >= 1.2) {
    aspect = Math.max(aspect, 2.1)
  }
  return aspect
}

function isWideEntry(entry: { item: PalhaMediaItem; aspect: number }) {
  return entry.item.frame === 'largo' || entry.aspect >= WIDE_ASPECT
}

function layoutMobilePixieset(
  prepared: { item: PalhaMediaItem; index: number; aspect: number }[],
  width: number,
  gap: number,
) {
  const rows: PalhaLaidItem[][] = []
  for (let i = 0; i < prepared.length; ) {
    const current = prepared[i]
    const next = prepared[i + 1]
    if (isWideEntry(current) || !next || isWideEntry(next)) {
      rows.push(scaleRow([current], width, gap))
      i += 1
      continue
    }
    rows.push(scaleRow([current, next], width, gap))
    i += 2
  }
  return rows
}

export const PALHA_GALLERY_MAX_WIDTH = 1200

export function palhaTargetRowHeight(grid: PalhaGridStyle, thumb: PalhaThumbSize) {
  const rank = thumb === 'pequeno' ? 0 : thumb === 'regular' ? 1 : thumb === 'grande' ? 2 : 3
  const rows: Record<PalhaGridStyle, [number, number, number, number]> = {
    justificado: [150, 220, 310, 420],
    colunas2: [190, 260, 360, 480],
    colunas3: [140, 190, 250, 340],
    vertical: [150, 220, 310, 420],
    horizontal: [150, 220, 310, 420],
    quadrado: [130, 200, 280, 380],
    mosaico: [150, 210, 300, 400],
  }
  return rows[grid][rank]
}

function scaleRow(entries: { item: PalhaMediaItem; index: number; aspect: number }[], width: number, gap: number) {
  const gaps = Math.max(0, entries.length - 1) * gap
  const totalAspect = entries.reduce((sum, entry) => sum + entry.aspect, 0) || 1
  const height = (width - gaps) / totalAspect
  return entries.map((entry) => ({
    item: entry.item,
    index: entry.index,
    width: entry.aspect * height,
    height,
    objectFit: (entry.item.frame === 'inteira' ? 'contain' : 'cover') as 'cover' | 'contain',
  }))
}

function leftoverRow(
  entries: { item: PalhaMediaItem; index: number; aspect: number }[],
  targetHeight: number,
) {
  return entries.map((entry) => ({
    item: entry.item,
    index: entry.index,
    width: entry.aspect * targetHeight,
    height: targetHeight,
    objectFit: (entry.item.frame === 'inteira' ? 'contain' : 'cover') as 'cover' | 'contain',
  }))
}

function chunk<T>(list: T[], size: number) {
  const rows: T[][] = []
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size))
  return rows
}

export function layoutPalhaGrid(
  items: PalhaMediaItem[],
  options: {
    grid: PalhaGridStyle
    thumb: PalhaThumbSize
    containerWidth: number
    sizes?: Record<string, { width: number; height: number }>
  },
): PalhaLaidItem[][] {
  const width = Math.min(PALHA_GALLERY_MAX_WIDTH, Math.max(240, options.containerWidth))
  const narrow = width < 720
  const gap = narrow ? 4 : 8
  const target = Math.min(palhaTargetRowHeight(options.grid, options.thumb), narrow ? Math.max(150, width * 0.48) : 9999)
  const prepared = items.map((item, index) => ({
    item,
    index,
    aspect: itemAspect(item, index, options.grid, options.sizes, narrow),
  }))

  if (options.grid === 'colunas2' || options.grid === 'colunas3') {
    const perRow = options.grid === 'colunas2' || narrow ? 2 : 3
    return chunk(prepared, perRow).map((row) =>
      row.length === perRow || row.length === 1 ? scaleRow(row, width, gap) : leftoverRow(row, target),
    )
  }

  if (options.grid === 'quadrado') {
    const rank = options.thumb === 'pequeno' ? 0 : options.thumb === 'regular' ? 1 : options.thumb === 'grande' ? 2 : 3
    const size = [150, 200, 280, 360][rank]
    const columns = narrow ? 2 : rank === 0 ? 5 : rank === 1 ? 4 : rank === 2 ? 3 : 2
    const cell = Math.min(size, width / columns - gap)
    const perRow = Math.max(2, Math.floor((width + gap) / (cell + gap)))
    return chunk(prepared, perRow).map((row) =>
      row.map((entry) => ({
        item: entry.item,
        index: entry.index,
        width: cell,
        height: cell,
        objectFit: (entry.item.frame === 'inteira' ? 'contain' : 'cover') as 'cover' | 'contain',
      })),
    )
  }

  if (narrow) return layoutMobilePixieset(prepared, width, gap)

  const rows: PalhaLaidItem[][] = []
  let current: typeof prepared = []
  let rowAspect = 0

  const flush = (stretch: boolean) => {
    if (!current.length) return
    rows.push(stretch ? scaleRow(current, width, gap) : leftoverRow(current, target))
    current = []
    rowAspect = 0
  }

  for (const entry of prepared) {
    const forceWide = entry.item.frame === 'largo' || (options.grid === 'mosaico' && entry.item.frame === 'auto' && entry.index % 7 === 0)
    if (forceWide && current.length) flush(true)
    current.push(entry)
    rowAspect += entry.aspect
    const rowWidth = rowAspect * target + Math.max(0, current.length - 1) * gap
    if (forceWide || rowWidth >= width) flush(true)
  }
  flush(false)
  return rows
}
