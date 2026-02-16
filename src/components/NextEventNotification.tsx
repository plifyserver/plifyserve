'use client'

import { useEffect, useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NextEventNotification() {
  const { user } = useAuth()
  const supabase = createClient()
  const [event, setEvent] = useState<{ id: string; title: string; start_at: string; location?: string } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!user || dismissed) return
    const run = async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title, start_at, location')
        .eq('user_id', user.id)
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(1)
        .single()
      if (data) setEvent(data)
    }
    run()
  }, [user, dismissed, supabase])

  if (!event) return null

  return (
    <div className="mb-6 p-4 rounded-xl bg-avocado/10 border border-avocado/30 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-avocado/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-avocado" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-avocado">Próximo compromisso</p>
          <p className="text-gray-900 truncate">{event.title}</p>
          <p className="text-sm text-gray-500">
            {format(new Date(event.start_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            {event.location && ` • ${event.location}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href="/dashboard/agenda"
          className="px-3 py-1.5 rounded-lg bg-avocado text-white text-sm font-medium hover:bg-avocado-light transition-colors"
        >
          Ver agenda
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
