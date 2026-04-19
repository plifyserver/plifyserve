/** Presets de “Áreas de atuação” no perfil (UI + validação na API). */
export const PRACTICE_AREA_PRESETS = [
  'Marketing Digital',
  'Designer',
  'Desenvolvedor',
  'Social Media',
  'SEO',
  'Redator',
  'Fotógrafo',
  'UI/UX Designer',
  'Motion Designer',
  'Arquiteto',
] as const

export const PRACTICE_AREA_PRESET_SET = new Set<string>(PRACTICE_AREA_PRESETS)

export function sanitizePracticeAreas(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const next = input.map((x) => String(x).trim()).filter((x) => PRACTICE_AREA_PRESET_SET.has(x))
  return [...new Set(next)]
}
