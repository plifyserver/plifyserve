import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

const ACCEPTED = ['application/pdf']
const MAX_MB = 10

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  }
  if (!ACCEPTED.includes(file.type)) {
    return NextResponse.json({ error: 'Apenas PDF é permitido' }, { status: 400 })
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Tamanho máximo: ${MAX_MB} MB` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
  const safeName = `${Date.now()}.${ext}`
  const path = `${userId}/${safeName}`

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('signature-docs')
    .upload(path, file, { upsert: true })

  if (error) {
    const message =
      error.message === 'Bucket not found'
        ? 'Bucket "signature-docs" não existe. Execute o schema.sql no Supabase.'
        : error.message
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('signature-docs').getPublicUrl(data.path)
  return NextResponse.json({ url: urlData.publicUrl, path: data.path })
}
