import { NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 50

export async function GET(req: Request) {
  const { appUser } = await getServerAuth()
  if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (appUser.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))

  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact' })
    .eq('org_id', appUser.orgId)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE })
}
