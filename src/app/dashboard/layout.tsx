'use client'

import { useEffect, useState, useRef } from 'react'
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
  CheckSquare,
  Columns3,
  Network,
  FileBarChart,
  LayoutGrid,
  Palette,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  User,
  Sparkles,
  CreditCard,
} from 'lucide-react'
import { UpgradeModal } from '@/components/UpgradeModal'
import NotificationsDropdown from '@/components/NotificationsDropdown'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clientes', icon: Users, label: 'Clientes' },
  { href: '/dashboard/propostas', icon: FileText, label: 'Propostas' },
  { href: '/dashboard/documentos', icon: FileSignature, label: 'Contratos' },
  { href: '/dashboard/wello', icon: LayoutGrid, label: 'Wello' },
  { href: '/dashboard/projetos', icon: Briefcase, label: 'Projetos' },
  { href: '/dashboard/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/dashboard/mapa-mental', icon: Network, label: 'Mapa Mental' },
  { href: '/dashboard/ads', icon: BarChart3, label: 'Ads' },
  { href: '/dashboard/relatorios', icon: FileBarChart, label: 'Relatórios' },
  { href: '/dashboard/financeiro', icon: DollarSign, label: 'Financeiro' },
  { href: '/dashboard/tarefas', icon: CheckSquare, label: 'Tarefas' },
  { href: '/dashboard/kanban', icon: Columns3, label: 'Kanban' },
  { href: '/dashboard/personalizacao', icon: Palette, label: 'Personalização' },
  { href: '/dashboard/planos', icon: CreditCard, label: 'Planos' },
  { href: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
]

interface AppSettings {
  app_name?: string | null
  logo_url?: string | null
  favicon_url?: string | null
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
  const { user, profile, signOut } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  const isPro = profile?.plan === 'pro' || profile?.plan_type === 'pro' || profile?.account_type === 'admin'

  useEffect(() => {
    const closeDropdowns = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('click', closeDropdowns)
    return () => document.removeEventListener('click', closeDropdowns)
  }, [])

  useEffect(() => {
    fetch('/api/app-settings', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSettings(data))
      .catch(() => setSettings(null))
  }, [])

  useEffect(() => {
    if (!settings) return
    const primary = settings.primary_color || '#3B82F6'
    const secondary = settings.secondary_color || '#1E293B'
    document.documentElement.style.setProperty('--primary-color', primary)
    document.documentElement.style.setProperty('--secondary-color', secondary)
    if (settings.favicon_url) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = settings.favicon_url
    }
    if (settings.app_name) document.title = settings.app_name
  }, [settings])

  const handleSignOut = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setSidebarOpen(false)
    setProfileOpen(false)
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
    // Força redirecionamento usando window.location para garantir limpeza completa
    window.location.href = '/login'
  }

  const accentColor = settings?.primary_color || '#dc2626'
  const sidebarBg = settings?.secondary_color || '#1e293b'
  const appName = settings?.app_name || ''
  const logoUrl = settings?.logo_url && settings.logo_url.trim() !== '' ? settings.logo_url : '/logobranco.png'

  return (
    <div className="min-h-screen bg-slate-100">
      <style>{`
        :root {
          --primary-color: ${accentColor};
          --secondary-color: ${sidebarBg};
        }
      `}</style>

      {/* Sidebar - azul escuro */}
      <aside
        className="fixed top-0 left-0 z-40 h-full transition-all duration-300 hidden lg:flex flex-col"
        style={{
          width: sidebarCollapsed ? 80 : 256,
          backgroundColor: sidebarBg,
        }}
      >
        <div className="px-4 py-3 flex items-center justify-between min-h-[64px] border-b border-white/10">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex-1 min-w-0">
              <Image 
                src={logoUrl} 
                alt="Logo" 
                width={160} 
                height={40} 
                className="h-10 w-auto object-contain object-left" 
                priority 
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (target.src !== '/logobranco.png') {
                    target.src = '/logobranco.png'
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
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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
        </nav>
        <div className="p-2 border-t border-white/10 flex flex-col gap-0.5">
          {/* Upgrade Pro button */}
          {!sidebarCollapsed && !isPro && (
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-3 w-full px-3 py-2.5 mb-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all"
            >
              <Sparkles className="w-5 h-5 flex-shrink-0" />
              <span>Upgrade Pro</span>
            </button>
          )}
          {sidebarCollapsed && !isPro && (
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center justify-center w-full p-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              title="Upgrade Pro"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </button>
          )}
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between p-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="w-6 h-6 text-slate-700" />
        </button>
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logopreto.png" alt="Logo" width={140} height={36} className="h-9 max-w-[140px] object-contain" priority />
        </Link>
        <div className="w-10" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 shadow-xl transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: sidebarBg }}
      >
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <Link href="/dashboard" onClick={() => setSidebarOpen(false)}>
            <Image 
              src={logoUrl} 
              alt="Logo" 
              width={120} 
              height={32} 
              className="h-8 w-auto object-contain" 
              priority 
            />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-white/80">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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
        </nav>
        <div className="p-2 space-y-1">
          {!isPro && (
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false)
                setShowUpgradeModal(true)
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
            >
              <Sparkles className="w-5 h-5" />
              Upgrade Pro
            </button>
          )}
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

      {/* Main */}
      <div className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <header ref={headerRef} className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 relative">
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
                    <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
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
                    className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-2 z-50"
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
        <main className="p-4 lg:p-6 bg-slate-100">{children}</main>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        type="plan" 
      />
    </div>
  )
}
