'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { DASH_SURFACE_CARD, SITE_CONTAINER_LG } from '@/lib/siteLayout'
import { toast } from 'sonner'

type ResponseRow = {
  id: string
  quiz_id: string
  submitted_at: string
  lead_name: string | null
  lead_email: string | null
  lead_phone: string | null
  status: 'waiting' | 'in_progress' | 'attended' | 'archived'
  handled_at: string | null
  notes: string | null
  updated_at: string
  answers?: unknown
  utm?: unknown
}

type QuestionRow = {
  id: string
  order: number
  title: string
  kind: 'select' | 'short_text' | 'long_text'
  required: boolean
}

const STATUS_LABEL: Record<ResponseRow['status'], string> = {
  waiting: 'Em espera',
  in_progress: 'Em atendimento',
  attended: 'Atendido',
  archived: 'Arquivado',
}

function asRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  return v as Record<string, unknown>
}

function answerToString(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(answerToString).filter(Boolean).join(', ')
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

export default function QuizRespostasPage() {
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ResponseRow[]>([])
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const selected = useMemo(() => items.find((x) => x.id === selectedId) ?? null, [items, selectedId])

  const orderedQuestions = useMemo(
    () => questions.slice().sort((a, b) => a.order - b.order),
    [questions]
  )

  const selectedAnswers = useMemo(() => asRecord(selected?.answers), [selected?.answers])
  const selectedUtm = useMemo(() => asRecord(selected?.utm), [selected?.utm])

  const fetchResponses = async () => {
    const res = await fetch(`/api/quizzes/${id}/responses`, { credentials: 'include' })
    if (!res.ok) throw new Error('Falha ao carregar respostas')
    const data = (await res.json()) as ResponseRow[]
    setItems(Array.isArray(data) ? data : [])
    if (!selectedId && Array.isArray(data) && data.length > 0) setSelectedId(data[0].id)
  }

  const fetchQuestions = async () => {
    const res = await fetch(`/api/quizzes/${id}/questions`, { credentials: 'include' })
    if (!res.ok) throw new Error('Falha ao carregar perguntas')
    const data = (await res.json()) as QuestionRow[]
    setQuestions(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    Promise.all([fetchResponses(), fetchQuestions()])
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar dados'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const updateSelected = (patch: Partial<ResponseRow>) => {
    if (!selected) return
    setItems((prev) => prev.map((x) => (x.id === selected.id ? { ...x, ...patch } : x)))
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/quizzes/${id}/responses/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: selected.status, notes: selected.notes || '' }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar')
      toast.success('Atualizado.')
      await fetchResponses()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`space-y-6 ${SITE_CONTAINER_LG}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link href={`/dashboard/quiz/${id}/editar`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Respostas do quiz</h1>
          <p className="text-slate-500">Marque status (em espera, atendido, etc.) e faça anotações.</p>
        </div>
        <Button onClick={save} className="rounded-xl" disabled={saving || !selected}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : items.length === 0 ? (
        <Card className={`${DASH_SURFACE_CARD} p-10 text-center text-slate-500`}>
          Ainda não há respostas para este quiz.
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Card className={`${DASH_SURFACE_CARD} lg:col-span-2 overflow-hidden`}>
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-700">
              Leads ({items.length})
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {items.map((r) => {
                const active = r.id === selectedId
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                      active ? 'bg-slate-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{r.lead_name || r.lead_email || r.lead_phone || 'Lead'}</p>
                        <p className="text-xs text-slate-500 truncate">{new Date(r.submitted_at).toLocaleString('pt-BR')}</p>
                      </div>
                      <span className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700">
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className={`${DASH_SURFACE_CARD} lg:col-span-3 p-6`}>
            {!selected ? (
              <div className="text-slate-500">Selecione uma resposta.</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-xs text-slate-500">Nome</p>
                    <p className="text-sm font-medium text-slate-900">{selected.lead_name || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-xs text-slate-500">E-mail</p>
                    <p className="text-sm font-medium text-slate-900 break-all">{selected.lead_email || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-xs text-slate-500">Telefone</p>
                    <p className="text-sm font-medium text-slate-900">{selected.lead_phone || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Status</p>
                    <Select
                      value={selected.status}
                      onValueChange={(v) => updateSelected({ status: v as ResponseRow['status'] })}
                    >
                      <SelectTrigger className="rounded-xl mt-1">
                        <span>{STATUS_LABEL[selected.status]}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waiting">Em espera</SelectItem>
                        <SelectItem value="in_progress">Em atendimento</SelectItem>
                        <SelectItem value="attended">Atendido</SelectItem>
                        <SelectItem value="archived">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-xs text-slate-500">
                      {selected.handled_at && selected.status === 'attended'
                        ? `Atendido em ${new Date(selected.handled_at).toLocaleString('pt-BR')}`
                        : null}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700">Enviado em</p>
                    <div className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
                      {new Date(selected.submitted_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">Anotações</p>
                  <Textarea
                    className="rounded-xl mt-1"
                    rows={6}
                    value={selected.notes || ''}
                    onChange={(e) => updateSelected({ notes: e.target.value })}
                    placeholder="Ex.: Cliente pediu retorno amanhã às 10h."
                  />
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Respostas</h3>
                  {orderedQuestions.length === 0 ? (
                    <div className="text-sm text-slate-500">Este quiz não possui perguntas.</div>
                  ) : (
                    <div className="space-y-2">
                      {orderedQuestions.map((q, idx) => {
                        const raw = selectedAnswers[q.id]
                        const val = answerToString(raw)
                        return (
                          <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-sm font-medium text-slate-900">
                              {idx + 1}. {q.title}
                              {q.required ? <span className="text-red-500"> *</span> : null}
                            </p>
                            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap break-words">
                              {val || <span className="text-slate-400">—</span>}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {Object.keys(selectedUtm).length > 0 ? (
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">UTM</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(selectedUtm).map(([k, v]) => (
                        <div key={k} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <p className="text-xs text-slate-500">{k}</p>
                          <p className="text-sm font-medium text-slate-900 break-words">{answerToString(v) || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

