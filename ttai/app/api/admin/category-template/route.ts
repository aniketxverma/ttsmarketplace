import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

type Field = { key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }

const KEY_RE = /^[a-z0-9_]+$/

export async function POST(req: NextRequest) {
  await requireRole('admin')

  const body = await req.json().catch(() => null) as
    | { categoryId?: string; fields?: Field[] }
    | null
  if (!body?.categoryId) return NextResponse.json({ error: 'Missing categoryId' }, { status: 400 })

  // Sanitise the incoming template — keep only well-formed fields.
  const seen = new Set<string>()
  const fields: Field[] = []
  for (const f of body.fields ?? []) {
    const key = String(f?.key || '').trim().toLowerCase()
    const label = String(f?.label || '').trim()
    if (!key || !label || !KEY_RE.test(key) || seen.has(key)) continue
    seen.add(key)
    const type = (['text', 'number', 'select'] as const).includes(f?.type as any) ? f.type : 'text'
    const out: Field = { key, label, type }
    if (type === 'select') {
      out.options = (f.options ?? []).map((o) => String(o).trim()).filter(Boolean).slice(0, 40)
    }
    fields.push(out)
    if (fields.length >= 40) break
  }

  const admin = createAdminClient()
  const { error } = await (admin.from('categories') as any)
    .update({ template_fields: fields })
    .eq('id', body.categoryId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, fields })
}
