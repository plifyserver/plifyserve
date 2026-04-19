import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'
import { requireAdminSession } from '@/lib/admin/require-admin'
import { createServiceRoleClient } from '@/lib/supabase/server'

type Body = { version?: string; password?: string }

function safeEq(a: string, b: string): boolean {
  const aa = Buffer.from(a)
  const bb = Buffer.from(b)
  if (aa.length !== bb.length) return false
  return crypto.timingSafeEqual(aa, bb)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminSession()
  if (!admin.ok) return admin.response

  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const version = body.version === 'v2' ? 'v2' : body.version === 'v1' ? 'v1' : ''
  if (!version) {
    return NextResponse.json({ error: 'Versão inválida (use v1 ou v2)' }, { status: 400 })
  }

  const envPassword = process.env.CMS_SWITCH_PASSWORD || ''
  if (!envPassword) {
    return NextResponse.json(
      {
        error:
          'CMS_SWITCH_PASSWORD não configurada no servidor. Defina essa env (ex.: .env.local no dev / variáveis do host em produção) e reinicie o servidor.',
      },
      { status: 500 }
    )
  }

  const password = typeof body.password === 'string' ? body.password : ''
  if (!safeEq(password, envPassword)) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 403 })
  }

  const svc = createServiceRoleClient()
  const { error } = await svc
    .from('cms_runtime_settings')
    .update({ settings_cms_version: version })
    .eq('id', 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, settingsCmsVersion: version })
}
