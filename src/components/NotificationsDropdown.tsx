'use client'

import { useEffect, useState, useCallback, useMemo, useRef, startTransition, memo } from 'react'
import { Bell, Eye, CheckCircle, FileText, X, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface Notification {
  id: string
  user_id: string
  type: 'proposal_viewed' | 'proposal_accepted' | 'contract_signed' | 'system'
  title: string | null
  message: string | null
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

interface NotificationsDropdownProps {
  userId: string
}

const ICON_MAP = {
  proposal_viewed: <Eye className="h-4 w-4 text-blue-600" />,
  proposal_accepted: <CheckCircle className="h-4 w-4 text-emerald-600" />,
  contract_signed: <FileText className="h-4 w-4 text-purple-600" />,
  system: <Bell className="h-4 w-4 text-slate-600" />,
} as const

const BG_MAP: Record<Notification['type'], string> = {
  proposal_viewed: 'bg-blue-100',
  proposal_accepted: 'bg-emerald-100',
  contract_signed: 'bg-purple-100',
  system: 'bg-slate-100',
}

function getIcon(type: Notification['type']) {
  return ICON_MAP[type] ?? ICON_MAP.system
}

function getBgColor(type: Notification['type']) {
  return BG_MAP[type] ?? 'bg-slate-100'
}

type NotificationRowProps = {
  notification: Notification
  timeLabel: string
  onMarkRead: (id: string) => void
  onDelete: (id: string, e: React.MouseEvent) => void
}

const NotificationRow = memo(function NotificationRow({
  notification: n,
  timeLabel,
  onMarkRead,
  onDelete,
}: NotificationRowProps) {
  return (
    <div
      className={`p-4 transition-colors hover:bg-slate-50 ${!n.read ? 'bg-indigo-50/50' : ''}`}
    >
      <div className="flex gap-3">
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${getBgColor(n.type)}`}
        >
          {getIcon(n.type)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{n.title}</p>
          <p className="truncate text-sm text-slate-600">{n.message}</p>
          <p className="mt-1 text-xs text-slate-400">{timeLabel}</p>
          <div
            className="mt-2 flex items-center gap-2"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {!n.read && (
              <button
                type="button"
                onClick={() => onMarkRead(n.id)}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Check className="h-3 w-3" />
                Marcar como lida
              </button>
            )}
            <button
              type="button"
              onClick={(e) => onDelete(n.id, e)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
              Excluir
            </button>
          </div>
        </div>
        {!n.read && <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />}
      </div>
    </div>
  )
})

/** Evita refetch em rajada (abrir painel + polling). */
const REFETCH_COOLDOWN_MS = 5_000

export default function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const lastFetchAtRef = useRef(0)

  const setNotificationsLowPri = useCallback((updater: (prev: Notification[]) => Notification[]) => {
    startTransition(() => {
      setNotifications(updater)
    })
  }, [])

  const fetchNotifications = useCallback(
    async (opts?: { force?: boolean }) => {
      const now = Date.now()
      if (!opts?.force && now - lastFetchAtRef.current < REFETCH_COOLDOWN_MS) {
        return
      }
      lastFetchAtRef.current = now

      const supabase = createClient()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      startTransition(() => {
        if (!error && data) {
          setNotifications(data as Notification[])
        }
        setLoading(false)
      })
    },
    [userId]
  )

  useEffect(() => {
    void fetchNotifications({ force: true })

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          startTransition(() => {
            setNotifications((prev) => [payload.new as Notification, ...prev])
          })
        }
      )
      .subscribe()

    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      void fetchNotifications({ force: false })
    }, 30_000)

    return () => {
      void supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [userId, fetchNotifications])

  const toggleOpen = useCallback(() => {
    setIsOpen((was) => {
      if (!was) {
        requestAnimationFrame(() => {
          void fetchNotifications({ force: true })
        })
      }
      return !was
    })
  }, [fetchNotifications])

  const resync = useCallback(() => {
    void fetchNotifications({ force: true })
  }, [fetchNotifications])

  const markAsRead = useCallback(
    (id: string) => {
      setNotificationsLowPri((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)))
      void (async () => {
        try {
          const res = await fetch(`/api/notifications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ read: true }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            toast.error((data as { error?: string }).error || 'Erro ao marcar como lida')
            resync()
          }
        } catch {
          toast.error('Erro ao marcar como lida')
          resync()
        }
      })()
    },
    [setNotificationsLowPri, resync]
  )

  const markAllAsRead = useCallback(() => {
    setNotificationsLowPri((p) => p.map((n) => ({ ...n, read: true })))
    void (async () => {
      try {
        const res = await fetch('/api/notifications/mark-all-read', {
          method: 'POST',
          credentials: 'include',
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error((data as { error?: string }).error || 'Erro ao marcar todas como lidas')
          resync()
        }
      } catch {
        toast.error('Erro ao marcar todas como lidas')
        resync()
      }
    })()
  }, [setNotificationsLowPri, resync])

  const deleteNotification = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setNotificationsLowPri((p) => p.filter((n) => n.id !== id))
      void (async () => {
        try {
          const res = await fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            toast.error((data as { error?: string }).error || 'Erro ao excluir')
            resync()
          }
        } catch {
          toast.error('Erro ao excluir notificação')
          resync()
        }
      })()
    },
    [setNotificationsLowPri, resync]
  )

  const deleteAllNotifications = useCallback(() => {
    setNotificationsLowPri(() => [])
    void (async () => {
      try {
        const res = await fetch('/api/notifications', {
          method: 'DELETE',
          credentials: 'include',
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error((data as { error?: string }).error || 'Erro ao excluir todas')
          resync()
        }
      } catch {
        toast.error('Erro ao excluir notificações')
        resync()
      }
    })()
  }, [setNotificationsLowPri, resync])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const rowsWithTime = useMemo(
    () =>
      notifications.map((n) => ({
        notification: n,
        timeLabel: formatDistanceToNow(new Date(n.created_at), {
          addSuffix: true,
          locale: ptBR,
        }),
      })),
    [notifications]
  )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-96"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="font-semibold text-slate-900">Notificações</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-500">{unreadCount} não lidas</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-7 rounded-lg text-xs"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Marcar todas como lidas
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deleteAllNotifications}
                    className="h-7 rounded-lg text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Excluir todas
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 hover:bg-slate-100"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto overscroll-contain">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Carregando...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-slate-500">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {rowsWithTime.map(({ notification, timeLabel }) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      timeLabel={timeLabel}
                      onMarkRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
