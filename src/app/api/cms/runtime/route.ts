import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const svc = createServiceRoleClient()
  const { data, error } = await svc
    .from('cms_runtime_settings')
    .select('active_version, updated_at')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const activeVersion = data?.active_version === 'v2' ? 'v2' : 'v1'
  return NextResponse.json({
    activeVersion,
    updatedAt: data?.updated_at ?? null,
  })
}

