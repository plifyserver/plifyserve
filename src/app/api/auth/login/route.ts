import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message === 'Invalid login credentials' ? 'Email ou senha inválidos' : error.message },
        { status: 401 }
      )
    }

    const uid = data.user?.id
    if (uid) {
      try {
        await supabase.rpc('log_activity', {
          p_user_id: uid,
          p_action: 'login',
          p_resource_type: null,
          p_resource_id: null,
          p_metadata: {},
        })
      } catch {
        /* log opcional */
      }
    }

    return NextResponse.json({
      success: true,
      userId: uid,
    })
  } catch {
    return NextResponse.json({ error: 'Erro no login' }, { status: 500 })
  }
}
