'use client'

import { useCallback, useEffect, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useAuth } from '@/contexts/AuthContext'
import { X, Loader2, Link2, Plus, Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const locales = { 'pt-BR': ptBR }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
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

const EVENT_COLORS = {
  default: '#6366F1',
  meeting: '#10B981',
  deadline: '#F59E0B',
  personal: '#EC4899',
}

type EventItem = {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  all_day?: boolean
  color?: string
  type?: 'default' | 'meeting' | 'deadline' | 'personal'
}

type ViewType = 'month' | 'week' | 'day' | 'agenda'

export default function AgendaPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('month')
  const [form, setForm] = useState({ title: '', description: '', location: '', start: '', end: '', all_day: false, type: 'default' as EventItem['type'], color: '#6366F1' })
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [peopleSearch, setPeopleSearch] = useState('')

  const fetchEvents = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/events', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setEvents(
          (Array.isArray(data) ? data : []).map((e: { id: string; title: string; start_at: string; end_at: string; description?: string; location?: string; all_day?: boolean; type?: string }) => ({
            id: e.id,
            title: e.title,
            start: new Date(e.start_at),
            end: new Date(e.end_at),
            description: e.description,
            location: e.location,
            all_day: e.all_day,
            type: (e.type as EventItem['type']) || 'default',
            color: (e as { color?: string }).color || EVENT_COLORS[(e.type as keyof typeof EVENT_COLORS) || 'default'] || EVENT_COLORS.default,
          }))
        )
      }
    } catch {
      // Tabela events pode não existir ainda
    }
  }, [user])

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
      type: 'default',
      color: '#6366F1',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Preencha o título do evento.')
      return
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      start_at: new Date(form.start).toISOString(),
      end_at: new Date(form.end).toISOString(),
      all_day: form.all_day,
      color: form.color || null,
    }
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error((data as { error?: string }).error || 'Não foi possível criar o evento. Tente novamente.')
      return
    }
    setShowModal(false)
    setForm({ title: '', description: '', location: '', start: '', end: '', all_day: false, type: 'default', color: '#6366F1' })
    toast.success('Evento criado!')
    fetchEvents()
  }

  const handleDeleteEvent = async (event: EventItem) => {
    setEventToDelete(event)
  }
  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return
    setDeleting(true)
    const res = await fetch(`/api/events/${eventToDelete.id}`, { method: 'DELETE', credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    setDeleting(false)
    if (!res.ok) {
      toast.error((data as { error?: string }).error || 'Não foi possível excluir o evento.')
      return false
    }
    setSelectedEvent(null)
    setEventToDelete(null)
    toast.success('Evento excluído.')
    fetchEvents()
  }

  const eventStyleGetter = (event: EventItem) => ({
    style: {
      backgroundColor: event.color ?? EVENT_COLORS.default,
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      padding: '2px 8px',
      fontSize: '12px',
      fontWeight: 500,
    },
  })

  const miniCalendarStart = startOfWeek(startOfMonth(date), { weekStartsOn: 0 })
  const miniCalendarDays = eachDayOfInterval({
    start: miniCalendarStart,
    end: new Date(miniCalendarStart.getTime() + 41 * 24 * 60 * 60 * 1000),
  })

  const peoplePlaceholder = [
    { id: '1', name: user?.user_metadata?.full_name ?? 'Você', email: user?.email ?? '', color: '#6366F1' },
    { id: '2', name: 'Equipe', email: 'equipe@exemplo.com', color: '#10B981' },
  ]
  const peopleFiltered = peopleSearch.trim()
    ? peoplePlaceholder.filter(
        (p) =>
          p.name.toLowerCase().includes(peopleSearch.toLowerCase()) ||
          p.email.toLowerCase().includes(peopleSearch.toLowerCase())
      )
    : peoplePlaceholder

  const todayEvents = events.filter((e) => isSameDay(e.start, date))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie seus compromissos e reuniões</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            className="h-10 rounded-xl gap-2 border-slate-200 hover:bg-slate-50" 
            onClick={() => setShowIntegrations(true)}
          >
            <Link2 className="w-4 h-4" />
            Integrações
          </Button>
          <Button 
            className="h-10 rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" 
            onClick={() => handleSelectSlot({ start: new Date(), end: new Date(Date.now() + 3600000) })}
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex gap-6">
        {/* Painel lateral */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 space-y-4">
          {/* Mini calendário */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 capitalize">
                {format(date, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => setDate(subMonths(date, 1))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <button 
                  onClick={() => setDate(addMonths(date, 1))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <span key={d} className="py-1">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {miniCalendarDays.map((d) => {
                const hasEvent = events.some((e) => isSameDay(e.start, d))
                const isToday = isSameDay(d, new Date())
                const isSelected = isSameDay(d, date)
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    className={cn(
                      'relative aspect-square rounded-lg transition-all text-sm font-medium',
                      isToday && !isSelected && 'text-indigo-600 bg-indigo-50',
                      isSelected && 'bg-indigo-600 text-white shadow-sm',
                      !isToday && !isSelected && isSameMonth(d, date) && 'text-slate-700 hover:bg-slate-100',
                      !isSameMonth(d, date) && 'text-slate-300'
                    )}
                    onClick={() => setDate(d)}
                  >
                    {format(d, 'd')}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pessoas */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Pessoas</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar pessoas..."
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                className="pl-9 h-9 text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <ul className="space-y-3">
              {peopleFiltered.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 text-sm truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 truncate">{p.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Eventos do dia */}
          {todayEvents.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Hoje, {format(date, "d 'de' MMMM", { locale: ptBR })}
              </h3>
              <ul className="space-y-2">
                {todayEvents.slice(0, 3).map((e) => (
                  <li key={e.id} className="flex items-start gap-2">
                    <div 
                      className="w-1 h-full min-h-[40px] rounded-full mt-0.5"
                      style={{ backgroundColor: e.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 text-sm truncate">{e.title}</p>
                      <p className="text-xs text-slate-500">
                        {format(e.start, 'HH:mm')} - {format(e.end, 'HH:mm')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Calendário principal */}
        <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          {/* Header do calendário */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-900 capitalize">
                {format(date, "MMMM 'de' yyyy", { locale: ptBR })}
              </h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setDate(view === 'week' ? new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000) : subMonths(date, 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button 
                  onClick={() => setDate(view === 'week' ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000) : addMonths(date, 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(['day', 'week', 'month'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={cn(
                      'px-4 py-1.5 text-sm font-medium rounded-lg transition-all',
                      view === v 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendário */}
          <div className="h-[580px] calendar-clean">
            <style jsx global>{`
              .calendar-clean .rbc-calendar {
                background: white;
                font-family: inherit;
              }
              .calendar-clean .rbc-toolbar {
                display: none;
              }
              .calendar-clean .rbc-month-view {
                border: none;
              }
              .calendar-clean .rbc-header {
                padding: 12px 8px;
                font-weight: 500;
                font-size: 13px;
                color: #64748b;
                border-bottom: 1px solid #e2e8f0;
                text-transform: capitalize;
                background: #f8fafc;
              }
              .calendar-clean .rbc-header + .rbc-header {
                border-left: 1px solid #e2e8f0;
              }
              .calendar-clean .rbc-day-bg {
                border-left: 1px solid #f1f5f9;
              }
              .calendar-clean .rbc-day-bg + .rbc-day-bg {
                border-left: 1px solid #f1f5f9;
              }
              .calendar-clean .rbc-month-row {
                border-bottom: 1px solid #f1f5f9;
              }
              .calendar-clean .rbc-month-row + .rbc-month-row {
                border-top: none;
              }
              .calendar-clean .rbc-date-cell {
                padding: 8px 12px;
                text-align: center;
                font-size: 14px;
                font-weight: 500;
                color: #334155;
              }
              .calendar-clean .rbc-date-cell.rbc-now {
                font-weight: 600;
              }
              .calendar-clean .rbc-date-cell.rbc-now > a {
                background: #6366f1;
                color: white;
                width: 28px;
                height: 28px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
              }
              .calendar-clean .rbc-off-range-bg {
                background: #fafafa;
              }
              .calendar-clean .rbc-off-range {
                color: #cbd5e1;
              }
              .calendar-clean .rbc-today {
                background: #eef2ff;
              }
              .calendar-clean .rbc-event {
                border-radius: 6px;
                padding: 2px 8px;
                font-size: 12px;
                font-weight: 500;
                border: none;
              }
              .calendar-clean .rbc-event-content {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .calendar-clean .rbc-row-segment {
                padding: 2px 4px;
              }
              .calendar-clean .rbc-show-more {
                color: #6366f1;
                font-size: 12px;
                font-weight: 500;
                margin-top: 2px;
              }
              .calendar-clean .rbc-time-view {
                border: none;
              }
              .calendar-clean .rbc-time-header {
                border-bottom: 1px solid #e2e8f0;
              }
              .calendar-clean .rbc-time-content {
                border-top: none;
              }
              .calendar-clean .rbc-time-slot {
                border-top: 1px solid #f1f5f9;
              }
              .calendar-clean .rbc-timeslot-group {
                border-bottom: 1px solid #f1f5f9;
              }
              .calendar-clean .rbc-time-gutter {
                font-size: 11px;
                color: #94a3b8;
              }
              .calendar-clean .rbc-day-slot .rbc-time-slot {
                border-top: 1px solid #f8fafc;
              }
              .calendar-clean .rbc-current-time-indicator {
                background-color: #ef4444;
                height: 2px;
              }
              .calendar-clean .rbc-current-time-indicator::before {
                content: '';
                position: absolute;
                left: -5px;
                top: -4px;
                width: 10px;
                height: 10px;
                background: #ef4444;
                border-radius: 50%;
              }
            `}</style>
            <Calendar
              culture="pt-BR"
              localizer={localizer}
              formats={formats}
              events={events}
              startAccessor="start"
              endAccessor="end"
              date={date}
              view={view}
              onNavigate={(d: Date) => setDate(d)}
              onView={(v: ViewType) => setView(v)}
              style={{ height: '100%' }}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={(event: EventItem) => setSelectedEvent(event)}
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
                showMore: (n: number) => `+${n} mais`,
                allDay: 'Dia inteiro',
              }}
            />
          </div>
        </div>
      </div>

      {/* Modal Integrações */}
      {showIntegrations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowIntegrations(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Integrações</h2>
              </div>
              <button type="button" onClick={() => setShowIntegrations(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Conecte seu calendário ao Google Calendar, Outlook ou outras ferramentas para sincronizar seus eventos automaticamente.
            </p>
            <div className="space-y-3 mb-6">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 text-sm">Google Calendar</p>
                  <p className="text-xs text-slate-500">Em breve</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-sky-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 text-sm">Outlook</p>
                  <p className="text-xs text-slate-500">Em breve</p>
                </div>
              </button>
            </div>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowIntegrations(false)}>
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* Modal Novo Evento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Novo Evento</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Reunião com cliente"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Adicione detalhes sobre o evento..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Ex: Escritório, Google Meet, Zoom..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Início</label>
                  <input
                    type="datetime-local"
                    value={form.start}
                    onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fim</label>
                  <input
                    type="datetime-local"
                    value={form.end}
                    onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="all_day"
                  checked={form.all_day}
                  onChange={(e) => setForm((f) => ({ ...f, all_day: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="all_day" className="text-sm text-slate-600">
                  Dia inteiro
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cor no calendário</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono w-24"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Criar Evento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes do Evento */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: selectedEvent.color ? `${selectedEvent.color}20` : '#EEF2FF', color: selectedEvent.color ?? '#6366F1' }}
              >
                <CalendarIcon className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">{selectedEvent.title}</h2>
            <div className="space-y-3 mt-4">
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-700">Horário</p>
                  <p className="text-slate-600">
                    {selectedEvent.all_day
                      ? format(selectedEvent.start, "EEEE, d 'de' MMMM", { locale: ptBR }) + ' (dia inteiro)'
                      : `${format(selectedEvent.start, "d/MM/yyyy 'às' HH:mm", { locale: ptBR })} – ${format(selectedEvent.end, 'HH:mm', { locale: ptBR })}`}
                  </p>
                </div>
              </div>
              {selectedEvent.location && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-700">Local</p>
                    <p className="text-slate-600">{selectedEvent.location}</p>
                  </div>
                </div>
              )}
              {selectedEvent.description && (
                <div className="flex items-start gap-3 text-sm">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-700">Descrição</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setSelectedEvent(null)}
              >
                Fechar
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => selectedEvent && handleDeleteEvent(selectedEvent)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!eventToDelete}
        onOpenChange={(open) => !open && setEventToDelete(null)}
        title="Excluir evento?"
        description="Esta ação não pode ser desfeita. O evento será removido da agenda."
        confirmLabel="Excluir"
        onConfirm={confirmDeleteEvent}
        loading={deleting}
      />
    </div>
  )
}
