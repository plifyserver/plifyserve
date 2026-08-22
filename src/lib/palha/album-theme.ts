export const PALHA_COVER_LAYOUTS = [
  { id: 'centro', label: 'Centro', hint: 'Foto cheia, título no meio' },
  { id: 'esquerda', label: 'Esquerda', hint: 'Título no canto inferior' },
  { id: 'romance', label: 'Romance', hint: 'Texto à esquerda, foto à direita' },
  { id: 'vintage', label: 'Vintage', hint: 'Foto em cima, título embaixo' },
  { id: 'baixo', label: 'Inferior', hint: 'Título na terça parte de baixo' },
  { id: 'moldura', label: 'Moldura', hint: 'Título entre duas linhas' },
] as const

export const PALHA_TYPOGRAPHIES = [
  { id: 'sans', label: 'Sans', sample: 'Uma fonte neutra' },
  { id: 'serif', label: 'Serif', sample: 'Uma fonte clássica' },
  { id: 'modern', label: 'Modern', sample: 'Uma fonte sofisticada' },
  { id: 'timeless', label: 'Timeless', sample: 'Uma fonte leve e arejada' },
  { id: 'bold', label: 'Bold', sample: 'Uma fonte marcante' },
  { id: 'subtle', label: 'Subtle', sample: 'Uma fonte minimalista' },
] as const

export const PALHA_PALETTES = [
  { id: 'claro', label: 'Claro', swatches: ['#ffffff', '#ece9e4', '#222222'] },
  { id: 'dourado', label: 'Dourado', swatches: ['#f4e6c8', '#d7b56a', '#5a3d10'] },
  { id: 'rosa', label: 'Rosa', swatches: ['#fdecea', '#e7b3ad', '#7a3532'] },
  { id: 'terracota', label: 'Terracota', swatches: ['#f3e1d2', '#d59a72', '#6b3218'] },
  { id: 'noturno', label: 'Noturno', swatches: ['#141414', '#2a2a2a', '#f4f1ea'] },
  { id: 'marfim', label: 'Marfim', swatches: ['#efe2c4', '#cbb07d', '#5c4a28'] },
  { id: 'oliva', label: 'Oliva', swatches: ['#e7ead8', '#b4c08a', '#3d4a2e'] },
  { id: 'grafite', label: 'Grafite', swatches: ['#1c1c1c', '#3a3a3a', '#c6b089'] },
] as const

export const PALHA_GRID_STYLES = [
  { id: 'justificado', label: 'Justificada' },
  { id: 'colunas2', label: '2 colunas' },
  { id: 'colunas3', label: '3 colunas' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'quadrado', label: 'Quadrada' },
  { id: 'mosaico', label: 'Mosaico' },
] as const

export const PALHA_MEDIA_FRAMES = [
  { id: 'auto', label: 'Auto' },
  { id: 'largo', label: 'Larga' },
  { id: 'quadrado', label: 'Quadrada' },
  { id: 'inteira', label: 'Inteira' },
] as const

export const PALHA_THUMB_SIZES = [
  { id: 'pequeno', label: 'Pequeno' },
  { id: 'regular', label: 'Regular' },
  { id: 'grande', label: 'Grande' },
  { id: 'enorme', label: 'Enorme' },
] as const

export type PalhaCoverLayout = (typeof PALHA_COVER_LAYOUTS)[number]['id']
export type PalhaTypography = (typeof PALHA_TYPOGRAPHIES)[number]['id']
export type PalhaPalette = (typeof PALHA_PALETTES)[number]['id']
export type PalhaGridStyle = (typeof PALHA_GRID_STYLES)[number]['id']
export type PalhaThumbSize = (typeof PALHA_THUMB_SIZES)[number]['id']
export type PalhaMediaFrame = (typeof PALHA_MEDIA_FRAMES)[number]['id']

export type PalhaAlbumTheme = {
  cover: PalhaCoverLayout
  typography: PalhaTypography
  palette: PalhaPalette
  grid: PalhaGridStyle
  thumb: PalhaThumbSize
}

export const DEFAULT_PALHA_ALBUM_THEME: PalhaAlbumTheme = {
  cover: 'centro',
  typography: 'serif',
  palette: 'claro',
  grid: 'justificado',
  thumb: 'grande',
}

const COVER_IDS = new Set(PALHA_COVER_LAYOUTS.map((item) => item.id))
const TYPE_IDS = new Set(PALHA_TYPOGRAPHIES.map((item) => item.id))
const PALETTE_IDS = new Set(PALHA_PALETTES.map((item) => item.id))
const GRID_IDS = new Set(PALHA_GRID_STYLES.map((item) => item.id))
const THUMB_IDS = new Set(PALHA_THUMB_SIZES.map((item) => item.id))

const LEGACY_GRID: Record<string, { grid: PalhaGridStyle; thumb: PalhaThumbSize }> = {
  livre: { grid: 'justificado', thumb: 'grande' },
}

export function mergePalhaAlbumTheme(raw: unknown): PalhaAlbumTheme {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<PalhaAlbumTheme> & { grid?: string; thumb?: string }
  const legacy = LEGACY_GRID[String(data.grid || '')]
  return {
    cover: COVER_IDS.has(data.cover as PalhaCoverLayout) ? (data.cover as PalhaCoverLayout) : DEFAULT_PALHA_ALBUM_THEME.cover,
    typography: TYPE_IDS.has(data.typography as PalhaTypography)
      ? (data.typography as PalhaTypography)
      : DEFAULT_PALHA_ALBUM_THEME.typography,
    palette: PALETTE_IDS.has(data.palette as PalhaPalette)
      ? (data.palette as PalhaPalette)
      : DEFAULT_PALHA_ALBUM_THEME.palette,
    grid: GRID_IDS.has(data.grid as PalhaGridStyle)
      ? (data.grid as PalhaGridStyle)
      : (legacy?.grid ?? DEFAULT_PALHA_ALBUM_THEME.grid),
    thumb: THUMB_IDS.has(data.thumb as PalhaThumbSize)
      ? (data.thumb as PalhaThumbSize)
      : (legacy?.thumb ?? DEFAULT_PALHA_ALBUM_THEME.thumb),
  }
}
