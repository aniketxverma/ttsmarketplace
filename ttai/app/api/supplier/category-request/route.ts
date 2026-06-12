import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'
import { sendEmailFireAndForget } from '@/lib/email/send'

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || process.env.EMAIL_FROM || 'info@ttaiema.com'

/**
 * A supplier requests a NEW main category. Created as `pending` (admin-only RLS,
 * so via the admin client after verifying the caller owns a shop). The admin
 * approves/edits/merges/rejects it in /admin/categories. Returns the id so the
 * product can be attached to it immediately (hidden publicly until approved).
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sup } = await supabase.from('suppliers').select('id, legal_name, trade_name').eq('owner_id', user.id).maybeSingle()
  if (!sup) return NextResponse.json({ error: 'No supplier profile' }, { status: 403 })

  const { name, parentId } = (await req.json().catch(() => ({}))) as { name?: string; parentId?: string }
  if (!name?.trim()) return NextResponse.json({ error: 'Category name is required' }, { status: 400 })

  const admin = createAdminClient()
  const slug = slugify(name).slice(0, 80) || 'category'

  // Avoid duplicates — reuse any existing category (active or pending) with this slug+parent.
  const { data: existing } = await (admin.from('categories') as any)
    .select('id, name, status')
    .eq('slug', slug)
    .is('parent_id', parentId ?? null)
    .maybeSingle()
  if (existing) return NextResponse.json({ category: existing, duplicate: true })

  const { data: created, error } = await (admin.from('categories') as any)
    .insert({
      name: name.trim(), slug, parent_id: parentId ?? null,
      status: 'pending', requested_by: (sup as any).id,
      depth: parentId ? 1 : 0, marketplace_context: 'both',
    })
    .select('id, name, status').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Notify admin.
  const supplierName = (sup as any).trade_name ?? (sup as any).legal_name ?? 'A supplier'
  sendEmailFireAndForget({
    to: ADMIN_EMAIL,
    subject: `New category request: "${name.trim()}" — ${supplierName}`,
    react: React.createElement('div', { style: { fontFamily: 'Arial, sans-serif', color: '#0B1F4D' } },
      React.createElement('h2', null, 'New category request'),
      React.createElement('p', null, `${supplierName} requested a new category: `, React.createElement('b', null, name.trim())),
      React.createElement('p', null, 'Review it in Admin → Categories (approve, rename, merge or reject).'),
    ) as any,
  })

  return NextResponse.json({ category: created }, { status: 201 })
}
