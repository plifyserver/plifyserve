import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from('mind_maps')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) {
    return NextResponse.json(
      { error: error.message === 'relation "mind_maps" does not exist' ? 'Tabela mind_maps não existe.' : error.message },
      { status: 500 }
    )
  }
  return NextResponse.json({ success: true })
}
