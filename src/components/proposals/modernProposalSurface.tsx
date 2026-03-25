'use client'

import { createContext, useContext, type CSSProperties } from 'react'

/** Mesmo formato que `ColorPalette` em ProposalPreview (evita import circular). */
export type ModernPalette = {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export type ModernSurfaceTheme = 'dark' | 'light'

const defaultPalette: ModernPalette = {
  primary: '#6366F1',
  secondary: '#1E293B',
  accent: '#E85D4C',
  background: '#FFFFFF',
  text: '#334155',
}

type Ctx = {
  surface: ModernSurfaceTheme
  palette: ModernPalette
}

const ModernSurfaceContext = createContext<Ctx | null>(null)

export function ModernSurfaceProvider({
  surface,
  palette,
  children,
}: {
  surface: ModernSurfaceTheme
  palette: ModernPalette
  children: React.ReactNode
}) {
  const merged = { ...defaultPalette, ...palette }
  return (
    <ModernSurfaceContext.Provider value={{ surface, palette: merged }}>{children}</ModernSurfaceContext.Provider>
  )
}

export function useModernSurface() {
  const ctx = useContext(ModernSurfaceContext)
  if (!ctx) {
    return { surface: 'dark' as const, palette: defaultPalette }
  }
  return ctx
}

/** Fundo e texto base das secções escuras/claras (antes do bloco branco de conteúdo). */
export function modernSectionShell(surface: ModernSurfaceTheme, palette: ModernPalette): {
  className: string
  style: CSSProperties
} {
  if (surface === 'dark') {
    return { className: 'bg-black text-white', style: {} }
  }
  return {
    className: 'text-slate-900',
    style: { backgroundColor: palette.background },
  }
}

export function mergeModernSurfaceTheme(raw: unknown): ModernSurfaceTheme {
  return raw === 'light' ? 'light' : 'dark'
}

export function modernBorderTop(surface: ModernSurfaceTheme): string {
  return surface === 'dark' ? 'border-white/10' : 'border-slate-200'
}

export function modernPlaceholderBox(surface: ModernSurfaceTheme): string {
  return surface === 'dark'
    ? 'border-white/10 bg-white/5 text-white/40'
    : 'border-slate-200 bg-slate-100 text-slate-500'
}
