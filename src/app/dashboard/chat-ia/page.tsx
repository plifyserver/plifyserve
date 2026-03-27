'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Send, MessageCircle, Plus, Pencil, Trash2, Loader2, Menu, X } from 'lucide-react'

/** Converte **texto** em negrito (evita asteriscos soltos na tela) */
function renderMessageContent(content: string) {
  const parts = content.split(/\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
  )
}

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

const STORAGE_KEY = 'plify-chat-ia-conversations'
const MAX_CONVERSATIONS = 50
const MAX_MESSAGES_PER_CONVERSATION = 500

function loadConversationsFromStorage(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Conversation[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveConversationsToStorage(conversations: Conversation[]) {
  if (typeof window === 'undefined') return
  try {
    const toSave = conversations
      .slice(0, MAX_CONVERSATIONS)
      .map((c) => ({
        ...c,
        messages: c.messages.slice(-MAX_MESSAGES_PER_CONVERSATION),
      }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // ignore quota or parse errors
  }
}

export default function ChatIaPage() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversationsFromStorage)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)
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

  // Persistir histórico no localStorage ao sair da página ou ao alterar conversas
  useEffect(() => {
    saveConversationsToStorage(conversations)
  }, [conversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeConversation?.messages.length, loading])

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

      const data = (await res.json()) as { reply?: string; error?: string }

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao falar com a IA')
      }

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
      const message = err instanceof Error ? err.message : 'Ocorreu um erro ao falar com a IA. Verifique a conexão e tente novamente.'
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant-error`,
        role: 'assistant',
        content: message,
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-light text-slate-900 tracking-tight">CHAT IA</h1>
          <p className="mt-0.5 text-sm font-light text-slate-500">
            Converse com a IA para tirar dúvidas, resolver conflitos e ter ideias.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileHistoryOpen(true)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 sm:hidden"
            aria-label="Abrir histórico"
            title="Abrir histórico"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={startNewConversation}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Nova conversa
          </button>
        </div>
      </div>

      {mobileHistoryOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70] bg-black/40 sm:hidden"
            onClick={() => setMobileHistoryOpen(false)}
            aria-label="Fechar histórico"
          />
          <aside className="fixed inset-y-0 left-0 z-[80] flex w-[86vw] max-w-xs flex-col border-r border-slate-200 bg-white p-3 shadow-xl sm:hidden">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Histórico</span>
              <button
                type="button"
                onClick={() => setMobileHistoryOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {conversations.length === 0 && (
                <p className="text-xs text-slate-400">
                  Nenhuma conversa ainda. Clique em &quot;Nova conversa&quot;.
                </p>
              )}
              {conversations.map((conv) => (
                <div
                  key={`mobile-${conv.id}`}
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
                        onClick={() => {
                          setActiveId(conv.id)
                          setMobileHistoryOpen(false)
                        }}
                        className="flex min-w-0 flex-1 items-start gap-2 text-left"
                      >
                        <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span className="line-clamp-2 flex-1">{conv.title || 'Conversa sem título'}</span>
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-100">
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
        </>
      )}

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
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-slate-900 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      {m.role === 'assistant'
                        ? renderMessageContent(m.content)
                        : m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2.5 text-sm text-slate-600 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      <span>A IA está carregando sua resposta...</span>
                    </div>
                  </div>
                )}
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

