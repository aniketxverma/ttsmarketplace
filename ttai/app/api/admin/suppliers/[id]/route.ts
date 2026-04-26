import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await requireRole('admin')
  const supabase = createClient()

  const [supplierRes, docsRes, auditsRes] = await Promise.all([
    supabase.from('suppliers').select('*, countries(iso_code, name), cities(name)').eq('id', params.id).single(),
    supabase.from('supplier_documents').select('*').eq('supplier_id', params.id).order('uploaded_at', { ascending: false }),
    supabase.from('supplier_state_audit').select('*, profiles(full_name)').eq('supplier_id', params.id).order('created_at', { ascending: false }),
  ])

  if (!supplierRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    supplier: supplierRes.data,
    documents: docsRes.data ?? [],
    audits: auditsRes.data ?? [],
  })
}
