'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { X, Loader2 } from 'lucide-react'

const locales = { 'pt-BR': ptBR }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

const formats = {
  weekdayFormat: (date: Date) => format(date, 'EEE', { locale: ptBR }),
  dayFormat: (date: Date) => format(date, 'd', { locale: ptBR }),
  monthHeaderFormat: (date: Date) => format(date, "MMMM 'de' yyyy", { locale: ptBR }),
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, 'd MMM', { locale: ptBR })} – ${format(end, 'd MMM', { locale: ptBR })}`,
}

type EventItem = {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  all_day?: boolean
}

type View = 'month' | 'week' | 'day' | 'agenda'

export default function AgendaPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState<View>('month')
  const [form, setForm] = useState({ title: '', description: '', location: '', start: '', end: '', all_day: false })

  const fetchEvents = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('events').select('*').eq('user_id', user.id).order('start_at')
      if (!error && data) {
        setEvents(
          data.map((e) => ({
            id: e.id,
            title: e.title,
            start: new Date(e.start_at),
            end: new Date(e.end_at),
            description: e.description,
            location: e.location,
            all_day: e.all_day,
          }))
        )
      }
    } catch {
      // Tabela events pode não existir ainda - usuário vê calendário vazio
    }
  }, [user, supabase])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setForm({
      title: '',
      description: '',
      location: '',
      start: start.toISOString().slice(0, 16),
      end: end.toISOString().slice(0, 16),
      all_day: false,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.title.trim()) return
    await supabase.from('events').insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      start_at: new Date(form.start).toISOString(),
      end_at: new Date(form.end).toISOString(),
      all_day: form.all_day,
    })
    setShowModal(false)
    fetchEvents()
  }

  const eventStyleGetter = () => ({
    style: { backgroundColor: '#568203', color: '#fff', border: 'none' },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-avocado" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Agenda</h1>
      <p className="text-gray-500 mb-6">
        Clique em um horário para criar um compromisso. Seu próximo compromisso aparecerá como lembrete ao fazer login.
      </p>

      <div className="h-[600px] rounded-xl border border-gray-200 overflow-hidden bg-gray-50 [&_.rbc-calendar]:!bg-gray-50 [&_.rbc-header]:!bg-gray-100 [&_.rbc-header]:!text-gray-800 [&_.rbc-header]:!border-gray-200 [&_.rbc-today]:!bg-avocado/10 [&_.rbc-off-range-bg]:!bg-gray-100 [&_.rbc-date-cell]:!text-gray-700 [&_.rbc-time-view]:!border-gray-200 [&_.rbc-time-slot]:!text-gray-500 [&_.rbc-event]:!bg-avocado [&_.rbc-event]:!text-white [&_.rbc-toolbar]:!flex [&_.rbc-toolbar]:!gap-2 [&_.rbc-toolbar]:!mb-4 [&_.rbc-toolbar_label]:!text-gray-900 [&_.rbc-toolbar_label]:!text-lg [&_.rbc-btn-group]:!flex [&_.rbc-btn-group]:!gap-1 button.rbc-button:!bg-gray-200 button.rbc-button:!text-gray-800 button.rbc-button:!border-gray-300 button.rbc-button:!px-3 button.rbc-button:!py-1.5 button.rbc-button:!rounded-lg button.rbc-button:hover:!bg-gray-300">
        <Calendar
          culture="pt-BR"
          localizer={localizer}
          formats={formats}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={date}
          view={view}
          onNavigate={(d) => setDate(d)}
          onView={(v) => setView(v as View)}
          style={{ height: '100%' }}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          messages={{
            today: 'Hoje',
            previous: 'Anterior',
            next: 'Próximo',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Agenda',
            date: 'Data',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'Nenhum compromisso neste período.',
            showMore: (n) => `+${n} mais`,
            allDay: 'Dia inteiro',
            yesterday: 'Ontem',
            tomorrow: 'Amanhã',
          }}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Novo compromisso</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Reunião com cliente"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Detalhes..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Local</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Ex: Escritório"
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Início</label>
                  <input
                    type="datetime-local"
                    value={form.start}
                    onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Fim</label>
                  <input
                    type="datetime-local"
                    value={form.end}
                    onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="all_day"
                  checked={form.all_day}
                  onChange={(e) => setForm((f) => ({ ...f, all_day: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="all_day" className="text-sm text-zinc-400">
                  Dia inteiro
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-avocado text-white font-medium hover:bg-avocado-light"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
