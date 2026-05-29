import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Serve o PDF do contrato pela mesma origem (evita CORS no pdf.js no mobile). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.from('contracts').select('file_url').eq('id', id).single()

  if (error || !data?.file_url || typeof data.file_url !== 'string') {
    return NextResponse.json({ error: 'Contrato ou PDF não encontrado' }, { status: 404 })
  }

  try {
    const pdfRes = await fetch(data.file_url, { cache: 'no-store' })
    if (!pdfRes.ok) {
      return NextResponse.json({ error: 'Não foi possível obter o arquivo PDF' }, { status: 502 })
    }
    const bytes = await pdfRes.arrayBuffer()
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar PDF' }, { status: 502 })
  }
}
