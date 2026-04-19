'use client'

import { useCallback, useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { GripVertical, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  DASHBOARD_NAV_SIDEBAR_ORDER,
  type DashboardNavEntry,
  mergeDashboardNavConfig,
  isDashboardNavHrefLocked,
} from '@/lib/dashboardNav'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DashboardNavCustomizer() {
  const { profile, refreshProfile } = useAuth()
  const isPro = !!(profile?.is_pro || profile?.account_type === 'admin')
  const [items, setItems] = useState<DashboardNavEntry[]>(() => mergeDashboardNavConfig(null, isPro))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    setItems(mergeDashboardNavConfig(profile?.dashboard_nav_config, isPro))
  }, [profile?.dashboard_nav_config, profile?.updated_at, isPro])

  const labelFor = useCallback((href: string) => {
    return DASHBOARD_NAV_SIDEBAR_ORDER.find((x) => x.href === href)?.label ?? href
  }, [])

  const requiresPro = useCallback((href: string) => {
    return !!DASHBOARD_NAV_SIDEBAR_ORDER.find((x) => x.href === href)?.requiresPro
  }, [])

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const from = result.source.index
    const to = result.destination.index
    if (from === to) return
    setItems((prev) => {
      const next = [...prev]
      const [removed] = next.splice(from, 1)
      next.splice(to, 0, removed)
      return next
    })
  }

  const toggle = (href: string, enabled: boolean) => {
    if (isDashboardNavHrefLocked(href)) return
    if (requiresPro(href) && !isPro) return
    setItems((prev) => prev.map((e) => (e.href === href ? { ...e, enabled } : e)))
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dashboard_nav_config: items }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar')
      await refreshProfile()
      setMessage({ kind: 'ok', text: 'Menu atualizado. O lado esquerdo reflete a nova ordem.' })
    } catch (e) {
      setMessage({ kind: 'err', text: e instanceof Error ? e.message : 'Erro ao salvar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      {!isPro ? (
        <p className="mb-4 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2">
          O item <strong>Ads</strong> só pode ser ativado no plano Pro.
        </p>
      ) : null}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard-nav-order">
          {(provided) => (
            <ul
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-2"
            >
              {items.map((entry, index) => {
                const locked = isDashboardNavHrefLocked(entry.href)
                const proOnly = requiresPro(entry.href) && !isPro
                const disabledToggle = locked || proOnly
                return (
                  <Draggable key={entry.href} draggableId={entry.href} index={index}>
                    {(dragProvided, snapshot) => (
                      <li
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 shadow-sm',
                          snapshot.isDragging ? 'border-slate-300 ring-2 ring-slate-200' : 'border-slate-200'
                        )}
                      >
                        <button
                          type="button"
                          className="touch-none text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50"
                          {...dragProvided.dragHandleProps}
                          aria-label="Arrastar"
                        >
                          <GripVertical className="w-5 h-5" />
                        </button>
                        <span className="flex-1 min-w-0 text-sm font-medium text-slate-900">
                          {labelFor(entry.href)}
                          {proOnly ? (
                            <span className="ml-2 text-xs font-normal text-amber-700">(Pro)</span>
                          ) : null}
                        </span>
                        <label className="flex items-center gap-2 shrink-0 cursor-pointer select-none">
                          <span className="text-xs text-slate-500">{entry.enabled ? 'Ativo' : 'Oculto'}</span>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                            checked={entry.enabled}
                            disabled={disabledToggle}
                            onChange={(e) => toggle(entry.href, e.target.checked)}
                          />
                        </label>
                      </li>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 text-white hover:bg-slate-800"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar menu
        </Button>
        {message ? (
          <p className={cn('text-sm', message.kind === 'ok' ? 'text-emerald-700' : 'text-red-600')}>{message.text}</p>
        ) : null}
      </div>
    </div>
  )
}
