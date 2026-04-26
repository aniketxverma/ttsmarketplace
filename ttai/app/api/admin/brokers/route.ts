import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'

export async function GET() {
  await requireRole('admin')
  const supabase = createClient()
  const { data, error } = await supabase.from('brokers').select('*, profiles(full_name)').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ brokers: data })
}
