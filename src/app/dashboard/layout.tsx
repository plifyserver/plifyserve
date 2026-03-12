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
  Sparkles,
  CreditCard,
} from 'lucide-react'
import { UpgradeModal } from '@/components/UpgradeModal'
import NotificationsDropdown from '@/components/NotificationsDropdown'
import { LOGO_PRETO, LOGO_BRANCO } from '@/lib/logo'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clientes', icon: Users, label: 'Clientes' },
  { href: '/dashboard/propostas', icon: FileText, label: 'Propostas' },
  { href: '/dashboard/documentos', icon: FileSignature, label: 'Contratos' },
  { href: '/dashboard/projetos', icon: Briefcase, label: 'Projetos' },
  { href: '/dashboard/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/dashboard/mapa-mental', icon: Network, label: 'Mapa Mental' },
  { href: '/dashboard/ads', icon: BarChart3, label: 'Ads' },
  { href: '/dashboard/financeiro', icon: DollarSign, label: 'Financeiro' },
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
    navItems.slice(0, 6).forEach((item) => router.prefetch(item.href))
  }, [router])

  useEffect(() => {
    const onSettingsUpdated = () => {
      fetchSettings()
      setLogoCacheBust(Date.now())
    }
    window.addEventListener('app-settings-updated', onSettingsUpdated)
    return () => window.removeEventListener('app-settings-updated', onSettingsUpdated)
  }, [fetchSettings])

  useEffect(() => {
    const primary = settings?.primary_color || '#3B82F6'
    const secondary = settings?.secondary_color || '#1E293B'
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

  const accentColor = settings?.primary_color || '#ea580c'
  const sidebarBg = settings?.secondary_color || '#121212'
  const appName = settings?.app_name || ''
  const logoBase = settings?.logo_url && settings.logo_url.trim() !== '' ? settings.logo_url.trim() : null
  const logoUrl = logoBase
    ? logoBase + (logoBase.includes('?') ? '&' : '?') + 't=' + logoCacheBust
    : LOGO_BRANCO

  return (
    <div className="min-h-screen bg-slate-100">
      <style>{`
        :root {
          --primary-color: ${accentColor};
          --secondary-color: ${sidebarBg};
        }
        @keyframes upgradeGlow {
          0%, 100% { box-shadow: 0 1px 3px ${accentColor}40; opacity: 1; }
          50% { box-shadow: 0 0 14px ${accentColor}60, 0 1px 3px ${accentColor}40; opacity: 0.95; }
        }
        .btn-upgrade-animated {
          animation: upgradeGlow 2.5s ease-in-out infinite;
        }
        .btn-upgrade-animated:hover {
          animation: upgradeGlow 1.2s ease-in-out infinite;
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
                width={160} 
                height={40} 
                className="h-10 w-auto max-w-[180px] object-contain object-left" 
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
          {navItems.map((item) => (
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
        </nav>
        <div className="p-2 border-t border-white/10 flex flex-col gap-0.5">
          {/* Upgrade Pro button */}
          {!sidebarCollapsed && !isPro && (
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="btn-upgrade-animated flex items-center gap-3 w-full px-3 py-2.5 mb-1 rounded-lg text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                boxShadow: `0 1px 3px ${accentColor}40`,
              }}
            >
              <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" />
              <span>Upgrade Pro</span>
            </button>
          )}
          {sidebarCollapsed && !isPro && (
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="btn-upgrade-animated flex items-center justify-center w-full p-2.5 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
              title="Upgrade Pro"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                boxShadow: `0 1px 3px ${accentColor}40`,
              }}
            >
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
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
          <Image src={LOGO_PRETO} alt="Logo" width={140} height={40} className="h-10 w-auto max-w-[180px] object-contain" priority />
        </Link>
        <div className="w-10" />
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
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center">
            <Image 
              src={logoUrl} 
              alt="Logo" 
              width={160} 
              height={40} 
              className="h-10 w-auto max-w-[180px] object-contain" 
              priority 
            />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-white/80">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
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
        </nav>
        <div className="p-2 space-y-1">
          {!isPro && (
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false)
                setShowUpgradeModal(true)
              }}
              className="btn-upgrade-animated flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white font-medium hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                boxShadow: `0 1px 3px ${accentColor}40`,
              }}
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
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

      {/* Main - quadrado à esquerda (onde encontra o menu), redondo à direita */}
      <div className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 lg:mt-1 lg:mr-2 lg:mb-2 rounded-tl-none rounded-bl-none rounded-tr-lg rounded-br-lg overflow-hidden bg-white shadow-sm ${sidebarCollapsed ? 'lg:ml-[84px]' : 'lg:ml-[260px]'}`}>
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
