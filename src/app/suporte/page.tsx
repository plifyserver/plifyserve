import Link from 'next/link'
import { Mail, MessageCircle } from 'lucide-react'
import { SITE_CONTAINER_MD, SITE_GUTTER_X } from '@/lib/siteLayout'

export const metadata = {
  title: 'Suporte | Plify',
  description: 'Entre em contato com o suporte do Plify.',
}

export default function SuportePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200">
        <div className={`${SITE_CONTAINER_MD} ${SITE_GUTTER_X} py-6 flex items-center justify-between`}>
          <Link href="/" className="flex items-center gap-2">
            <img src="/logopreto.png" alt="Plify" className="h-8 w-auto object-contain" />
          </Link>
          <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm">Voltar</Link>
        </div>
      </header>
      <main className={`max-w-2xl mx-auto ${SITE_GUTTER_X} py-16`}>
        <h1 className="text-3xl font-bold mb-4">Suporte</h1>
        <p className="text-gray-500 mb-6">
          Estamos aqui para ajudar. O canal depende do seu plano: <strong>Essential</strong> por e-mail;{' '}
          <strong>Pro</strong> pelo WhatsApp (também disponível dentro do app, no menu de suporte).
        </p>
        <div className="space-y-6">
          <a
            href="mailto:plifyserver@gmail.com"
            className="flex items-center gap-4 p-6 rounded-xl bg-white border border-gray-200 hover:border-avocado/50 shadow-sm transition-colors group"
          >
            <div className="w-12 h-12 rounded-lg bg-avocado/20 flex items-center justify-center group-hover:bg-avocado/30 transition-colors">
              <Mail className="w-6 h-6 text-avocado" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">E-mail (Essential)</h2>
              <p className="text-gray-500 text-sm">plifyserver@gmail.com</p>
              <p className="text-gray-500 text-sm mt-1">Resposta em até 24 horas úteis</p>
            </div>
          </a>
          <a
            href="https://wa.me/5543996769373"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-6 rounded-xl bg-white border border-gray-200 hover:border-avocado/50 shadow-sm transition-colors group"
          >
            <div className="w-12 h-12 rounded-lg bg-avocado/20 flex items-center justify-center group-hover:bg-avocado/30 transition-colors">
              <MessageCircle className="w-6 h-6 text-avocado" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">WhatsApp (Pro)</h2>
              <p className="text-gray-500 text-sm">Atendimento direto para assinantes Pro</p>
              <p className="text-gray-500 text-sm mt-1">Abrir conversa no WhatsApp</p>
            </div>
          </a>
        </div>
        <div className="mt-12 p-6 rounded-xl bg-gray-50 border border-gray-200">
          <h3 className="font-semibold mb-2">Dúvidas frequentes</h3>
          <p className="text-gray-500 text-sm">Consulte também nossos <Link href="/termos-uso" className="text-avocado hover:underline">Termos de Uso</Link> e <Link href="/termos-privacidade" className="text-avocado hover:underline">Termos de Privacidade</Link>.</p>
        </div>
      </main>
    </div>
  )
}
