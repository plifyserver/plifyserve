import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('company_pages')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? {
    company_name: '',
    slogan: '',
    about_text: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    slug: userId ? `minha-empresa-${userId.slice(0, 8)}` : '',
  })
}

export async function PUT(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const companyName = body.company_name || 'minha-empresa'
  const baseSlug = slugify(companyName) || 'minha-empresa'
  const slug = `${baseSlug}-${userId.slice(0, 8)}`

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('company_pages')
    .upsert(
      {
        user_id: userId,
        slug,
        company_name: body.company_name || '',
        slogan: body.slogan || '',
        about_text: body.about_text || '',
        logo_url: body.logo_url || '',
        contact_email: body.contact_email || '',
        contact_phone: body.contact_phone || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
