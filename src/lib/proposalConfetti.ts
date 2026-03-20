import type { ColorPalette } from '@/components/proposals/ProposalPreview'

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace('#', '').trim()
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16)
    const g = parseInt(h[1] + h[1], 16)
    const b = parseInt(h[2] + h[2], 16)
    return Number.isNaN(r) ? null : [r, g, b]
  }
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return Number.isNaN(r) ? null : [r, g, b]
}

function toConfettiColor(hex: string): string | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
}

/** Confetes usando a paleta da proposta + variações claras (canvas-confetti). */
export async function fireProposalConfetti(palette: ColorPalette): Promise<void> {
  const confetti = (await import('canvas-confetti')).default
  const base = [
    toConfettiColor(palette.primary),
    toConfettiColor(palette.accent),
    toConfettiColor(palette.secondary),
  ].filter(Boolean) as string[]

  const colors =
    base.length > 0
      ? base
      : ['#6366F1', '#F59E0B', '#1E293B', '#22c55e', '#ec4899']

  const end = Date.now() + 2800
  const tick = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.65 },
      colors,
      ticks: 220,
      gravity: 1.05,
      scalar: 0.9,
    })
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.65 },
      colors,
      ticks: 220,
      gravity: 1.05,
      scalar: 0.9,
    })
    if (Date.now() < end) {
      requestAnimationFrame(tick)
    }
  }
  tick()

  confetti({
    particleCount: 110,
    spread: 88,
    startVelocity: 38,
    origin: { x: 0.5, y: 0.55 },
    colors,
    ticks: 320,
    gravity: 0.95,
    scalar: 1.05,
  })

  window.setTimeout(() => {
    confetti({
      particleCount: 45,
      spread: 100,
      origin: { x: 0.35, y: 0.35 },
      colors,
      ticks: 200,
      shapes: ['circle', 'square'],
    })
    confetti({
      particleCount: 45,
      spread: 100,
      origin: { x: 0.65, y: 0.35 },
      colors,
      ticks: 200,
      shapes: ['circle', 'square'],
    })
  }, 320)
}
