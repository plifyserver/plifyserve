'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { X, Loader2, Link2, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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

const EVENT_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899']

type EventItem = {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  all_day?: boolean
  color?: string
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
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [peopleSearch, setPeopleSearch] = useState('')

  const fetchEvents = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('events').select('*').eq('user_id', user.id).order('start_at')
      if (!error && data) {
        setEvents(
          data.map((e, i) => ({
            id: e.id,
            title: e.title,
            start: new Date(e.start_at),
            end: new Date(e.end_at),
            description: e.description,
            location: e.location,
            all_day: e.all_day,
            color: EVENT_COLORS[i % EVENT_COLORS.length],
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

  const eventStyleGetter = (event: EventItem) => ({
    style: {
      backgroundColor: event.color ?? EVENT_COLORS[0],
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      padding: '2px 6px',
    },
  })

  const miniCalendarStart = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
  const miniCalendarDays = eachDayOfInterval({
    start: miniCalendarStart,
    end: new Date(miniCalendarStart.getTime() + 41 * 24 * 60 * 60 * 1000),
  })

  const peoplePlaceholder = [
    { id: '1', name: user?.user_metadata?.full_name ?? 'Você', email: user?.email ?? '' },
    { id: '2', name: 'Equipe', email: 'equipe@exemplo.com' },
  ]
  const peopleFiltered = peopleSearch.trim()
    ? peoplePlaceholder.filter(
        (p) =>
          p.name.toLowerCase().includes(peopleSearch.toLowerCase()) ||
          p.email.toLowerCase().includes(peopleSearch.toLowerCase())
      )
    : peoplePlaceholder

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-avocado" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header: título + busca + Integrações + Novo Evento + view pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie seus compromissos e reuniões</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar..." className="pl-8 h-9 rounded-lg border-slate-200 bg-white" />
          </div>
          <Button variant="secondary" size="default" className="h-9 rounded-lg gap-1.5" onClick={() => setShowIntegrations(true)}>
            <Link2 className="w-4 h-4" />
            Integrações
          </Button>
          <Button size="default" className="h-9 rounded-lg gap-1.5 bg-slate-900 hover:bg-slate-800" onClick={() => handleSelectSlot({ start: new Date(), end: new Date(Date.now() + 3600000) })}>
            <Plus className="w-4 h-4" />
            Novo Evento
          </Button>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setView('month')}
              className={cn('px-3 py-1.5 text-sm rounded-md transition-colors', view === 'month' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setView('week')}
              className={cn('px-3 py-1.5 text-sm rounded-md transition-colors', view === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}
            >
              Semanal
            </button>
          </div>
        </div>
      </div>

      {/* Layout: painel lateral + calendário principal */}
      <div className="flex gap-6">
        {/* Painel lateral: mini-calendário + People */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-900 mb-3">
            {format(date, "MMMM 'de' yyyy", { locale: ptBR })}
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-slate-500 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-sm">
            {miniCalendarDays.map((d) => (
              <button
                key={d.toISOString()}
                type="button"
                className={cn(
                  'aspect-square rounded-md transition-colors',
                  isSameDay(d, new Date()) ? 'bg-slate-900 text-white' : isSameMonth(d, date) ? 'text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-50'
                )}
                onClick={() => setDate(d)}
              >
                {format(d, 'd')}
              </button>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-900 mb-2">Pessoas</p>
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Buscar pessoas..."
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                className="pl-7 h-8 text-xs rounded-md border-slate-200"
              />
            </div>
            <ul className="space-y-2">
              {peopleFiltered.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                    {p.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{p.name}</p>
                    {p.email && <p className="text-xs text-slate-500 truncate">{p.email}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="h-[600px] [&_.rbc-calendar]:!bg-white [&_.rbc-header]:!bg-slate-50 [&_.rbc-header]:!text-slate-800 [&_.rbc-header]:!border-slate-200 [&_.rbc-today]:!bg-amber-50 [&_.rbc-off-range-bg]:!bg-slate-50/50 [&_.rbc-date-cell]:!text-slate-900 [&_.rbc-date-cell]:!text-base [&_.rbc-date-cell]:!font-medium [&_.rbc-time-view]:!border-slate-200 [&_.rbc-time-slot]:!text-slate-500 [&_.rbc-event]:!text-white [&_.rbc-event]:!rounded-lg [&_.rbc-toolbar]:!flex [&_.rbc-toolbar]:!gap-2 [&_.rbc-toolbar]:!p-4 [&_.rbc-toolbar_label]:!text-slate-900 [&_.rbc-toolbar_label]:!text-lg [&_.rbc-btn-group]:!flex [&_.rbc-btn-group]:!gap-1 button.rbc-button:!bg-white button.rbc-button:!text-slate-700 button.rbc-button:!border-slate-200 button.rbc-button:!px-3 button.rbc-button:!py-1.5 button.rbc-button:!rounded-lg button.rbc-button:hover:!bg-slate-50 [&_.rbc-month-view]:!border-0 [&_.rbc-day-bg]:!border-slate-100 [&_.rbc-row-segment]:!p-1 [&_.rbc-row]:!min-h-[80px]">
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
                previous: '←',
                next: '→',
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
        </div>
      </div>

      {/* Modal Integrações */}
      {showIntegrations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowIntegrations(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Integrações</h2>
              <button type="button" onClick={() => setShowIntegrations(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Conecte seu calendário ao Google Calendar, Outlook ou outras ferramentas. Em breve você poderá sincronizar eventos aqui.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowIntegrations(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

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
