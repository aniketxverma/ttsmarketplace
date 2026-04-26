import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: supplier } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).single()
  if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

  const { data } = await supabase
    .from('supplier_documents')
    .select('*')
    .eq('supplier_id', supplier.id)
    .order('uploaded_at', { ascending: false })

  return NextResponse.json({ documents: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: supplier } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).single()
  if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

  const body = await request.json()
  const { docType, fileUrl } = body

  if (!docType || !fileUrl) return NextResponse.json({ error: 'docType and fileUrl required' }, { status: 400 })

  const { data, error } = await supabase
    .from('supplier_documents')
    .insert({ supplier_id: supplier.id, doc_type: docType, file_url: fileUrl })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ document: data }, { status: 201 })
}
