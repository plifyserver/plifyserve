import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

function hasSelfieUrl(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

type SignatoryInput = { signed?: boolean; selfie_url?: string | null }

function signatoriesComplete(signatories: SignatoryInput[]): boolean {
  return (
    signatories.length > 0 &&
    signatories.every((s) => s.signed && hasSelfieUrl(s.selfie_url))
  )
}

export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('contracts').select('*').eq('id', id).eq('user_id', userId).single()
  if (error || !data) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = body.title
  if (body.file_url !== undefined) updates.file_url = body.file_url
  if (body.client_id !== undefined) updates.client_id = body.client_id
  if (body.client_name !== undefined) updates.client_name = body.client_name
  if (body.signatories !== undefined) {
    const list = body.signatories as SignatoryInput[]
    for (const s of list) {
      if (s.signed && !hasSelfieUrl(s.selfie_url)) {
        return NextResponse.json(
          { error: 'Cada assinatura deve incluir selfie. O contrato só finaliza com selfie de todos os signatários.' },
          { status: 400 }
        )
      }
    }
    updates.signatories = body.signatories
  }
  if (body.status !== undefined) {
    if (body.status === 'signed') {
      let list = (body.signatories ?? []) as SignatoryInput[]
      if (!list.length) {
        const { data: existing } = await supabase
          .from('contracts')
          .select('signatories')
          .eq('id', id)
          .eq('user_id', userId)
          .single()
        list = (existing?.signatories ?? []) as SignatoryInput[]
      }
      if (!signatoriesComplete(list)) {
        return NextResponse.json(
          { error: 'Contrato só pode ser assinado quando todos os signatários assinarem com selfie.' },
          { status: 400 }
        )
      }
    }
    updates.status = body.status
  }
  if (body.sent_at !== undefined) updates.sent_at = body.sent_at
  if (body.signed_at !== undefined) updates.signed_at = body.signed_at
  const { data, error } = await supabase.from('contracts').update(updates).eq('id', id).eq('user_id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('contracts').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
