'use client'

import { useBilling } from '@/hooks/useBilling'
import { PlanosMarketingContent } from '@/components/dashboard/PlanosMarketingContent'
import { SITE_CONTAINER_LG } from '@/lib/siteLayout'

export default function PlanosPage() {
  const { isLoading } = useBilling()

  if (isLoading) {
    return (
      <div className={SITE_CONTAINER_LG}>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400" />
        </div>
      </div>
    )
  }

  return (
    <div className={SITE_CONTAINER_LG}>
      <PlanosMarketingContent embedded={false} />
    </div>
  )
}
