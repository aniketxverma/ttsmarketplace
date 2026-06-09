import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
import { linkDuplicateProducts } from '@/lib/master'

export const maxDuration = 120

export async function POST() {
  await requireRole('admin')
  try {
    const stats = await linkDuplicateProducts(createAdminClient())
    return NextResponse.json({ ok: true, ...stats })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Linker failed' }, { status: 500 })
  }
}
