'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Copy, ExternalLink, Globe, Loader2, Plus, Save, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DASH_SURFACE_CARD, SITE_CONTAINER_LG } from '@/lib/siteLayout'
import { useAuth } from '@/contexts/AuthContext'
import { resolveEffectivePlan, hasUnlimitedQuotas, ESSENTIAL_MAX_QUIZ_QUESTIONS } from '@/lib/plan-entitlements'
import { toast } from 'sonner'

const FORM_INPUT_CLASS =
  'bg-white text-slate-900 border-slate-200 placeholder:text-slate-400 dark:bg-white dark:text-slate-900 dark:border-slate-200 dark:caret-slate-900'
const FORM_TEXTAREA_CLASS =
  'bg-white text-slate-900 border-slate-200 placeholder:text-slate-400 dark:bg-white dark:text-slate-900 dark:border-slate-200 dark:caret-slate-900'

type QuizRow = {
  id: string
  title: string
  slug: string
  logo_url: string | null
  intro_title: string | null
  intro_description: string | null
  thanks_title: string | null
  thanks_description: string | null
  thanks_badge_emoji: string | null
  thanks_badge_text: string | null
  thanks_title_top: string | null
  thanks_title_bottom: string | null
  thanks_highlights: unknown
  thanks_callout_title: string | null
  thanks_callout_text: string | null
  hero_badge_emoji: string | null
  hero_badge_text: string | null
  hero_title_top: string | null
  hero_title_bottom: string | null
  hero_description: string | null
  hero_floating_items: unknown
  start_button_label: string | null
  social_proof_text: string | null
  is_published: boolean
}

type QuestionRow = {
  id: string
  quiz_id: string
  order: number
  title: string
  description: string | null
  emoji?: string | null
  kind: 'select' | 'short_text' | 'long_text'
  required: boolean
  options: unknown
  placeholder: string | null
}

type SelectOption = { emoji?: string; title: string; description?: string }

type FloatingItem = { emoji: string; label: string }

function asFloatingItems(v: unknown): FloatingItem[] {
  if (!Array.isArray(v)) return []
  const out: FloatingItem[] = []
  for (const x of v) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const emoji = typeof o.emoji === 'string' ? o.emoji.trim() : ''
    const label = typeof o.label === 'string' ? o.label.trim() : (typeof o.title === 'string' ? o.title.trim() : '')
    if (!emoji || !label) continue
    out.push({ emoji, label })
  }
  return out.slice(0, 3)
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function optionsToText(opts: unknown): string {
  if (!Array.isArray(opts)) return ''
  return opts
    .map((x) => {
      if (typeof x === 'string') return x
      if (!x || typeof x !== 'object') return ''
      const o = x as Partial<SelectOption>
      const title = typeof o.title === 'string' ? o.title.trim() : ''
      const emoji = typeof o.emoji === 'string' ? o.emoji.trim() : ''
      const desc = typeof o.description === 'string' ? o.description.trim() : ''
      if (!title) return ''
      // formato: emoji | título | descrição
      return [emoji, title, desc].filter((p) => p && String(p).trim().length > 0).join(' | ')
    })
    .filter(Boolean)
    .join('\n')
}

function textToOptions(text: string): (string | SelectOption)[] {
  return text
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 50)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim()).filter(Boolean)
      if (parts.length <= 1) return line
      // 2+ partes: [emoji?] | title | desc?
      if (parts.length === 2) {
        return { title: parts[0], description: parts[1] }
      }
      return {
        emoji: parts[0],
        title: parts[1] || parts[0],
        description: parts.slice(2).join(' | ') || undefined,
      }
    })
}

type ThanksHighlight = { emoji: string; label: string; value: string }

function asThanksHighlights(v: unknown): ThanksHighlight[] {
  if (!Array.isArray(v)) return []
  const out: ThanksHighlight[] = []
  for (const x of v) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const emoji = typeof o.emoji === 'string' ? o.emoji.trim() : ''
    const label = typeof o.label === 'string' ? o.label.trim() : ''
    const value = typeof o.value === 'string' ? o.value.trim() : ''
    if (!emoji || !label || !value) continue
    out.push({ emoji, label, value })
  }
  return out.slice(0, 3)
}

export default function EditarQuizPage() {
  const params = useParams()
  const id = params.id as string
  const { profile } = useAuth()

  const effPlan = useMemo(() => resolveEffectivePlan(profile), [profile])
  const unlimited = useMemo(() => hasUnlimitedQuotas(effPlan), [effPlan])
  const questionsLimit = unlimited ? null : ESSENTIAL_MAX_QUIZ_QUESTIONS

  const [loading, setLoading] = useState(true)
  const [quiz, setQuiz] = useState<QuizRow | null>(null)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [float1Emoji, setFloat1Emoji] = useState('')
  const [float1Label, setFloat1Label] = useState('')
  const [float2Emoji, setFloat2Emoji] = useState('')
  const [float2Label, setFloat2Label] = useState('')
  const [float3Emoji, setFloat3Emoji] = useState('')
  const [float3Label, setFloat3Label] = useState('')

  const [th1Emoji, setTh1Emoji] = useState('')
  const [th1Label, setTh1Label] = useState('')
  const [th1Value, setTh1Value] = useState('')
  const [th2Emoji, setTh2Emoji] = useState('')
  const [th2Label, setTh2Label] = useState('')
  const [th2Value, setTh2Value] = useState('')
  const [th3Emoji, setTh3Emoji] = useState('')
  const [th3Label, setTh3Label] = useState('')
  const [th3Value, setTh3Value] = useState('')

  // (removido) seletor de ícone central da tela final

  const [qDialogOpen, setQDialogOpen] = useState(false)
  const [qEditing, setQEditing] = useState<QuestionRow | null>(null)
  const [qOptions, setQOptions] = useState<SelectOption[]>([])
  const [qForm, setQForm] = useState({
    title: '',
    description: '',
    emoji: '',
    kind: 'short_text' as QuestionRow['kind'],
    required: false,
    placeholder: '',
  })

  const origin = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), [])

  const fetchAll = async () => {
    const resQuiz = await fetch(`/api/quizzes/${id}`, { credentials: 'include' })
    if (!resQuiz.ok) throw new Error('Quiz não encontrado')
    const quizData = (await resQuiz.json()) as QuizRow
    setQuiz(quizData)
    const floats = asFloatingItems((quizData as { hero_floating_items?: unknown }).hero_floating_items ?? [])
    setFloat1Emoji(floats[0]?.emoji ?? '')
    setFloat1Label(floats[0]?.label ?? '')
    setFloat2Emoji(floats[1]?.emoji ?? '')
    setFloat2Label(floats[1]?.label ?? '')
    setFloat3Emoji(floats[2]?.emoji ?? '')
    setFloat3Label(floats[2]?.label ?? '')

    const th = asThanksHighlights((quizData as { thanks_highlights?: unknown }).thanks_highlights ?? [])
    setTh1Emoji(th[0]?.emoji ?? '')
    setTh1Label(th[0]?.label ?? '')
    setTh1Value(th[0]?.value ?? '')
    setTh2Emoji(th[1]?.emoji ?? '')
    setTh2Label(th[1]?.label ?? '')
    setTh2Value(th[1]?.value ?? '')
    setTh3Emoji(th[2]?.emoji ?? '')
    setTh3Label(th[2]?.label ?? '')
    setTh3Value(th[2]?.value ?? '')

    const resQ = await fetch(`/api/quizzes/${id}/questions`, { credentials: 'include' })
    const qs = resQ.ok ? ((await resQ.json()) as QuestionRow[]) : []
    setQuestions(Array.isArray(qs) ? qs : [])
  }

  useEffect(() => {
    fetchAll()
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar quiz'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const saveQuiz = async () => {
    if (!quiz) return
    setSaving(true)
    try {
      const rawFloats = [
        { emoji: float1Emoji.trim(), label: float1Label.trim() },
        { emoji: float2Emoji.trim(), label: float2Label.trim() },
        { emoji: float3Emoji.trim(), label: float3Label.trim() },
      ]

      const floatingParsed = rawFloats
        .filter((x) => x.emoji.length > 0 || x.label.length > 0)
        .map((x, idx) => {
          if (!x.emoji) throw new Error(`Preencha o emoji do item ${idx + 1}.`)
          if (!x.label) throw new Error(`Preencha o texto do item ${idx + 1}.`)
          if (countWords(x.label) > 4) throw new Error(`O texto do item ${idx + 1} precisa ter no máximo 4 palavras.`)
          return x
        })
        .slice(0, 3)

      // Cards de resultado são opcionais: só salvamos os cards completos.
      const thanksHighlights = [
        { emoji: th1Emoji.trim(), label: th1Label.trim(), value: th1Value.trim() },
        { emoji: th2Emoji.trim(), label: th2Label.trim(), value: th2Value.trim() },
        { emoji: th3Emoji.trim(), label: th3Label.trim(), value: th3Value.trim() },
      ]
        .filter((x) => x.emoji.length > 0 && x.label.length > 0 && x.value.length > 0)
        .map((x, idx) => {
          if (countWords(x.label) > 4) throw new Error(`O título do resultado ${idx + 1} precisa ter no máximo 4 palavras.`)
          return x
        })
        .slice(0, 3)

      const res = await fetch(`/api/quizzes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: quiz.title,
          slug: quiz.slug,
          logo_url: quiz.logo_url,
          intro_title: quiz.intro_title,
          intro_description: quiz.intro_description,
          thanks_title: quiz.thanks_title,
          thanks_description: quiz.thanks_description,
          thanks_badge_emoji: quiz.thanks_badge_emoji,
          thanks_badge_text: quiz.thanks_badge_text,
          thanks_title_top: quiz.thanks_title_top,
          thanks_title_bottom: quiz.thanks_title_bottom,
          thanks_highlights: thanksHighlights,
          thanks_callout_title: quiz.thanks_callout_title,
          thanks_callout_text: quiz.thanks_callout_text,
          hero_badge_emoji: quiz.hero_badge_emoji,
          hero_badge_text: quiz.hero_badge_text,
          hero_title_top: quiz.hero_title_top,
          hero_title_bottom: quiz.hero_title_bottom,
          hero_description: quiz.hero_description,
          hero_floating_items: floatingParsed,
          start_button_label: quiz.start_button_label,
          social_proof_text: quiz.social_proof_text,
          is_published: quiz.is_published,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar')
      toast.success('Quiz salvo.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar'
      if (/schema cache/i.test(msg) && /column/i.test(msg)) {
        toast.error(
          'Seu banco ainda não tem as colunas novas do quiz. Aplique as migrations de hoje no Supabase (tela final/ícone) e tente salvar novamente.'
        )
      } else {
        toast.error(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const publishNow = async (publish: boolean) => {
    if (!quiz) return
    if (publish && questions.length === 0) {
      toast.error('Adicione pelo menos 1 pergunta antes de publicar.')
      return
    }
    const prev = quiz.is_published
    setQuiz({ ...quiz, is_published: publish })
    setSaving(true)
    try {
      const res = await fetch(`/api/quizzes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_published: publish }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Falha ao publicar')
      toast.success(publish ? 'Quiz publicado.' : 'Quiz despublicado.')
    } catch (e) {
      setQuiz({ ...quiz, is_published: prev })
      toast.error(e instanceof Error ? e.message : 'Erro ao publicar')
    } finally {
      setSaving(false)
    }
  }

  const uploadLogo = async (file: File) => {
    const form = new FormData()
    form.set('file', file)
    const res = await fetch(`/api/quizzes/${id}/logo`, { method: 'POST', body: form, credentials: 'include' })
    const data = (await res.json().catch(() => ({}))) as { url?: string; quiz?: QuizRow; error?: string }
    if (!res.ok || !data.url) throw new Error(data.error || 'Falha ao enviar imagem')
    setQuiz((prev) => {
      if (!prev) return prev
      if (data.quiz) return data.quiz
      return { ...prev, logo_url: data.url ?? null }
    })
    toast.success('Logo atualizada.')
  }

  const clearLogo = async () => {
    const res = await fetch(`/api/quizzes/${id}/logo`, { method: 'DELETE', credentials: 'include' })
    const data = (await res.json().catch(() => ({}))) as { quiz?: QuizRow; error?: string }
    if (!res.ok) throw new Error(data.error || 'Não foi possível remover')
    setQuiz((prev) => {
      if (!prev) return prev
      return data.quiz ? data.quiz : { ...prev, logo_url: null }
    })
    toast.success('Logo removida.')
  }

  const openNewQuestion = () => {
    if (!unlimited && questions.length >= ESSENTIAL_MAX_QUIZ_QUESTIONS) {
      toast.error(`No plano Essential o limite é ${ESSENTIAL_MAX_QUIZ_QUESTIONS} perguntas por quiz.`)
      return
    }
    setQEditing(null)
    setQOptions([{ emoji: '', title: '', description: '' }])
    setQForm({ title: '', description: '', emoji: '', kind: 'short_text', required: false, placeholder: '' })
    setQDialogOpen(true)
  }

  const openEditQuestion = (q: QuestionRow) => {
    setQEditing(q)
    const opts = Array.isArray(q.options)
      ? q.options
          .map((x) => {
            if (typeof x === 'string') return { title: x.trim(), emoji: '', description: '' }
            if (!x || typeof x !== 'object') return null
            const o = x as Partial<SelectOption>
            const title = typeof o.title === 'string' ? o.title.trim() : ''
            if (!title) return null
            return {
              title,
              emoji: typeof o.emoji === 'string' ? o.emoji.trim() : '',
              description: typeof o.description === 'string' ? o.description.trim() : '',
            }
          })
          .filter(Boolean)
      : []
    setQOptions((opts as SelectOption[]).length ? (opts as SelectOption[]) : [{ emoji: '', title: '', description: '' }])
    setQForm({
      title: q.title,
      description: q.description || '',
      emoji: q.emoji || '',
      kind: q.kind,
      required: q.required,
      placeholder: q.placeholder || '',
    })
    setQDialogOpen(true)
  }

  const addOptionRow = () => {
    setQOptions((prev) => [...prev, { emoji: '', title: '', description: '' }].slice(0, 50))
  }

  const removeOptionRow = (idx: number) => {
    setQOptions((prev) => {
      const next = prev.slice()
      next.splice(idx, 1)
      return next.length ? next : [{ emoji: '', title: '', description: '' }]
    })
  }

  const updateOptionRow = (idx: number, patch: Partial<SelectOption>) => {
    setQOptions((prev) => {
      const next = prev.slice()
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }

  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanOptions =
      qForm.kind === 'select'
        ? qOptions
            .map((o) => ({
              emoji: (o.emoji || '').trim(),
              title: (o.title || '').trim(),
              description: (o.description || '').trim(),
            }))
            .filter((o) => o.title.length > 0)
            .map((o) => ({
              ...(o.emoji ? { emoji: o.emoji } : {}),
              title: o.title,
              ...(o.description ? { description: o.description } : {}),
            }))
            .slice(0, 50)
        : []

    const payload = {
      title: qForm.title.trim(),
      description: qForm.description.trim() || null,
      emoji: qForm.emoji.trim() || null,
      kind: qForm.kind,
      required: qForm.required,
      options: cleanOptions,
      placeholder: qForm.placeholder.trim() || null,
      order: qEditing ? qEditing.order : questions.length,
    }
    if (!payload.title) return
    if (payload.kind === 'select' && (payload.options as unknown[]).length === 0) {
      toast.error('Adicione pelo menos 1 opção de resposta.')
      return
    }

    try {
      if (qEditing) {
        const res = await fetch(`/api/quizzes/${id}/questions/${qEditing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        if (!res.ok) throw new Error(data.error || 'Falha ao salvar pergunta')
        toast.success('Pergunta salva.')
      } else {
        const res = await fetch(`/api/quizzes/${id}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
        if (!res.ok) throw new Error(data.message || data.error || 'Falha ao criar pergunta')
        toast.success('Pergunta criada.')
      }
      setQDialogOpen(false)
      await fetchAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar pergunta')
    }
  }

  const deleteQuestion = async (questionId: string) => {
    const res = await fetch(`/api/quizzes/${id}/questions/${questionId}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) {
      toast.error('Não foi possível excluir a pergunta.')
      return
    }
    setQuestions((prev) => prev.filter((x) => x.id !== questionId))
    toast.success('Pergunta excluída.')
  }

  const deleteQuiz = async () => {
    const res = await fetch(`/api/quizzes/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) {
      toast.error('Não foi possível excluir o quiz.')
      return false
    }
    window.location.href = '/dashboard/quiz'
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${SITE_CONTAINER_LG}`}>
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className={`${SITE_CONTAINER_LG}`}>
        <Card className={`${DASH_SURFACE_CARD} p-8 text-center`}>Quiz não encontrado.</Card>
      </div>
    )
  }

  const publicUrl = origin ? `${origin}/q/${quiz.slug}` : `/q/${quiz.slug}`

  const copyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast.success('Link copiado!')
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente: ' + publicUrl)
    }
  }

  return (
    <div className={`space-y-6 ${SITE_CONTAINER_LG}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar quiz</h1>
          <p className="text-slate-500">
            Link público:{' '}
            <a className="text-indigo-600 hover:underline" href={publicUrl} target="_blank" rel="noreferrer">
              {publicUrl}
            </a>{' '}
            <button
              type="button"
              onClick={copyPublicLink}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title="Copiar link"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar
            </button>
          </p>
          {!unlimited ? (
            <p className="text-xs text-amber-700 mt-1">
              Plano Essential: até {ESSENTIAL_MAX_QUIZ_QUESTIONS} perguntas por quiz.{' '}
              <Link href="/dashboard/planos" className="underline">Upgrade para o Pro</Link>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/dashboard/quiz/${id}/respostas`}>
              Respostas
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir quiz
            </a>
          </Button>
          <Button onClick={saveQuiz} className="rounded-xl" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
          {quiz.is_published ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
              disabled={saving}
              onClick={() => publishNow(false)}
              title="Despublicar quiz"
            >
              <Globe className="w-4 h-4 mr-2" />
              Despublicar
            </Button>
          ) : (
            <Button
              type="button"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={saving}
              onClick={() => publishNow(true)}
              title="Publicar quiz"
            >
              <Globe className="w-4 h-4 mr-2" />
              Publicar
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <Card className={`${DASH_SURFACE_CARD} p-4 sm:p-6 space-y-4`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome *</Label>
            <Input
              className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Slug (link) *</Label>
            <Input
              className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
              value={quiz.slug}
              onChange={(e) => setQuiz({ ...quiz, slug: e.target.value })}
            />
            <p className="mt-2 text-xs text-slate-500">O link público é `/q/{quiz.slug}`.</p>
          </div>
        </div>

        <div>
          <Label>Logo (opcional)</Label>
          <p className="mt-1 text-xs text-slate-500">
            O envio grava logo no quiz (não depende do botão Salvar). O texto de abertura continua usando Salvar.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <UploadCloud className="h-4 w-4" />
              Enviar logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  uploadLogo(f).catch((err) => toast.error(err instanceof Error ? err.message : 'Erro no upload'))
                }}
              />
            </label>
            {quiz.logo_url ? (
              <>
                <a href={quiz.logo_url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">
                  Ver logo atual
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200"
                  onClick={() => clearLogo().catch((err) => toast.error(err instanceof Error ? err.message : 'Erro'))}
                >
                  Remover logo
                </Button>
              </>
            ) : (
              <span className="text-sm text-slate-500">Nenhuma logo definida.</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Título de abertura</Label>
            <Input
              className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
              value={quiz.intro_title || ''}
              onChange={(e) => setQuiz({ ...quiz, intro_title: e.target.value || null })}
              placeholder="Ex.: Responda e receba uma recomendação"
            />
          </div>
          <div>
            <Label>Título de agradecimento</Label>
            <Input
              className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
              value={quiz.thanks_title || ''}
              onChange={(e) => setQuiz({ ...quiz, thanks_title: e.target.value || null })}
              placeholder="Ex.: Obrigado! Já recebemos suas respostas."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Descrição de abertura</Label>
            <Textarea
              className={`rounded-xl mt-1 ${FORM_TEXTAREA_CLASS}`}
              rows={3}
              value={quiz.intro_description || ''}
              onChange={(e) => setQuiz({ ...quiz, intro_description: e.target.value || null })}
              placeholder="Ex.: Isso leva menos de 1 minuto."
            />
          </div>
          <div>
            <Label>Descrição de agradecimento</Label>
            <Textarea
              className={`rounded-xl mt-1 ${FORM_TEXTAREA_CLASS}`}
              rows={3}
              value={quiz.thanks_description || ''}
              onChange={(e) => setQuiz({ ...quiz, thanks_description: e.target.value || null })}
              placeholder="Ex.: Entraremos em contato pelo WhatsApp."
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Tela final (obrigado / resultado)</p>
            <p className="text-xs text-slate-500 mt-1">
              Personalize o visual da tela de resultado igual ao print (badge, título em 2 cores e cards).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Emoji do badge (opcional)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.thanks_badge_emoji || ''}
                onChange={(e) => setQuiz({ ...quiz, thanks_badge_emoji: e.target.value || null })}
                placeholder="Ex.: 🎉"
              />
            </div>
            <div>
              <Label>Texto do badge (opcional)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.thanks_badge_text || ''}
                onChange={(e) => setQuiz({ ...quiz, thanks_badge_text: e.target.value || null })}
                placeholder="Ex.: Seu plano está pronto!"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Título (linha 1 — preto)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.thanks_title_top || ''}
                onChange={(e) => setQuiz({ ...quiz, thanks_title_top: e.target.value || null })}
                placeholder="Ex.: Montamos um plano exclusivo"
              />
            </div>
            <div>
              <Label>Título (linha 2 — laranja)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.thanks_title_bottom || ''}
                onChange={(e) => setQuiz({ ...quiz, thanks_title_bottom: e.target.value || null })}
                placeholder="Ex.: para lotar seu salão"
              />
            </div>
          </div>

          <div>
            <Label>3 cards de resultado</Label>
            <p className="mt-1 text-xs text-slate-500">Cada card: emoji + título (até 4 palavras) + valor.</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-xs font-semibold text-slate-700">Card 1</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Input className={`rounded-xl ${FORM_INPUT_CLASS}`} value={th1Emoji} onChange={(e) => setTh1Emoji(e.target.value)} placeholder="Emoji" />
                  <Input className={`rounded-xl ${FORM_INPUT_CLASS}`} value={th1Label} onChange={(e) => setTh1Label(e.target.value)} placeholder="Título (até 4 palavras)" />
                  <Input className={`rounded-xl ${FORM_INPUT_CLASS}`} value={th1Value} onChange={(e) => setTh1Value(e.target.value)} placeholder="Valor (ex.: +36%)" />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-xs font-semibold text-slate-700">Card 2</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Input className={`rounded-xl ${FORM_INPUT_CLASS}`} value={th2Emoji} onChange={(e) => setTh2Emoji(e.target.value)} placeholder="Emoji" />
                  <Input className={`rounded-xl ${FORM_INPUT_CLASS}`} value={th2Label} onChange={(e) => setTh2Label(e.target.value)} placeholder="Título (até 4 palavras)" />
                  <Input className={`rounded-xl ${FORM_INPUT_CLASS}`} value={th2Value} onChange={(e) => setTh2Value(e.target.value)} placeholder="Valor (ex.: 22+)" />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-xs font-semibold text-slate-700">Card 3</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Input className={`rounded-xl ${FORM_INPUT_CLASS}`} value={th3Emoji} onChange={(e) => setTh3Emoji(e.target.value)} placeholder="Emoji" />
                  <Input className={`rounded-xl ${FORM_INPUT_CLASS}`} value={th3Label} onChange={(e) => setTh3Label(e.target.value)} placeholder="Título (até 4 palavras)" />
                  <Input className={`rounded-xl ${FORM_INPUT_CLASS}`} value={th3Value} onChange={(e) => setTh3Value(e.target.value)} placeholder="Valor (ex.: 30 dias)" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Título do card final (opcional)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.thanks_callout_title || ''}
                onChange={(e) => setQuiz({ ...quiz, thanks_callout_title: e.target.value || null })}
                placeholder="Ex.: Em breve entraremos em contato!"
              />
            </div>
            <div>
              <Label>Texto do card final (opcional)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.thanks_callout_text || ''}
                onChange={(e) => setQuiz({ ...quiz, thanks_callout_text: e.target.value || null })}
                placeholder="Ex.: Entraremos em contato em até 24h..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Tela inicial (estilo do print)</p>
            <p className="text-xs text-slate-500 mt-1">
              Esses campos controlam a intro (logo flutuante, cardzinho, título em 2 cores, 3 emojis e textos).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Emoji do cardzinho (opcional)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.hero_badge_emoji || ''}
                onChange={(e) => setQuiz({ ...quiz, hero_badge_emoji: e.target.value || null })}
                placeholder="Ex.: ⚡"
              />
            </div>
            <div>
              <Label>Frase do cardzinho (opcional)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.hero_badge_text || ''}
                onChange={(e) => setQuiz({ ...quiz, hero_badge_text: e.target.value || null })}
                placeholder="Ex.: Quiz exclusivo para salões • 2 min"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Título (linha 1 — preto)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.hero_title_top || ''}
                onChange={(e) => setQuiz({ ...quiz, hero_title_top: e.target.value || null })}
                placeholder="Ex.: Descubra como"
              />
            </div>
            <div>
              <Label>Título (linha 2 — laranja)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.hero_title_bottom || ''}
                onChange={(e) => setQuiz({ ...quiz, hero_title_bottom: e.target.value || null })}
                placeholder="Ex.: lotar sua agenda"
              />
            </div>
          </div>

          <div>
            <Label>Texto curto (explicação)</Label>
            <Textarea
              className={`rounded-xl mt-1 ${FORM_TEXTAREA_CLASS}`}
              rows={2}
              value={quiz.hero_description || ''}
              onChange={(e) => setQuiz({ ...quiz, hero_description: e.target.value || null })}
              placeholder="Ex.: Responda em 2 minutos e receba uma estratégia personalizada."
            />
          </div>

          <div>
            <Label>3 emojis flutuando</Label>
            <p className="mt-1 text-xs text-slate-500">Cada item: 1 emoji + um texto curto (até 4 palavras).</p>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-xs font-semibold text-slate-700">Item 1</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Input
                    className={`rounded-xl ${FORM_INPUT_CLASS}`}
                    value={float1Emoji}
                    onChange={(e) => setFloat1Emoji(e.target.value)}
                    placeholder="Emoji (ex.: 💇‍♀️)"
                  />
                  <Input
                    className={`rounded-xl ${FORM_INPUT_CLASS}`}
                    value={float1Label}
                    onChange={(e) => setFloat1Label(e.target.value)}
                    placeholder="Texto (até 4 palavras)"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-xs font-semibold text-slate-700">Item 2</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Input
                    className={`rounded-xl ${FORM_INPUT_CLASS}`}
                    value={float2Emoji}
                    onChange={(e) => setFloat2Emoji(e.target.value)}
                    placeholder="Emoji (ex.: 📈)"
                  />
                  <Input
                    className={`rounded-xl ${FORM_INPUT_CLASS}`}
                    value={float2Label}
                    onChange={(e) => setFloat2Label(e.target.value)}
                    placeholder="Texto (até 4 palavras)"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-xs font-semibold text-slate-700">Item 3</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Input
                    className={`rounded-xl ${FORM_INPUT_CLASS}`}
                    value={float3Emoji}
                    onChange={(e) => setFloat3Emoji(e.target.value)}
                    placeholder="Emoji (ex.: 🏆)"
                  />
                  <Input
                    className={`rounded-xl ${FORM_INPUT_CLASS}`}
                    value={float3Label}
                    onChange={(e) => setFloat3Label(e.target.value)}
                    placeholder="Texto (até 4 palavras)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Texto do botão (começar)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.start_button_label || ''}
                onChange={(e) => setQuiz({ ...quiz, start_button_label: e.target.value || null })}
                placeholder="Ex.: Quero Lotar Meu Salão"
              />
            </div>
            <div>
              <Label>Texto chamativo abaixo do botão (opcional)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={quiz.social_proof_text || ''}
                onChange={(e) => setQuiz({ ...quiz, social_proof_text: e.target.value || null })}
                placeholder="Ex.: +150 salões já transformados..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-slate-900">
            Status: {quiz.is_published ? 'Publicado' : 'Rascunho'}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Use o botão <strong>Publicar</strong> acima para liberar o link na bio.
          </p>
        </div>
      </Card>

      <Card className={`${DASH_SURFACE_CARD} p-4 sm:p-6`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Perguntas</h2>
            <p className="text-sm text-slate-500">
              {questions.length}
              {questionsLimit != null ? ` / ${questionsLimit}` : ''} perguntas
            </p>
          </div>
          <Button onClick={openNewQuestion} className="rounded-xl w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar pergunta
          </Button>
        </div>

        {questions.length === 0 ? (
          <div className="p-10 text-center text-slate-500">Ainda não há perguntas.</div>
        ) : (
          <div className="space-y-2">
            {questions
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((q, idx) => (
                <div key={q.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {idx + 1}. {q.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      Tipo: {q.kind === 'select' ? 'Seleção' : q.kind === 'long_text' ? 'Texto longo' : 'Texto curto'}
                      {q.required ? ' • Obrigatória' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openEditQuestion(q)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => deleteQuestion(q.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      <Dialog open={qDialogOpen} onOpenChange={setQDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{qEditing ? 'Editar pergunta' : 'Nova pergunta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveQuestion} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={qForm.title}
                onChange={(e) => setQForm({ ...qForm, title: e.target.value })}
                placeholder="Ex.: Qual área você precisa?"
                required
              />
            </div>
            <div>
              <Label>Emoji da pergunta (opcional)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={qForm.emoji}
                onChange={(e) => setQForm({ ...qForm, emoji: e.target.value })}
                placeholder="Ex.: 🧬"
              />
              <p className="mt-2 text-xs text-slate-500">Aparece acima da pergunta no quiz público.</p>
            </div>
            <div>
              <Label>Subtítulo (opcional)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={qForm.description}
                onChange={(e) => setQForm({ ...qForm, description: e.target.value })}
                placeholder="Ex.: Escolha a opção mais próxima."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={qForm.kind} onValueChange={(v) => setQForm({ ...qForm, kind: v as QuestionRow['kind'] })}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <span>
                      {qForm.kind === 'select' ? 'Seleção' : qForm.kind === 'long_text' ? 'Texto longo' : 'Texto curto'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Seleção</SelectItem>
                    <SelectItem value="short_text">Texto curto</SelectItem>
                    <SelectItem value="long_text">Texto longo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={qForm.required}
                    onChange={(e) => setQForm({ ...qForm, required: e.target.checked })}
                  />
                  <span className="text-sm text-slate-700">Obrigatória</span>
                </label>
              </div>
            </div>

            <div>
              <Label>Placeholder (opcional)</Label>
              <Input
                className={`rounded-xl mt-1 ${FORM_INPUT_CLASS}`}
                value={qForm.placeholder}
                onChange={(e) => setQForm({ ...qForm, placeholder: e.target.value })}
                placeholder={qForm.kind === 'select' ? '—' : 'Digite aqui...'}
              />
            </div>

            {qForm.kind === 'select' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Opções de resposta</Label>
                    <p className="mt-1 text-xs text-slate-500">Cada opção: emoji + texto (e subtítulo opcional).</p>
                  </div>
                  <Button type="button" variant="outline" className="rounded-xl" onClick={addOptionRow}>
                    + Adicionar opção
                  </Button>
                </div>

                <div className="space-y-2">
                  {qOptions.map((opt, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700">Opção {idx + 1}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => removeOptionRow(idx)}
                        >
                          Remover
                        </Button>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          className={`rounded-xl ${FORM_INPUT_CLASS}`}
                          value={opt.emoji || ''}
                          onChange={(e) => updateOptionRow(idx, { emoji: e.target.value })}
                          placeholder="Emoji"
                        />
                        <Input
                          className={`rounded-xl sm:col-span-2 ${FORM_INPUT_CLASS}`}
                          value={opt.title || ''}
                          onChange={(e) => updateOptionRow(idx, { title: e.target.value })}
                          placeholder="Texto da opção (ex.: Dono(a) de salão)"
                        />
                      </div>
                      <div className="mt-2">
                        <Input
                          className={`rounded-xl ${FORM_INPUT_CLASS}`}
                          value={opt.description || ''}
                          onChange={(e) => updateOptionRow(idx, { description: e.target.value })}
                          placeholder="Subtítulo (opcional) (ex.: Equipe pequena e enxuta)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <DialogFooter className="pt-2 flex-wrap gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setQDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl">
                Salvar pergunta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir quiz?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={deleteQuiz}
      />
    </div>
  )
}

