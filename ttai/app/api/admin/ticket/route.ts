import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Admin manages Control Center tickets: change status, reassign manager, add
// internal notes. Admin-only.
async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: prof } = await (supabase.from('profiles') as any).select('role, full_name').eq('id', user.id).single()
  if (prof?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { actor: prof?.full_name || 'Admin' }
}

const STATUSES = ['new', 'in_progress', 'waiting', 'closed']

// Update status / assignee
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id, status, assignedTo } = await req.json().catch(() => ({})) as
    { id?: string; status?: string; assignedTo?: string }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const patch: Record<string, string> = {}
  if (status && STATUSES.includes(status)) patch.status = status
  if (typeof assignedTo === 'string' && assignedTo.trim()) patch.assigned_to = assignedTo.trim()
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await (admin.from('tickets') as any).update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Add an internal note
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { ticketId, note } = await req.json().catch(() => ({})) as { ticketId?: string; note?: string }
  if (!ticketId || !note?.trim()) return NextResponse.json({ error: 'Missing ticketId or note' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await (admin.from('ticket_notes') as any)
    .insert({ ticket_id: ticketId, author: auth.actor, note: note.trim() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
