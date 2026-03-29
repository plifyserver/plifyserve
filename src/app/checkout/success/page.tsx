import { CheckoutMarketingLayout } from '@/components/CheckoutMarketingLayout'
import { CheckoutSuccessPanel } from './CheckoutSuccessPanel'

export default function CheckoutSuccessPage() {
  return (
    <CheckoutMarketingLayout showDashboardLink>
      <CheckoutSuccessPanel />
    </CheckoutMarketingLayout>
  )
}
