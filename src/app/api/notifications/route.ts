import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

/** DELETE: excluir todas as notificações do usuário */
export async function DELETE() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
