'use client'

import { useEffect, useMemo, useState } from 'react'
import { ThumbsDown, ThumbsUp, MessageSquareText, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Suggestion = {
  id: string
  title: string
  category: string
  description: string
  likes_count: number
  dislikes_count: number
  created_at: string
}

const CATEGORIES = [
  'Nova funcionalidade',
  'Erros / Bugs',
  'Melhoria de interface',
  'Performance',
  'Outros',
] as const

export default function FeedbackSuggestionsButton({ accentColor }: { accentColor: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [list, setList] = useState<Suggestion[]>([])
  const [sentOk, setSentOk] = useState(false)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Nova funcionalidade')
  const [description, setDescription] = useState('')

  const canSend = title.trim().length >= 3 && description.trim().length >= 10

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/feedback/suggestions', { credentials: 'include', cache: 'no-store' })
      const data = (await res.json()) as Suggestion[]
      setList(Array.isArray(data) ? data : [])
    } catch (e) {
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) void load()
  }, [open])

  const send = async () => {
    if (!canSend) return
    setSending(true)
    setSentOk(false)
    try {
      const res = await fetch('/api/feedback/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, category, description }),
      })
      if (!res.ok) throw new Error('Falha ao enviar')
      setTitle('')
      setDescription('')
      setCategory('Nova funcionalidade')
      await load()
      setSentOk(true)
    } catch (e) {
      // não exibir erro (conforme pedido)
    } finally {
      setSending(false)
    }
  }

  const vote = async (id: string, v: 'like' | 'dislike') => {
    // Alternância simples: clicar envia voto; se quiser “remover”, clique no outro ou recarregue.
    const res = await fetch(`/api/feedback/suggestions/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ vote: v }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data) return
    setList((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, likes_count: data.likes_count ?? s.likes_count, dislikes_count: data.dislikes_count ?? s.dislikes_count }
          : s
      )
    )
  }

  const hasCommunity = useMemo(() => list.length > 0, [list.length])

  return (
    <>
      {/* Botão fixo */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-2 top-[calc(50%+28px)] -translate-y-1/2 z-[70] hidden lg:flex items-center justify-center rounded-l-lg rounded-r-none border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 px-2 py-2 shadow-md"
        style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}
      >
        <span
          className="font-semibold text-xs leading-tight"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Feedbacks e Sugestões
        </span>
      </button>

      {/* Mobile: compacto, área de toque ~44px, respeita safe area inferior */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir feedbacks e sugestões"
        className="fixed right-2 z-[70] lg:hidden flex min-h-[44px] max-w-[min(17.5rem,calc(100vw-0.75rem))] touch-manipulation items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-900 shadow-md hover:bg-slate-50 active:scale-[0.99] bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
        style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}
      >
        <MessageSquareText className="h-5 w-5 shrink-0" style={{ color: accentColor }} aria-hidden />
        <span className="min-w-0 flex-1 text-balance font-semibold text-[11px] leading-snug sm:text-xs">
          Feedbacks e Sugestões
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Feedback &amp; Sugestões</DialogTitle>
            <DialogDescription>Ajude a tornar a Plify ainda melhor!</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 [color-scheme:light]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">TÍTULO</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:!border-slate-200 dark:!bg-white dark:!text-slate-900 dark:!placeholder:text-slate-400 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(15,23,42)]"
                    placeholder="Ex: Relatório por período"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Categoria</label>
                  <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                    <SelectTrigger className="mt-1.5 rounded-xl dark:!border-slate-200 dark:!bg-white dark:!text-slate-900">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Descrição</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:!border-slate-200 dark:!bg-white dark:!text-slate-900 dark:!placeholder:text-slate-400"
                    rows={5}
                    placeholder="Descreva sua sugestão ou o bug..."
                  />
                </div>

                {sentOk ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Enviado! Obrigado por ajudar a melhorar a Plify.
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={send}
                  disabled={!canSend || sending}
                  className="w-full rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: accentColor }}
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>

            {/* Comunidade (sempre visível) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col min-h-0">
              <p className="text-sm font-semibold text-slate-900">Sugestões da Comunidade</p>
              <p className="text-xs text-slate-500 mt-1">Veja o que outras pessoas já pediram.</p>

              <div className="mt-4 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                {loading ? <div className="text-sm text-slate-500">Carregando...</div> : null}
                {!loading && !hasCommunity ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Nenhuma recomendação ainda.
                  </div>
                ) : null}
                {list.map((s) => (
                  <div key={s.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{s.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.category}</p>
                        <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{s.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => vote(s.id, 'like')}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {s.likes_count ?? 0}
                      </button>
                      <button
                        type="button"
                        onClick={() => vote(s.id, 'dislike')}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        {s.dislikes_count ?? 0}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

