import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  // RLS garante que só o dono do quiz consegue enxergar
  const { data, error } = await supabase
    .from('quiz_responses')
    .select('id, quiz_id, submitted_at, lead_name, lead_email, lead_phone, status, handled_at, notes, updated_at, answers, utm')
    .eq('quiz_id', id)
    .order('submitted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

