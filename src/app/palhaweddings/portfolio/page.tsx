import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

function albunsBase(host: string | null) {
  const h = (host || '').toLowerCase()
  if (h.includes('palhaweddings')) return '/albuns'
  return '/palhaweddings/albuns'
}

/** Links antigos `/portfolio` → `/albuns` */
export default async function PortfolioRedirectPage() {
  const host = (await headers()).get('host')
  redirect(albunsBase(host))
}
