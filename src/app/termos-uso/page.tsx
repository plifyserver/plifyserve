import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Termos de Uso | Plify',
  description: 'Termos e condições de uso do Plify.',
}

export default function TermosUsoPage() {
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
        <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
        <div className="prose prose-gray max-w-none max-w-none space-y-6 text-gray-600">
          <p>Última atualização: Janeiro de 2025</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">1. Aceitação dos Termos</h2>
          <p>Ao acessar e usar o Plify, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">2. Descrição do Serviço</h2>
          <p>O Plify oferece ferramentas para gestão de métricas de anúncios Meta, criação de propostas comerciais e publicação de mini-sites empresariais.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">3. Uso Aceitável</h2>
          <p>Você se compromete a não usar o serviço para fins ilegais, enviar spam ou violar direitos de terceiros. Reservamo-nos o direito de suspender contas que violem estes termos.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">4. Planos e Pagamento</h2>
          <p>O plano gratuito possui limites de uso. Planos pagos seguem as condições descritas no momento da assinatura. Cancelamentos podem ser feitos a qualquer momento.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">5. Contato</h2>
          <p>Dúvidas sobre os termos? Entre em contato pelo <Link href="/suporte" className="text-avocado hover:underline">Suporte</Link>.</p>
        </div>
      </main>
    </div>
  )
}
