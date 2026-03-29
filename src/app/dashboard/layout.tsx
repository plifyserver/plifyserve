'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  Calendar,
  BarChart3,
  DollarSign,
  FileSignature,
  Columns3,
  Network,
  Palette,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  User,
  CreditCard,
  Headphones,
  Moon,
  Sun,
  Calculator,
  Shield,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import NotificationsDropdown from '@/components/NotificationsDropdown'
import { LOGO_PRETO, LOGO_BRANCO } from '@/lib/logo'
import { cn } from '@/lib/utils'
import { SITE_GUTTER_X } from '@/lib/siteLayout'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clientes', icon: Users, label: 'Clientes' },
  { href: '/dashboard/propostas', icon: FileText, label: 'Propostas' },
  { href: '/dashboard/documentos', icon: FileSignature, label: 'Contratos' },
  { href: '/dashboard/projetos', icon: Briefcase, label: 'Projetos' },
  { href: '/dashboard/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/dashboard/chat-ia', icon: Headphones, label: 'Chat IA' },
  { href: '/dashboard/mapa-mental', icon: Network, label: 'Mapa Mental' },
  { href: '/dashboard/ads', icon: BarChart3, label: 'Ads' },
  { href: '/dashboard/financeiro', icon: DollarSign, label: 'Gastos Pessoais' },
  { href: '/dashboard/calculadora', icon: Calculator, label: 'Calculadora' },
  { href: '/dashboard/kanban', icon: Columns3, label: 'Kanban' },
  { href: '/dashboard/personalizacao', icon: Palette, label: 'Personalização' },
  { href: '/dashboard/planos', icon: CreditCard, label: 'Planos' },
  { href: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
]

interface AppSettings {
  app_name?: string | null
  logo_url?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  theme?: string | null
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [logoCacheBust, setLogoCacheBust] = useState(() => Date.now())
  const [profileOpen, setProfileOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [supportName, setSupportName] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const headerRef = useRef<HTMLDivElement>(null)

  const handleSupportEmail = useCallback(() => {
    const name = supportName.trim() || 'Contato'
    const body = `Nome: ${supportName.trim() || 'Não informado'}\n\nDúvida/Sugestão:\n${supportMessage.trim() || '—'}`
    const mailto = `mailto:plifyserver@gmail.com?subject=${encodeURIComponent(`Suporte Plify - ${name}`)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
    setSupportOpen(false)
    setSupportName('')
    setSupportMessage('')
  }, [supportName, supportMessage])

  const handleSupportWhatsApp = useCallback(() => {
    const text = `*Suporte Plify*\n\nNome: ${supportName.trim() || 'Não informado'}\n\nDúvida/Sugestão:\n${supportMessage.trim() || '—'}`
    const url = `https://wa.me/5543996769373?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setSupportOpen(false)
    setSupportName('')
    setSupportMessage('')
  }, [supportName, supportMessage])

  const isPro = !!(profile?.is_pro || profile?.account_type === 'admin')
  const navItemsFiltered = navItems.filter((item) => {
    if (item.href === '/dashboard/ads' || item.href === '/dashboard/personalizacao') {
      return isPro
    }
    return true
  })

  useEffect(() => {
    const closeDropdowns = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('click', closeDropdowns)
    return () => document.removeEventListener('click', closeDropdowns)
  }, [])

  const fetchSettings = useCallback(() => {
    fetch('/api/app-settings', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSettings(data))
      .catch(() => setSettings(null))
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    const onSettingsUpdated = () => {
      fetchSettings()
      setLogoCacheBust(Date.now())
    }
    window.addEventListener('app-settings-updated', onSettingsUpdated)
    return () => window.removeEventListener('app-settings-updated', onSettingsUpdated)
  }, [fetchSettings])

  useEffect(() => {
    const primary = settings?.primary_color || '#dc2626'
    const secondary = settings?.secondary_color || '#121212'
    document.documentElement.style.setProperty('--primary-color', primary)
    document.documentElement.style.setProperty('--secondary-color', secondary)
    document.title = (settings?.app_name?.trim() && settings.app_name) ? settings.app_name : 'Plify - Gestão e Propostas'
  }, [settings, pathname])

  const handleSignOut = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setSidebarOpen(false)
    setProfileOpen(false)
    window.location.href = '/api/auth/logout'
  }, [])

  const { mode: themeMode, toggleTheme } = useTheme()
  const accentColor = settings?.primary_color || '#dc2626'
  const sidebarBg = settings?.secondary_color || '#121212'
  const appName = settings?.app_name || ''
  const logoBase = settings?.logo_url && settings.logo_url.trim() !== '' ? settings.logo_url.trim() : null
  const logoUrl = logoBase
    ? logoBase + (logoBase.includes('?') ? '&' : '?') + 't=' + logoCacheBust
    : LOGO_BRANCO

  return (
    <div className="dashboard-app min-h-screen bg-slate-100">
      <style>{`
        :root {
          --primary-color: ${accentColor};
          --secondary-color: ${sidebarBg};
        }
      `}</style>

      {/* Sidebar - azul escuro: redondo à esquerda (pra fora), quadrado à direita */}
      <aside
        className="fixed top-1 left-1 bottom-1 z-40 transition-all duration-300 hidden lg:flex flex-col rounded-l-lg overflow-hidden"
        style={{
          width: sidebarCollapsed ? 80 : 256,
          backgroundColor: sidebarBg,
          height: 'calc(100vh - 0.5rem)',
        }}
      >
        <div className="px-4 py-3 flex items-center justify-between min-h-[56px] border-b border-white/10">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex-1 min-w-0 flex items-center">
              <Image 
                src={logoUrl} 
                alt="Logo" 
                width={80} 
                height={20} 
                className="h-5 w-auto max-w-[90px] object-contain object-left" 
                priority 
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (!target.src.endsWith(LOGO_BRANCO)) {
                    target.src = LOGO_BRANCO
                  }
                }}
              />
            </Link>
          )}
          {sidebarCollapsed && <div className="flex-1" />}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 flex-shrink-0"
            title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItemsFiltered.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onMouseEnter={() => router.prefetch(item.href)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              style={pathname === item.href ? { backgroundColor: accentColor } : undefined}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
          {profile?.account_type === 'admin' && (
            <>
              <div className="my-2 border-t border-white/10" aria-hidden />
              <Link
                href="/admin"
                prefetch
                onMouseEnter={() => router.prefetch('/admin')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                style={pathname.startsWith('/admin') ? { backgroundColor: accentColor } : undefined}
                title={sidebarCollapsed ? 'Painel Admin' : undefined}
              >
                <Shield className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="truncate">Painel Admin</span>}
              </Link>
            </>
          )}
        </nav>
        <div className="p-2 border-t border-white/10 flex flex-col gap-0.5">
          {!sidebarCollapsed ? (
            <button
              type="button"
              onClick={(e) => handleSignOut(e)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 text-left"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Sair</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => handleSignOut(e)}
              className="flex items-center justify-center w-full p-2.5 rounded-lg text-white/70 hover:bg-white/10"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between py-3 min-h-[52px] sm:min-h-[56px]',
          SITE_GUTTER_X
        )}
      >
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 sm:p-2 -ml-1" aria-label="Abrir menu">
          <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
        </button>
        <Link href="/dashboard" className="flex items-center min-w-0 flex-1 justify-center">
          <Image src={LOGO_PRETO} alt="Logo" width={140} height={40} className="h-8 w-auto sm:h-10 max-w-[140px] sm:max-w-[180px] object-contain" priority />
        </Link>
        <div className="w-9 sm:w-10 shrink-0" aria-hidden />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 shadow-xl transition-transform rounded-l-lg overflow-hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: sidebarBg }}
      >
        <div className="p-3 sm:p-4 flex justify-between items-center border-b border-white/10 min-h-[52px] sm:min-h-[56px]">
          <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center min-w-0">
            <Image 
              src={logoUrl} 
              alt="Logo" 
              width={80} 
              height={20} 
              className="h-4 w-auto sm:h-5 max-w-[70px] sm:max-w-[90px] object-contain" 
              priority 
            />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 sm:p-2 text-white/80 shrink-0" aria-label="Fechar menu">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-2 space-y-1">
          {navItemsFiltered.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onMouseEnter={() => router.prefetch(item.href)}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                pathname === item.href ? 'text-white' : 'text-white/70'
              }`}
              style={pathname === item.href ? { backgroundColor: accentColor } : undefined}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          {profile?.account_type === 'admin' && (
            <>
              <div className="my-2 border-t border-white/10" aria-hidden />
              <Link
                href="/admin"
                prefetch={false}
                onMouseEnter={() => router.prefetch('/admin')}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                  pathname.startsWith('/admin') ? 'text-white' : 'text-white/70'
                }`}
                style={pathname.startsWith('/admin') ? { backgroundColor: accentColor } : undefined}
              >
                <Shield className="w-5 h-5" />
                Painel Admin
              </Link>
            </>
          )}
        </nav>
        <div className="p-2 space-y-1">
          <button
            type="button"
            onClick={(e) => handleSignOut(e)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main - quadrado à esquerda (onde encontra o menu), redondo à direita */}
      <div className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 lg:mt-1 lg:mr-2 lg:mb-2 rounded-tl-none rounded-bl-none rounded-tr-lg rounded-br-lg bg-white shadow-sm ${sidebarCollapsed ? 'lg:ml-[84px]' : 'lg:ml-[260px]'}`}>
        <header ref={headerRef} className={cn('bg-white border-b border-slate-200 py-3 relative', SITE_GUTTER_X)}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Buscar..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => toggleTheme()}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title={themeMode === 'dark' ? 'Modo claro' : 'Modo escuro'}
                aria-label={themeMode === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {themeMode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              {/* Suporte */}
              <button
                type="button"
                onClick={() => setSupportOpen(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: accentColor }}
                title="Suporte"
                aria-label="Abrir suporte"
              >
                Suporte
              </button>
              {/* Notificações */}
              {user?.id && (
                <NotificationsDropdown userId={user.id} />
              )}
              {/* Perfil */}
              <div className="relative pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setProfileOpen((v) => !v)
                  }}
                  className="flex items-center gap-2 rounded-lg py-1 pr-1 hover:bg-slate-100 transition-colors text-left min-w-0"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={`${profile.avatar_url}${profile.avatar_url.includes('?') ? '&' : '?'}t=${profile.updated_at || ''}`}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                      style={{ backgroundColor: accentColor }}
                    >
                      {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700 hidden sm:inline max-w-[120px] truncate">
                    {profile?.full_name || profile?.email || 'Usuário'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 hidden sm:block shrink-0 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>
                {profileOpen && (
                  <div
                    className="z-[60] rounded-xl border border-slate-200 bg-white py-2 shadow-lg max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:top-[7.25rem] max-sm:w-auto sm:absolute sm:right-0 sm:top-full sm:mt-1 sm:w-56"
                    role="menu"
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name || 'Usuário'}</p>
                      {profile?.email && <p className="text-xs text-slate-500 truncate">{profile.email}</p>}
                    </div>
                    <Link
                      href="/dashboard/perfil"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      Meu perfil
                    </Link>
                    <Link
                      href="/dashboard/configuracoes"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      Configurações
                    </Link>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      type="button"
                      onClick={(e) => handleSignOut(e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className={cn('py-4 lg:py-6 bg-slate-100 min-w-0 overflow-x-auto', SITE_GUTTER_X)}>{children}</main>
      </div>

      {/* Suporte - popup */}
      {supportOpen && (
        <>
          <div className="fixed inset-0 z-[55] bg-black/50" onClick={() => setSupportOpen(false)} aria-hidden />
          <div className="fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 shadow-xl" role="dialog" aria-modal aria-labelledby="support-title">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="support-title" className="text-lg font-semibold text-slate-900">Suporte</h2>
              <button type="button" onClick={() => setSupportOpen(false)} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="support-name" className="mb-1 block text-sm font-medium text-slate-700">Nome completo</label>
                <input
                  id="support-name"
                  type="text"
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div>
                <label htmlFor="support-message" className="mb-1 block text-sm font-medium text-slate-700">Dúvida ou sugestão</label>
                <textarea
                  id="support-message"
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Descreva sua dúvida ou sugestão..."
                  rows={4}
                  className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSupportOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancelar
                </button>
                {isPro ? (
                  <button
                    type="button"
                    onClick={handleSupportWhatsApp}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: accentColor }}
                  >
                    Abrir WhatsApp
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSupportEmail}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: accentColor }}
                  >
                    Enviar e-mail
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
