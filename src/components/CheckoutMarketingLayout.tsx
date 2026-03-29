import Image from 'next/image'
import Link from 'next/link'
import { LOGO_PRETO } from '@/lib/logo'
import { SITE_GUTTER_X } from '@/lib/siteLayout'
import { cn } from '@/lib/utils'
import { CheckoutHeaderAuth } from '@/components/CheckoutHeaderAuth'

const ACCENT = '#dc2626'

type CheckoutMarketingLayoutProps = {
  children: React.ReactNode
  /** Se false, esconde o atalho (ex.: usuário ainda sem pagamento confirmado). */
  showDashboardLink?: boolean
}

export function CheckoutMarketingLayout({
  children,
  showDashboardLink = true,
}: CheckoutMarketingLayoutProps) {
  return (
    <div className="public-marketing-page min-h-screen flex flex-col bg-neutral-100 text-gray-900 [color-scheme:light]">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-1.5 w-full" style={{ backgroundColor: ACCENT }} aria-hidden />
        <div
          className={cn(
            'max-w-3xl mx-auto py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4',
            SITE_GUTTER_X
          )}
        >
          <Link href="/" className="flex items-center shrink-0 min-w-0">
            <Image
              src={LOGO_PRETO}
              alt="Plify"
              width={130}
              height={36}
              className="h-6 sm:h-8 w-[120px] sm:w-[130px] max-w-[min(100%,130px)] object-contain object-left"
              priority
            />
          </Link>
          <CheckoutHeaderAuth showDashboardLink={showDashboardLink} />
        </div>
      </header>

      <div className="flex-1 flex flex-col">{children}</div>

      <footer className={cn('mt-auto border-t border-gray-200 bg-white py-6 sm:py-10', SITE_GUTTER_X)}>
        <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6 px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6">
            <Link href="/" className="inline-flex items-center shrink-0">
              <Image
                src={LOGO_PRETO}
                alt="Plify"
                width={110}
                height={30}
                className="h-7 w-auto object-contain"
              />
            </Link>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
              <Link href="/termos-privacidade" className="hover:text-gray-900 transition-colors">
                Termos de privacidade
              </Link>
              <Link href="/termos-uso" className="hover:text-gray-900 transition-colors">
                Termos de uso
              </Link>
              <Link href="/suporte" className="hover:text-gray-900 transition-colors">
                Suporte
              </Link>
            </nav>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-2xl border-t border-gray-100 pt-6">
            Pagamentos processados pelo{' '}
            <span className="text-gray-700">Stripe</span> (PCI DSS). A Plify não armazena o número completo do
            cartão. Ao concluir o pagamento, você aceita os termos do Plify e as condições do processador de
            pagamentos.
          </p>
        </div>
      </footer>
    </div>
  )
}
