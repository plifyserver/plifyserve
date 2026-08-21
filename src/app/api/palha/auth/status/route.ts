import { NextResponse, type NextRequest } from 'next/server'
import { isLocalDevHost, isPalhaWeddingsHost } from '@/lib/hosts'
import { createPalhaServiceClient } from '@/lib/palha/supabase/server'

function palhaApiAllowed(request: NextRequest) {
  return isPalhaWeddingsHost(request) || isLocalDevHost(request)
}

export async function GET(request: NextRequest) {
  if (!palhaApiAllowed(request)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const supabase = createPalhaServiceClient()
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ canCreateFirst: (data.users?.length ?? 0) === 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha ao verificar acesso'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
