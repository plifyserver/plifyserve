'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  palhaButtonStyle,
  palhaPublicPrefix,
  type PalhaButtonLook,
} from '@/lib/palha/site-settings-shared'
import { PalhaRichText } from './PalhaRichText'

export function PalhaAlbumsCta({
  label,
  look,
}: {
  label: string
  look: PalhaButtonLook
}) {
  const href = `${palhaPublicPrefix(usePathname())}/albuns`
  return (
    <Link href={href} className="palha-btn palha-hero-albums-btn" style={palhaButtonStyle(look)}>
      <PalhaRichText text={label} />
    </Link>
  )
}
