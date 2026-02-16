import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_MB = 5

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const type = (formData.get('type') as string) || 'gallery' // 'gallery' | 'product'
  const proposalId = (formData.get('proposalId') as string) || ''

  if (!file) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  }
  if (!ACCEPTED.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Tamanho máximo: ${MAX_MB} MB` }, { status: 400 })
  }

  const folder = proposalId ? `proposal_${proposalId}` : 'draft'
  const ext = file.name.split('.').pop() || 'jpg'
  const name = type === 'product' ? `product.${ext}` : `gallery_${Date.now()}.${ext}`
  const path = `${userId}/${folder}/${type}/${name}`

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('proposal-assets')
    .upload(path, file, { upsert: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('proposal-assets').getPublicUrl(data.path)
  return NextResponse.json({ url: urlData.publicUrl })
}
