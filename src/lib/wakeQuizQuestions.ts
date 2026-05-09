import { hasUnlimitedQuotas, resolveEffectivePlan, type PlanProfileLike } from '@/lib/plan-entitlements'

export const ESSENTIAL_MAX_QUIZ_QUESTIONS = 5
/** Teto de segurança para Pro/Admin (evita payloads enormes). */
export const PRO_HARD_MAX_QUIZ_QUESTIONS = 80

export type WakeQuizQuestionType = 'selection' | 'text_small' | 'text_large'

export type WakeQuizOption = {
  id: string
  emoji: string
  label: string
  desc: string
}

export type WakeQuizQuestion = {
  /** Id estável para animações (1..n após normalizar) */
  id: number
  type: WakeQuizQuestionType
  emoji: string
  title: string
  subtitle: string
  /** Chave única no mapa de respostas (slug) */
  field: string
  options: WakeQuizOption[]
}

const DEFAULT_QUESTIONS_RAW: WakeQuizQuestion[] = [
  {
    id: 1,
    type: 'selection',
    emoji: '💈',
    title: 'Qual é o seu perfil hoje?',
    subtitle: 'Nos conte um pouco sobre seu negócio',
    field: 'perfil',
    options: [
      { id: 'autonomo', emoji: '✂️', label: 'Cabeleireiro(a) autônomo(a)', desc: 'Trabalho por conta própria' },
      { id: 'pequeno', emoji: '👥', label: 'Dono(a) de salão — até 3 profissionais', desc: 'Equipe pequena e enxuta' },
      { id: 'medio', emoji: '💼', label: 'Dono(a) de salão — 4 a 10 profissionais', desc: 'Equipe em crescimento' },
      { id: 'grande', emoji: '🔥', label: 'Dono(a) de salão — acima de 10', desc: 'Grande equipe estruturada' },
    ],
  },
  {
    id: 2,
    type: 'selection',
    emoji: '📣',
    title: 'Como você avalia seu marketing atualmente?',
    subtitle: 'Seja honesto(a) — isso é o ponto de partida!',
    field: 'marketing_atual',
    options: [
      { id: 'perdido', emoji: '😰', label: 'Estou completamente perdido(a)', desc: 'Não sei por onde começar' },
      { id: 'basico', emoji: '😐', label: 'Faço o básico, sem estratégia', desc: 'Posto às vezes, sem planejamento' },
      { id: 'investindo', emoji: '😔', label: 'Já investi, mas sem retorno claro', desc: 'Gasto mas não vejo resultado' },
      { id: 'estruturado', emoji: '😎', label: 'Tenho plano e acompanho resultados', desc: 'Marketing funcionando bem' },
    ],
  },
  {
    id: 3,
    type: 'selection',
    emoji: '💰',
    title: 'Qual é o seu faturamento médio mensal?',
    subtitle: 'Ou faturamento pessoal, se você for autônomo(a)',
    field: 'faturamento',
    options: [
      { id: '100k', emoji: '💵', label: 'Acima de R$100 mil', desc: 'Já tenho boa base para escalar' },
      { id: '50_100k', emoji: '🔥', label: 'De R$50 mil a R$100 mil', desc: 'Crescendo com consistência' },
      { id: '25_50k', emoji: '🤑', label: 'De R$25 mil a R$50 mil', desc: 'Em ritmo de evolução' },
      { id: '10_25k', emoji: '💎', label: 'De R$10 mil a R$25 mil', desc: 'Buscando acelerar' },
    ],
  },
  {
    id: 4,
    type: 'selection',
    emoji: '🎯',
    title: 'Qual é seu principal objetivo agora?',
    subtitle: 'O que você mais quer conquistar?',
    field: 'objetivo',
    options: [
      { id: 'agenda', emoji: '📅', label: 'Lotar minha agenda de clientes', desc: 'Quero mais agendamentos' },
      { id: 'fidelizar', emoji: '❤️', label: 'Fidelizar clientes existentes', desc: 'Fazer clientes voltarem sempre' },
      { id: 'premium', emoji: '👑', label: 'Atrair clientes de ticket alto', desc: 'Focar no público premium' },
      { id: 'automatizar', emoji: '⚡', label: 'Automatizar meu atendimento', desc: 'Economizar tempo e escalar' },
    ],
  },
  {
    id: 5,
    type: 'selection',
    emoji: '😣',
    title: 'Qual é sua maior dificuldade hoje?',
    subtitle: 'Identifique o principal gargalo do seu salão',
    field: 'dificuldade',
    options: [
      { id: 'poucos_clientes', emoji: '😢', label: 'Poucos clientes novos', desc: 'Tenho dificuldade em atrair' },
      { id: 'concorrencia', emoji: '😤', label: 'Muita concorrência no bairro', desc: 'Preciso me destacar' },
      { id: 'retencao', emoji: '😓', label: 'Clientes não retornam', desc: 'Falta de fidelização' },
      { id: 'divulgacao', emoji: '📱', label: 'Não sei me divulgar online', desc: 'Instagram/Google travados' },
    ],
  },
]

export const WAKE_QUIZ_DEFAULT_QUESTIONS: WakeQuizQuestion[] = DEFAULT_QUESTIONS_RAW.map((q) => ({
  ...q,
  options: q.type === 'selection' ? q.options : [],
}))

const FIELD_RE = /^[a-z][a-z0-9_]{0,63}$/

function normalizeOption(o: unknown): WakeQuizOption | null {
  if (!o || typeof o !== 'object') return null
  const r = o as Record<string, unknown>
  const id = typeof r.id === 'string' ? r.id.trim().slice(0, 80) : ''
  const emoji = typeof r.emoji === 'string' ? r.emoji.slice(0, 8) : '•'
  const label = typeof r.label === 'string' ? r.label.trim().slice(0, 200) : ''
  const desc = typeof r.desc === 'string' ? r.desc.trim().slice(0, 300) : ''
  if (!id || !label) return null
  return { id, emoji, label, desc }
}

function normalizeQuestion(raw: unknown, index: number): WakeQuizQuestion | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const typeRaw = r.type
  const type: WakeQuizQuestionType =
    typeRaw === 'text_small' || typeRaw === 'text_large' ? typeRaw : 'selection'
  const emoji = typeof r.emoji === 'string' ? r.emoji.slice(0, 8) : '❓'
  const title =
    typeof r.title === 'string' ? r.title.trim().slice(0, 300) : `Pergunta ${index + 1}`
  const subtitle = typeof r.subtitle === 'string' ? r.subtitle.trim().slice(0, 400) : ''
  let field =
    typeof r.field === 'string' ? r.field.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') : ''
  if (!FIELD_RE.test(field)) {
    field = `q_${index + 1}`
  }
  const id =
    typeof r.id === 'number' && Number.isFinite(r.id) && r.id > 0 ? Math.floor(r.id) : index + 1
  const optsIn = Array.isArray(r.options) ? r.options : []
  const options = optsIn.map((x) => normalizeOption(x)).filter(Boolean) as WakeQuizOption[]
  if (type === 'selection') {
    return { id, type, emoji, title, subtitle, field, options: options.length >= 2 ? options : [] }
  }
  return { id, type, emoji, title, subtitle, field, options: [] }
}

/** Mescla array guardado com defaults (substitui lista inteira se válida). */
export function mergeWakeQuizQuestions(stored: unknown): WakeQuizQuestion[] {
  if (!Array.isArray(stored) || stored.length === 0) {
    return WAKE_QUIZ_DEFAULT_QUESTIONS.map((q, i) => ({ ...q, id: i + 1 }))
  }
  const out: WakeQuizQuestion[] = []
  for (let i = 0; i < stored.length; i++) {
    const q = normalizeQuestion(stored[i], i)
    if (!q) continue
    if (q.type === 'selection' && q.options.length < 2) continue
    out.push({ ...q, id: i + 1 })
  }
  return out.length > 0 ? out : WAKE_QUIZ_DEFAULT_QUESTIONS.map((q, i) => ({ ...q, id: i + 1 }))
}

export function maxQuizQuestionsForPlan(profile: PlanProfileLike | null | undefined): number | null {
  const plan = resolveEffectivePlan(profile)
  if (hasUnlimitedQuotas(plan)) return null
  return ESSENTIAL_MAX_QUIZ_QUESTIONS
}

export type ValidateQuestionsResult =
  | { ok: true; questions: WakeQuizQuestion[] }
  | { ok: false; error: string }

/** Valida e normaliza antes de gravar na BD. */
export function validateWakeQuizQuestionsForSave(
  input: unknown,
  profile: PlanProfileLike | null | undefined
): ValidateQuestionsResult {
  if (!Array.isArray(input)) {
    return { ok: false, error: 'Lista de perguntas inválida.' }
  }
  const plan = resolveEffectivePlan(profile)
  const maxAllowed = hasUnlimitedQuotas(plan)
    ? PRO_HARD_MAX_QUIZ_QUESTIONS
    : ESSENTIAL_MAX_QUIZ_QUESTIONS
  if (input.length === 0) {
    return { ok: false, error: 'Adicione pelo menos uma pergunta.' }
  }
  if (input.length > maxAllowed) {
    if (!hasUnlimitedQuotas(plan)) {
      return {
        ok: false,
        error: `O plano Essential permite no máximo ${ESSENTIAL_MAX_QUIZ_QUESTIONS} perguntas. Upgrade para Pro para mais perguntas (até ${PRO_HARD_MAX_QUIZ_QUESTIONS}).`,
      }
    }
    return { ok: false, error: `Máximo de ${PRO_HARD_MAX_QUIZ_QUESTIONS} perguntas por quiz.` }
  }
  const seen = new Set<string>()
  const out: WakeQuizQuestion[] = []
  for (let i = 0; i < input.length; i++) {
    const q = normalizeQuestion(input[i], i)
    if (!q) {
      return { ok: false, error: `Pergunta ${i + 1} inválida.` }
    }
    if (q.type === 'selection' && q.options.length < 2) {
      return {
        ok: false,
        error: `Pergunta ${i + 1}: em tipo "Seleção" são necessárias pelo menos 2 opções.`,
      }
    }
    if (seen.has(q.field)) {
      return {
        ok: false,
        error: `Campo "${q.field}" está duplicado. Cada pergunta precisa de uma chave única.`,
      }
    }
    seen.add(q.field)
    out.push({ ...q, id: i + 1 })
  }
  return { ok: true, questions: out }
}

const ANSWER_KEY_RE = /^[a-z][a-z0-9_]{0,63}$/

export function sanitizeQuizAnswersPayload(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!ANSWER_KEY_RE.test(k)) continue
    if (typeof v !== 'string') continue
    const t = v.trim()
    if (t.length === 0) continue
    out[k] = t.slice(0, 4000)
  }
  return out
}

/** Respostas planas para colunas legacy (CRM / integrações antigas). */
export function legacyLeadColumnsFromQuizAnswers(
  answers: Record<string, string>
): Record<string, string | null> {
  return {
    perfil: answers.perfil ?? null,
    marketing_atual: answers.marketing_atual ?? null,
    faturamento: answers.faturamento ?? null,
    objetivo: answers.objetivo ?? null,
    dificuldade: answers.dificuldade ?? null,
  }
}

/** Re-export: rotas/API podem importar limites ao lado de `mergeWakeQuizQuestions`. */
export { hasUnlimitedQuotas, resolveEffectivePlan } from '@/lib/plan-entitlements'
