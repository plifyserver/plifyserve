/** Snapshot gravado em `content.acceptedPlan` quando o cliente aceita (link público). */

export type AcceptedPlanSnapshot = {
  id?: string
  name: string
  description: string
  benefits: string[]
  price?: number
  priceType?: string
  highlighted?: boolean
}

export function formatAcceptedPlanBRL(price: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

export function getAcceptedPlanFromContent(content: unknown): AcceptedPlanSnapshot | null {
  if (!content || typeof content !== 'object') return null
  const ap = (content as Record<string, unknown>).acceptedPlan
  if (!ap || typeof ap !== 'object') return null
  const o = ap as Record<string, unknown>
  const name = typeof o.name === 'string' ? o.name : ''
  const description = typeof o.description === 'string' ? o.description : ''
  const benefits = Array.isArray(o.benefits)
    ? o.benefits.filter((x): x is string => typeof x === 'string')
    : []
  const price = typeof o.price === 'number' && !Number.isNaN(o.price) ? o.price : undefined
  const priceType = typeof o.priceType === 'string' ? o.priceType : undefined
  const id = typeof o.id === 'string' ? o.id : undefined
  const highlighted = o.highlighted === true
  const hasSignal =
    price != null || name.trim().length > 0 || id === 'single' || (typeof id === 'string' && id.length > 0)
  if (!hasSignal) return null
  return { id, name, description, benefits, price, priceType, highlighted }
}

export function acceptedPlanDisplayTitle(plan: AcceptedPlanSnapshot): string {
  const n = plan.name?.trim()
  if (n) return n
  if (plan.priceType === 'unique' || plan.id === 'single') return 'Valor único'
  return 'Plano selecionado'
}
