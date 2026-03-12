'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Send, MessageCircle, Plus, Pencil, Trash2 } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
}

export default function ChatIaPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId],
  )

  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      setActiveId(conversations[0].id)
    }
  }, [activeConversation, conversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeConversation?.messages.length])

  const startNewConversation = () => {
    const id = crypto.randomUUID()
    const conv: Conversation = {
      id,
      title: 'Nova conversa',
      messages: [],
      createdAt: Date.now(),
    }
    setConversations((prev) => [conv, ...prev])
    setActiveId(id)
    setInput('')
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    let conv = activeConversation
    if (!conv) {
      const id = crypto.randomUUID()
      conv = {
        id,
        title: text.slice(0, 40),
        messages: [],
        createdAt: Date.now(),
      }
      setConversations((prev) => [conv!, ...prev])
      setActiveId(conv.id)
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text,
    }

    const updatedConv: Conversation = {
      ...conv,
      title: conv.title === 'Nova conversa' ? text.slice(0, 40) : conv.title,
      messages: [...conv.messages, userMessage],
    }

    setConversations((prev) => prev.map((c) => (c.id === updatedConv.id ? updatedConv : c)))
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: updatedConv.messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        throw new Error('Erro ao falar com a IA')
      }

      const data = await res.json()
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply ?? 'Não consegui gerar uma resposta agora.',
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === updatedConv.id
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c,
        ),
      )
    } catch (err) {
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant-error`,
        role: 'assistant',
        content:
          'Ocorreu um erro ao falar com a IA. Verifique a conexão e tente novamente.',
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === updatedConv.id
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rest = conversations.filter((c) => c.id !== id)
    setConversations(rest)
    if (activeId === id) setActiveId(rest.length > 0 ? rest[0].id : null)
    if (editingId === id) setEditingId(null)
  }

  const startEditTitle = (conv: Conversation, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingId(conv.id)
    setEditingTitle(conv.title || '')
  }

  const saveEditTitle = () => {
    if (!editingId) return
    setConversations((prev) =>
      prev.map((c) => (c.id === editingId ? { ...c, title: editingTitle.trim() || c.title } : c)),
    )
    setEditingId(null)
    setEditingTitle('')
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 lg:h-[calc(100vh-5rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900 tracking-tight">CHAT IA</h1>
          <p className="mt-0.5 text-sm font-light text-slate-500">
            Converse com a IA para tirar dúvidas, resolver conflitos e ter ideias.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewConversation}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Nova conversa
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Lista de conversas */}
        <aside className="hidden w-64 flex-shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-3 sm:flex">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Histórico
            </span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {conversations.length === 0 && (
              <p className="text-xs text-slate-400">
                Nenhuma conversa ainda. Clique em &quot;Nova conversa&quot;.
              </p>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex w-full items-center gap-1 rounded-lg px-2 py-2 ${
                  conv.id === activeId ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                } ${editingId === conv.id ? 'flex-col items-stretch' : ''}`}
              >
                {editingId === conv.id ? (
                  <>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditTitle()
                        if (e.key === 'Escape') {
                          setEditingId(null)
                          setEditingTitle('')
                        }
                      }}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
                      autoFocus
                    />
                    <div className="mt-1 flex gap-1">
                      <button
                        type="button"
                        onClick={saveEditTitle}
                        className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null)
                          setEditingTitle('')
                        }}
                        className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveId(conv.id)}
                      className="flex min-w-0 flex-1 items-start gap-2 text-left"
                    >
                      <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-2 flex-1">
                        {conv.title || 'Conversa sem título'}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => startEditTitle(conv, e)}
                        className="rounded p-1 hover:bg-white/20"
                        title="Editar nome"
                        aria-label="Editar nome"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="rounded p-1 hover:bg-red-500/20"
                        title="Excluir conversa"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Área de chat */}
        <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <MessageCircle className="mb-3 h-10 w-10" />
                <p className="text-sm">
                  Comece uma conversa digitando sua dúvida abaixo.
                </p>
              </div>
            ) : (
              <>
                {activeConversation.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === 'user'
                          ? 'bg-slate-900 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
                placeholder="Digite sua pergunta para a IA... (Enter envia, Shift+Enter nova linha)"
                className="max-h-32 flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 disabled:hover:bg-slate-900"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-1 text-[11px] text-slate-400">
              A IA responde com base apenas na pergunta e no histórico desta conversa. Não envie
              dados sensíveis.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

