'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  FolderOpen,
  DollarSign,
  LogOut,
  Menu,
  X,
  Network,
  Calendar,
  Settings,
} from 'lucide-react'
import { useState } from 'react'
import { NextEventNotification } from '@/components/NextEventNotification'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/metricas', icon: BarChart3, label: 'Métricas Meta' },
  { href: '/dashboard/templates', icon: FileText, label: 'Templates' },
  { href: '/dashboard/propostas', icon: FolderOpen, label: 'Propostas' },
  { href: '/dashboard/mapa-mental', icon: Network, label: 'Mapa Mental' },
  { href: '/dashboard/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/dashboard/faturamento', icon: DollarSign, label: 'Faturamento' },
  { href: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, signOut, refreshProfile } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      refreshProfile()
      router.replace('/dashboard')
    }
  }, [searchParams, refreshProfile, router])

  const handleSignOut = async () => {
    setSidebarOpen(false)
    await signOut()
    router.push('/')
    router.refresh()
  }

  const isPro = profile?.plan === 'pro' || profile?.is_pro

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/80 border-r border-gray-200 fixed h-full">
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex justify-center">
            <Image src="/plify.png" alt="Plify" width={56} height={56} className="rounded-xl logo-avocado" />
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-avocado text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 space-y-2">
          {!isPro && (
            <Link
              href="/dashboard/assinatura"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30"
            >
              <DollarSign className="w-5 h-5" />
              Assinar Pro - R$ 4,90/mês
            </Link>
          )}
          <p className="px-4 py-2 text-sm text-gray-500">
            Propostas ilimitadas
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass flex items-center justify-between p-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/dashboard">
          <Image src="/plify.png" alt="Plify" width={44} height={44} className="rounded-xl logo-avocado" />
        </Link>
        <div className="w-10" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 shadow-xl transform transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex justify-between items-center border-b border-gray-200">
          <span className="font-bold">Menu</span>
          <button onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                pathname === item.href ? 'bg-avocado text-white' : 'text-gray-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          <NextEventNotification />
          {children}
        </div>
      </main>
    </div>
  )
}
