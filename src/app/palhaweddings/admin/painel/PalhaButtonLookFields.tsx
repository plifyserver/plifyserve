'use client'

import type { PalhaButtonLook } from '@/lib/palha/site-settings-shared'

function pickerHex(value: string, fallback: string) {
  const trimmed = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const r = trimmed[1]
    const g = trimmed[2]
    const b = trimmed[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return fallback
}

export function PalhaColorField({
  label,
  value,
  fallback = '#ffffff',
  placeholder = '#ffffff ou vazio',
  onChange,
}: {
  label: string
  value: string
  fallback?: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <label>
      {label}
      <span className="palha-admin-swatch">
        <input
          type="color"
          value={pickerHex(value, fallback)}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      </span>
    </label>
  )
}

const SWATCHES: { key: keyof PalhaButtonLook; label: string; fallback: string }[] = [
  { key: 'color', label: 'Escrita', fallback: '#1a1a1a' },
  { key: 'border', label: 'Borda', fallback: '#1a1a1a' },
  { key: 'fill', label: 'Cor do botão', fallback: '#ffffff' },
]

export function PalhaButtonLookFields({
  title,
  look,
  onChange,
}: {
  title: string
  look: PalhaButtonLook
  onChange: (look: PalhaButtonLook) => void
}) {
  return (
    <div className="palha-admin-swatches">
      <span className="palha-admin-field-name">{title}</span>
      <div className="palha-admin-swatch-grid">
        {SWATCHES.map((swatch) => (
          <PalhaColorField
            key={swatch.key}
            label={swatch.label}
            value={look[swatch.key]}
            fallback={swatch.fallback}
            placeholder={swatch.key === 'fill' ? 'transparent, #000000 ou vazio' : '#000000 ou vazio'}
            onChange={(value) => onChange({ ...look, [swatch.key]: value })}
          />
        ))}
      </div>
    </div>
  )
}
