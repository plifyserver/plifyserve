import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Termos de Privacidade | Plify',
  description: 'Política de privacidade do Plify.',
}

export default function TermosPrivacidadePage() {
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
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Termos de Privacidade</h1>
        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <p>Última atualização: Janeiro de 2025</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">1. Coleta de Dados</h2>
          <p>O Plify coleta informações necessárias para o funcionamento do serviço: dados de cadastro (email, nome), informações de autenticação e dados de uso da plataforma. Não vendemos seus dados a terceiros.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">2. Uso dos Dados</h2>
          <p>Utilizamos os dados para fornecer e melhorar nossos serviços, processar transações, comunicar-nos com você e cumprir obrigações legais.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">3. Segurança</h2>
          <p>Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração ou destruição.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">4. Contato</h2>
          <p>Para dúvidas sobre privacidade, entre em contato através da página de <Link href="/suporte" className="text-avocado hover:underline">Suporte</Link>.</p>
        </div>
      </main>
    </div>
  )
}
