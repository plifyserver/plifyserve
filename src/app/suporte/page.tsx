import Link from 'next/link'
import Image from 'next/image'
import { Mail, MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'Suporte | Plify',
  description: 'Entre em contato com o suporte do Plify.',
}

export default function SuportePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/plify.png" alt="Plify" width={44} height={44} className="rounded-xl logo-avocado" />
          </Link>
          <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm">Voltar</Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4">Suporte</h1>
        <p className="text-gray-500 mb-12">Estamos aqui para ajudar. Escolha uma forma de contato:</p>
        <div className="space-y-6">
          <a
            href="mailto:suporte@plify.com.br"
            className="flex items-center gap-4 p-6 rounded-xl bg-white border border-gray-200 hover:border-avocado/50 shadow-sm transition-colors group"
          >
            <div className="w-12 h-12 rounded-lg bg-avocado/20 flex items-center justify-center group-hover:bg-avocado/30 transition-colors">
              <Mail className="w-6 h-6 text-avocado" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Email</h2>
              <p className="text-gray-500 text-sm">suporte@plify.com.br</p>
              <p className="text-gray-500 text-sm mt-1">Resposta em até 24 horas úteis</p>
            </div>
          </a>
          <div className="flex items-center gap-4 p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-avocado/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-avocado" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Chat</h2>
              <p className="text-gray-500 text-sm">Em breve</p>
            </div>
          </div>
        </div>
        <div className="mt-12 p-6 rounded-xl bg-gray-50 border border-gray-200">
          <h3 className="font-semibold mb-2">Dúvidas frequentes</h3>
          <p className="text-gray-500 text-sm">Consulte também nossos <Link href="/termos-uso" className="text-avocado hover:underline">Termos de Uso</Link> e <Link href="/termos-privacidade" className="text-avocado hover:underline">Termos de Privacidade</Link>.</p>
        </div>
      </main>
    </div>
  )
}
