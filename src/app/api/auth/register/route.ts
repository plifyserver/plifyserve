import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: full_name || '' },
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    const uid = data.user?.id
    if (uid) {
      try {
        await supabase.rpc('log_activity', {
          p_user_id: uid,
          p_action: 'register',
          p_resource_type: null,
          p_resource_id: null,
          p_metadata: { email: data.user?.email ?? null },
        })
      } catch {
        /* log opcional */
      }
    }

    return NextResponse.json({
      success: true,
      userId: uid,
      message: 'Conta criada! Faça login para continuar.',
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
