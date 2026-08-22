import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

function albunsBase(host: string | null) {
  const h = (host || '').toLowerCase()
  if (h.includes('palhaweddings')) return '/albuns'
  return '/palhaweddings/albuns'
}

/** Links antigos `/portfolio/[id]` → `/albuns/[id]` */
export default async function PortfolioAlbumRedirectPage({ params }: Props) {
  const { id } = await params
  const host = (await headers()).get('host')
  redirect(`${albunsBase(host)}/${id}`)
}
