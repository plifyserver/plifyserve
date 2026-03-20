/**
 * Interpreta textos de métricas do template empresarial (ex.: "4k+", "91+") para animação numérica.
 */
export function parseEmpresarialStatValue(raw: string): {
  end: number
  format: (n: number) => string
} | null {
  const s = raw.trim()

  const km = s.match(/^(\d+(?:[.,]\d+)?)\s*([kKmM])(\+)?\s*$/i)
  if (km) {
    const end = parseFloat(km[1].replace(',', '.'))
    if (Number.isNaN(end)) return null
    const showPlus = km[3] === '+'
    const unit = km[2].toLowerCase() === 'm' ? 'M' : 'k'
    return {
      end,
      format: (n) => {
        const clamped = Math.min(end, Math.max(0, n))
        const intVal = Math.floor(clamped)
        return `${intVal}${unit}${showPlus ? '+' : ''}`
      },
    }
  }

  const numPlus = s.match(/^(\d+(?:[.,]\d+)?)\s*\+\s*$/)
  if (numPlus) {
    const end = parseFloat(numPlus[1].replace(',', '.'))
    if (Number.isNaN(end)) return null
    return {
      end,
      format: (n) => {
        const clamped = Math.min(end, Math.max(0, n))
        return `${Math.round(clamped)}+`
      },
    }
  }

  const plain = s.match(/^(\d+(?:[.,]\d+)?)\s*$/)
  if (plain) {
    const end = parseFloat(plain[1].replace(',', '.'))
    if (Number.isNaN(end)) return null
    return {
      end,
      format: (n) => {
        const clamped = Math.min(end, Math.max(0, n))
        if (Number.isInteger(end)) return String(Math.round(clamped))
        return clamped.toFixed(1).replace(/\.0$/, '').replace('.', ',')
      },
    }
  }

  return null
}
