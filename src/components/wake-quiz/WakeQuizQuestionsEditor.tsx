'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, X, Save } from 'lucide-react'
import type { WakeQuizOption, WakeQuizQuestion, WakeQuizQuestionType } from '@/lib/wakeQuizQuestions'
import { ESSENTIAL_MAX_QUIZ_QUESTIONS, PRO_HARD_MAX_QUIZ_QUESTIONS } from '@/lib/wakeQuizQuestions'

type QuizPlanMeta = {
  maxQuestions: number | null
  unlimited: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  questions: WakeQuizQuestion[]
  quizPlan: QuizPlanMeta
  onSaved: (next: WakeQuizQuestion[]) => void
}

function emptyOption(i: number): WakeQuizOption {
  return {
    id: genOptionId(),
    emoji: '•',
    label: '',
    desc: '',
  }
}

function genField(): string {
  // `field` é interno; usuário não deve mexer.
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
  return `q_${uuid.slice(0, 16)}`
}

function genOptionId(): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
  return `op_${uuid.slice(0, 14)}`
}

function ensureInternalFields(list: WakeQuizQuestion[]): WakeQuizQuestion[] {
  const seen = new Set<string>()
  return list.map((q) => {
    let field = (q.field || '').toString()
    if (!/^q_[a-f0-9]{6,32}$/i.test(field)) field = genField()
    while (seen.has(field)) field = genField()
    seen.add(field)
    return { ...q, field }
  })
}

function ensureInternalOptionIds(list: WakeQuizQuestion[]): WakeQuizQuestion[] {
  return list.map((q) => {
    if (q.type !== 'selection') return q
    const seen = new Set<string>()
    const options = (q.options ?? []).map((o) => {
      let id = (o?.id || '').toString()
      if (!/^op_[a-f0-9]{6,32}$/i.test(id)) id = genOptionId()
      while (seen.has(id)) id = genOptionId()
      seen.add(id)
      return { ...o, id }
    })
    return { ...q, options }
  })
}

function newQuestion(index: number): WakeQuizQuestion {
  const n = index + 1
  return {
    id: n,
    type: 'selection',
    emoji: '❓',
    title: `Pergunta ${n}`,
    subtitle: '',
    field: genField(),
    options: [emptyOption(0), emptyOption(1)],
  }
}

export function WakeQuizQuestionsEditor({ open, onClose, questions, quizPlan, onSaved }: Props) {
  const [draft, setDraft] = useState<WakeQuizQuestion[]>(questions)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const copied = questions.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o })) }))
      setDraft(ensureInternalOptionIds(ensureInternalFields(copied)))
    }
  }, [open, questions])

  const cap = useMemo(() => {
    if (quizPlan.unlimited) return PRO_HARD_MAX_QUIZ_QUESTIONS
    return quizPlan.maxQuestions ?? ESSENTIAL_MAX_QUIZ_QUESTIONS
  }, [quizPlan])

  const canAdd = draft.length < cap

  const patchQ = useCallback((i: number, patch: Partial<WakeQuizQuestion>) => {
    setDraft((prev) => prev.map((q, j) => (j === i ? { ...q, ...patch } : q)))
  }, [])

  const patchOption = useCallback((qi: number, oi: number, patch: Partial<WakeQuizOption>) => {
    setDraft((prev) =>
      prev.map((q, j) => {
        if (j !== qi) return q
        const options = q.options.map((o, k) => (k === oi ? { ...o, ...patch } : o))
        return { ...q, options }
      })
    )
  }, [])

  const addOption = useCallback((qi: number) => {
    setDraft((prev) =>
      prev.map((q, j) =>
        j === qi ? { ...q, options: [...q.options, emptyOption(q.options.length)] } : q
      )
    )
  }, [])

  const removeOption = useCallback((qi: number, oi: number) => {
    setDraft((prev) =>
      prev.map((q, j) => {
        if (j !== qi) return q
        if (q.options.length <= 2) return q
        return { ...q, options: q.options.filter((_, k) => k !== oi) }
      })
    )
  }, [])

  const addQuestion = useCallback(() => {
    if (!canAdd) {
      toast.error(
        quizPlan.unlimited
          ? `Limite máximo de ${PRO_HARD_MAX_QUIZ_QUESTIONS} perguntas.`
          : `Plano Essential: no máximo ${ESSENTIAL_MAX_QUIZ_QUESTIONS} perguntas.`
      )
      return
    }
    setDraft((prev) => ensureInternalOptionIds(ensureInternalFields([...prev, newQuestion(prev.length)])))
  }, [canAdd, quizPlan.unlimited])

  const removeQuestion = useCallback((i: number) => {
    setDraft((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const payload = ensureInternalOptionIds(ensureInternalFields(draft))
      const res = await fetch('/api/dashboard/wake-quiz/questions', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: payload }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        questions?: WakeQuizQuestion[]
        error?: string
      }
      if (!res.ok) throw new Error(data.error || 'Erro ao guardar')
      if (data.questions) onSaved(data.questions)
      toast.success('Perguntas guardadas.')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[190] bg-black/30" aria-hidden onClick={onClose} />
      <aside
        className="fixed inset-y-0 right-0 z-[200] flex w-full max-w-lg flex-col border-l border-orange-100 bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="wake-quiz-q-editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3">
          <div>
            <h2 id="wake-quiz-q-editor-title" className="text-sm font-bold text-slate-900">
              Perguntas do quiz
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {quizPlan.unlimited
                ? `Até ${PRO_HARD_MAX_QUIZ_QUESTIONS} perguntas (Pro / Admin).`
                : `Plano Essential: até ${ESSENTIAL_MAX_QUIZ_QUESTIONS} perguntas.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-orange-50"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {draft.map((q, qi) => (
            <div
              key={`${q.field}-${qi}`}
              className="rounded-2xl border border-orange-100 bg-orange-50/40 p-3 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">#{qi + 1}</span>
                <button
                  type="button"
                  onClick={() => removeQuestion(qi)}
                  disabled={draft.length <= 1}
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40"
                  title="Remover pergunta"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Tipo</label>
                <select
                  value={q.type}
                  onChange={(e) => {
                    const type = e.target.value as WakeQuizQuestionType
                    const next: Partial<WakeQuizQuestion> = { type }
                    if (type === 'selection' && q.options.length < 2) {
                      next.options = [emptyOption(0), emptyOption(1)]
                    }
                    if (type !== 'selection') next.options = []
                    patchQ(qi, next)
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="selection">Seleção (várias opções)</option>
                  <option value="text_small">Texto curto (uma linha)</option>
                  <option value="text_large">Texto longo (várias linhas)</option>
                </select>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Emoji</label>
                  <input
                    value={q.emoji}
                    onChange={(e) => patchQ(qi, { emoji: e.target.value.slice(0, 8) })}
                    className="w-full rounded-xl border border-slate-200 px-2 py-2 text-center text-lg"
                  />
                </div>
                <div className="col-span-3" />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Título</label>
                <input
                  value={q.title}
                  onChange={(e) => patchQ(qi, { title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Subtítulo</label>
                <input
                  value={q.subtitle}
                  onChange={(e) => patchQ(qi, { subtitle: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              {q.type === 'selection' ? (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-medium text-slate-600">Opções</p>
                  {q.options.map((o, oi) => (
                    <div key={o.id} className="flex gap-2 items-start rounded-xl bg-white border border-slate-100 p-2">
                      <input
                        value={o.emoji}
                        onChange={(e) => patchOption(qi, oi, { emoji: e.target.value.slice(0, 8) })}
                        className="w-10 shrink-0 rounded-lg border border-slate-200 px-1 py-1.5 text-center text-sm"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <input
                          value={o.label}
                          onChange={(e) => patchOption(qi, oi, { label: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                          placeholder="Rótulo"
                        />
                        <input
                          value={o.desc}
                          onChange={(e) => patchOption(qi, oi, { desc: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-[11px]"
                          placeholder="Descrição (opcional)"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
                        disabled={q.options.length <= 2}
                        className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(qi)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                  >
                    <Plus className="size-3.5" /> Opção
                  </button>
                </div>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            disabled={!canAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-200 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="size-4" />
            Adicionar pergunta
          </button>
        </div>

        <div className="border-t border-orange-100 p-4 space-y-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-lg hover:bg-orange-600 disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving ? 'A guardar…' : 'Guardar perguntas'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Fechar sem guardar
          </button>
        </div>
      </aside>
    </>
  )
}
