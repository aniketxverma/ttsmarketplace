import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types/domain'

export async function GET() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const roots = data.filter((c) => c.parent_id === null) as Category[]
  const childMap: Record<string, Category[]> = {}

  data.forEach((c) => {
    if (c.parent_id) {
      if (!childMap[c.parent_id]) childMap[c.parent_id] = []
      childMap[c.parent_id].push(c as Category)
    }
  })

  const tree = roots.map((r) => ({ ...r, children: childMap[r.id] ?? [] }))

  return NextResponse.json({ categories: tree })
}
