'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldX, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export default function ContaBloqueadaPage() {
  const { signOut, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (profile && !profile.banned) {
      router.push('/dashboard')
    }
  }, [profile, router])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Conta Bloqueada</h1>
        
        <p className="text-slate-600 mb-6">
          Sua conta foi temporariamente suspensa. Se você acredita que isso é um erro, 
          entre em contato com nosso suporte.
        </p>

        <div className="space-y-3">
          <a 
            href="mailto:suporte@plify.com.br"
            className="block w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
          >
            Contatar Suporte
          </a>
          
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full rounded-xl gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  )
}
