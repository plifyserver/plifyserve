import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireAdminSession } from '@/lib/admin/require-admin'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  const admin = await requireAdminSession()
  if (!admin.ok) return admin.response

  const { searchParams } = request.nextUrl
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0)
  const rawQ = (searchParams.get('q') || '').trim()
  const q = rawQ.replace(/%/g, '').replace(/_/g, '').slice(0, 120)

  const svc = createServiceRoleClient()
  let query = svc
    .from('proposals')
    .select('id, title, user_id, status, created_at, public_slug, slug', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (q) {
    query = query.or(`title.ilike.%${q}%,client_name.ilike.%${q}%`)
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data || []
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[]
  let profileMap: Record<string, { email: string | null; full_name: string | null }> = {}

  if (userIds.length > 0) {
    const { data: profs } = await svc.from('profiles').select('id, email, full_name').in('id', userIds)
    for (const p of profs || []) {
      profileMap[p.id] = { email: p.email, full_name: p.full_name }
    }
  }

  const proposals = rows.map((r) => ({
    ...r,
    user: profileMap[r.user_id as string] || null,
  }))

  return NextResponse.json({
    proposals,
    totalCount: count ?? 0,
    pageSize: PAGE_SIZE,
  })
}
