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

export function palhaMediaAspect(item: PalhaMediaItem, sizes?: { width?: number; height?: number }) {
  const width = sizes?.width || item.width || 0
  const height = sizes?.height || item.height || 0
  if (item.frame === 'quadrado') return 1
  if (width > 0 && height > 0) return width / height
  return DEFAULT_ASPECT
}

export const PALHA_GALLERY_MAX_WIDTH = 1200

export function palhaTargetRowHeight(grid: PalhaGridStyle, thumb: PalhaThumbSize) {
  const regular = thumb === 'regular'
  if (grid === 'colunas2') return regular ? 260 : 360
  if (grid === 'colunas3') return regular ? 190 : 250
  if (grid === 'mosaico') return regular ? 210 : 300
  return regular ? 220 : 310
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
  const gap = 8
  const target = palhaTargetRowHeight(options.grid, options.thumb)
  const prepared = items.map((item, index) => {
    let aspect = palhaMediaAspect(item, options.sizes?.[item.id])
    if (options.grid === 'quadrado') aspect = 1
    if (item.frame === 'largo') aspect = Math.max(aspect, 2.05)
    if (options.grid === 'mosaico' && item.frame === 'auto' && index % 7 === 0 && aspect >= 1.2) {
      aspect = Math.max(aspect, 2.1)
    }
    return { item, index, aspect }
  })

  if (options.grid === 'colunas2' || options.grid === 'colunas3') {
    let perRow = options.grid === 'colunas2' ? 2 : 3
    if (width < 720) perRow = Math.min(perRow, 2)
    if (width < 520) perRow = 1
    return chunk(prepared, perRow).map((row) =>
      row.length === perRow || perRow === 1 ? scaleRow(row, width, gap) : leftoverRow(row, target),
    )
  }

  if (options.grid === 'quadrado') {
    const cell = options.thumb === 'regular' ? Math.min(220, (width - gap * 3) / 4) : Math.min(280, (width - gap * 2) / 3)
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
