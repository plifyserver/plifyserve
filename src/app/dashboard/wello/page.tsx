'use client'

import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, GripVertical, LayoutGrid, ChevronLeft, MoreHorizontal, Edit, Trash2, List, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WelloBoard {
  id: string
  name: string
  description: string | null
  background_color: string | null
}

interface WelloList {
  id: string
  board_id: string
  name: string
  order: number
}

interface WelloCard {
  id: string
  list_id: string
  board_id: string
  title: string
  description: string | null
  due_date: string | null
  order: number
  labels: string[]
  cover_color: string | null
}

export default function WelloPage() {
  const [boards, setBoards] = useState<WelloBoard[]>([])
  const [lists, setLists] = useState<WelloList[]>([])
  const [cardsByList, setCardsByList] = useState<Record<string, WelloCard[]>>({})
  const [currentBoard, setCurrentBoard] = useState<WelloBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [boardDialogOpen, setBoardDialogOpen] = useState(false)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [cardDialogOpen, setCardDialogOpen] = useState(false)
  const [editingBoard, setEditingBoard] = useState<WelloBoard | null>(null)
  const [editingList, setEditingList] = useState<WelloList | null>(null)
  const [editingCard, setEditingCard] = useState<WelloCard | null>(null)
  const [boardForm, setBoardForm] = useState({ name: '', description: '' })
  const [listForm, setListForm] = useState({ name: '' })
  const [cardForm, setCardForm] = useState({ title: '', description: '', due_date: '', list_id: '' })

  const fetchBoards = async () => {
    const res = await fetch('/api/wello/boards', { credentials: 'include' })
    if (res.ok) setBoards(await res.json())
  }

  const fetchBoardData = async (boardId: string) => {
    const [listRes, ...listIds] = await Promise.all([
      fetch(`/api/wello/boards/${boardId}/lists`, { credentials: 'include' }),
    ])
    if (!listRes.ok) return
    const listsData = await listRes.json()
    setLists(listsData)
    const cardsRes = await Promise.all(
      listsData.map((l: WelloList) =>
        fetch(`/api/wello/lists/${l.id}/cards`, { credentials: 'include' }).then((r) => r.json())
      )
    )
    const next: Record<string, WelloCard[]> = {}
    listsData.forEach((l: WelloList, i: number) => {
      next[l.id] = (cardsRes[i] || []).sort((a: WelloCard, b: WelloCard) => (a.order ?? 0) - (b.order ?? 0))
    })
    setCardsByList(next)
  }

  useEffect(() => {
    fetchBoards().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (currentBoard) {
      setLoading(true)
      fetchBoardData(currentBoard.id).finally(() => setLoading(false))
    } else {
      setLists([])
      setCardsByList({})
    }
  }, [currentBoard?.id])

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !currentBoard) return
    const cardId = result.draggableId.replace('card-', '')
    const destListId = result.destination.droppableId
    const sourceListId = result.source.droppableId
    if (destListId === sourceListId) return

    const card = Object.values(cardsByList).flat().find((c) => c.id === cardId)
    if (!card) return

    const res = await fetch(`/api/wello/cards/${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ list_id: destListId, order: result.destination.index }),
    })
    if (res.ok) {
      setCardsByList((prev) => {
        const next = { ...prev }
        next[sourceListId] = (next[sourceListId] || []).filter((c) => c.id !== cardId)
        next[destListId] = [...(next[destListId] || []), { ...card, list_id: destListId }]
        return next
      })
    }
  }

  const openBoardDialog = (board: WelloBoard | null) => {
    setEditingBoard(board)
    setBoardForm(board ? { name: board.name, description: board.description || '' } : { name: '', description: '' })
    setBoardDialogOpen(true)
  }

  const saveBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingBoard ? `/api/wello/boards/${editingBoard.id}` : '/api/wello/boards'
    const method = editingBoard ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editingBoard ? { name: boardForm.name, description: boardForm.description } : { name: boardForm.name, description: boardForm.description }),
    })
    if (res.ok) {
      await fetchBoards()
      setBoardDialogOpen(false)
    }
  }

  const openListDialog = (list: WelloList | null) => {
    setEditingList(list)
    setListForm(list ? { name: list.name } : { name: '' })
    setListDialogOpen(true)
  }

  const saveList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentBoard) return
    if (editingList) {
      const res = await fetch(`/api/wello/lists/${editingList.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: listForm.name }),
      })
      if (res.ok) {
        await fetchBoardData(currentBoard.id)
        setListDialogOpen(false)
      }
    } else {
      const res = await fetch(`/api/wello/boards/${currentBoard.id}/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: listForm.name, order: lists.length }),
      })
      if (res.ok) {
        await fetchBoardData(currentBoard.id)
        setListDialogOpen(false)
      }
    }
  }

  const openCardDialog = (card: WelloCard | null, listId: string) => {
    setEditingCard(card)
    setCardForm(
      card
        ? { title: card.title, description: card.description || '', due_date: card.due_date || '', list_id: card.list_id }
        : { title: '', description: '', due_date: '', list_id: listId }
    )
    setCardDialogOpen(true)
  }

  const saveCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentBoard) return
    if (editingCard) {
      const res = await fetch(`/api/wello/cards/${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: cardForm.title, description: cardForm.description || null, due_date: cardForm.due_date || null }),
      })
      if (res.ok) {
        await fetchBoardData(currentBoard.id)
        setCardDialogOpen(false)
      }
    } else {
      const listId = cardForm.list_id
      const order = (cardsByList[listId]?.length ?? 0)
      const res = await fetch(`/api/wello/lists/${listId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: cardForm.title, description: cardForm.description || null, due_date: cardForm.due_date || null, order }),
      })
      if (res.ok) {
        await fetchBoardData(currentBoard.id)
        setCardDialogOpen(false)
      }
    }
  }

  const deleteBoard = async (id: string) => {
    if (!confirm('Excluir este board e todas as listas e cards?')) return
    const res = await fetch(`/api/wello/boards/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      if (currentBoard?.id === id) setCurrentBoard(null)
      await fetchBoards()
    }
  }

  const deleteList = async (id: string) => {
    if (!confirm('Excluir esta lista e todos os cards?')) return
    const res = await fetch(`/api/wello/lists/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok && currentBoard) {
      await fetchBoardData(currentBoard.id)
      setListDialogOpen(false)
    }
  }

  const deleteCard = async (id: string) => {
    if (!confirm('Excluir este card?')) return
    const res = await fetch(`/api/wello/cards/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok && currentBoard) {
      await fetchBoardData(currentBoard.id)
      setCardDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {currentBoard && (
            <Button variant="ghost" size="icon" onClick={() => setCurrentBoard(null)} className="rounded-xl">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{currentBoard ? currentBoard.name : 'Wello'}</h1>
            <p className="text-slate-500">{currentBoard ? 'Listas e cards' : 'Organize tudo com quadros estilo Trello.'}</p>
          </div>
        </div>
        {!currentBoard ? (
          <Button onClick={() => openBoardDialog(null)} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Novo board
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => openListDialog(null)} variant="outline" className="rounded-xl">
              <List className="w-4 h-4 mr-2" />
              Nova lista
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Carregando...</div>
      ) : !currentBoard ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((b) => (
            <Card
              key={b.id}
              className="p-6 rounded-2xl border-0 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              onClick={() => setCurrentBoard(b)}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: (b.background_color || '#3B82F6') + '30' }}>
                  <LayoutGrid className="w-6 h-6" style={{ color: b.background_color || '#3B82F6' }} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{b.name}</p>
                  {b.description && <p className="text-sm text-slate-500 line-clamp-1">{b.description}</p>}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => openBoardDialog(b)} className="rounded-lg">Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteBoard(b.id)} className="text-red-600 rounded-lg">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {lists.map((list) => {
              const cards = cardsByList[list.id] || []
              return (
                <Droppable key={list.id} droppableId={list.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-shrink-0 w-72 rounded-2xl bg-slate-100 border-0 shadow-sm flex flex-col max-h-[calc(100vh-220px)]"
                    >
                      <div className="p-3 flex items-center justify-between border-b border-slate-200">
                        <span className="font-semibold text-slate-900">{list.name}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openListDialog(list)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCardDialog(null, list.id)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-2 flex-1 overflow-y-auto min-h-[100px]">
                        {cards.map((card, index) => (
                          <Draggable key={card.id} draggableId={`card-${card.id}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="p-3 mb-2 bg-white rounded-xl shadow-sm border border-slate-200 flex items-start gap-2"
                              >
                                <GripVertical className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openCardDialog(card, list.id)}>
                                  <p className="font-medium text-slate-900 text-sm">{card.title}</p>
                                  {card.due_date && (
                                    <p className="text-xs text-slate-500 mt-1">{new Date(card.due_date).toLocaleDateString('pt-BR')}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
        </DragDropContext>
      )}

      <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingBoard ? 'Editar board' : 'Novo board'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveBoard} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={boardForm.name} onChange={(e) => setBoardForm({ ...boardForm, name: e.target.value })} required className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={boardForm.description} onChange={(e) => setBoardForm({ ...boardForm, description: e.target.value })} rows={2} className="rounded-xl mt-1" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setBoardDialogOpen(false)} className="rounded-xl">Cancelar</Button>
              {editingBoard && (
                <Button type="button" variant="destructive" onClick={() => deleteBoard(editingBoard.id)} className="rounded-xl">Excluir</Button>
              )}
              <Button type="submit" className="rounded-xl">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingList ? 'Editar lista' : 'Nova lista'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveList} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={listForm.name} onChange={(e) => setListForm({ name: e.target.value })} required className="rounded-xl mt-1" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setListDialogOpen(false)} className="rounded-xl">Cancelar</Button>
              {editingList && (
                <Button type="button" variant="destructive" onClick={() => deleteList(editingList.id)} className="rounded-xl">Excluir</Button>
              )}
              <Button type="submit" className="rounded-xl">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingCard ? 'Editar card' : 'Novo card'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCard} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={cardForm.title} onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })} required className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={cardForm.description} onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })} rows={3} className="rounded-xl mt-1" />
            </div>
            {!editingCard && (
              <div>
                <Label>Lista</Label>
                <select
                  value={cardForm.list_id}
                  onChange={(e) => setCardForm({ ...cardForm, list_id: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label>Vencimento</Label>
              <Input type="date" value={cardForm.due_date} onChange={(e) => setCardForm({ ...cardForm, due_date: e.target.value })} className="rounded-xl mt-1" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setCardDialogOpen(false)} className="rounded-xl">Cancelar</Button>
              {editingCard && (
                <Button type="button" variant="destructive" onClick={() => deleteCard(editingCard.id)} className="rounded-xl">Excluir</Button>
              )}
              <Button type="submit" className="rounded-xl">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
