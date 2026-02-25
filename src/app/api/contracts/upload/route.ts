import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

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
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Apenas arquivos PDF são permitidos' }, { status: 400 })
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Tamanho máximo: ${MAX_MB} MB` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('contracts')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) {
    const message =
      error.message === 'Bucket not found'
        ? 'Bucket "contracts" não existe. Crie o bucket no Supabase Storage.'
        : error.message
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('contracts').getPublicUrl(data.path)
  return NextResponse.json({ url: urlData.publicUrl })
}
