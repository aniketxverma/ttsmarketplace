import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { AddCategoryForm } from './AddCategoryForm'
import { DeleteCategory } from './DeleteCategory'
import { CategoryTemplateEditor } from './CategoryTemplateEditor'
import { CategoryPriority } from './CategoryPriority'
import { PendingCategories } from './PendingCategories'

type Cat = {
  id: string
  name: string
  slug: string
  depth: number
  marketplace_context: string
  sort_order: number
  parent_id: string | null
  status?: string
  requested_by?: string | null
  template_fields?: { key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }[]
}

export default async function AdminCategoriesPage() {
  await requireRole('admin')
  const supabase = createClient()

  // Select status/requested_by defensively (columns from migration 0057).
  let categories: Cat[] | null = null
  {
    const full = await (supabase.from('categories') as any)
      .select('id, name, slug, depth, marketplace_context, sort_order, parent_id, status, requested_by, template_fields, priority')
      .order('depth', { ascending: true }).order('sort_order', { ascending: true }).order('name', { ascending: true })
    if (!full.error) categories = full.data
    else {
      const basic = await (supabase.from('categories') as any)
        .select('id, name, slug, depth, marketplace_context, sort_order, parent_id, template_fields')
        .order('depth', { ascending: true }).order('sort_order', { ascending: true }).order('name', { ascending: true })
      categories = basic.data
    }
  }

  // Pending requests (supplier-created) — resolve who requested them.
  const pendingRaw = (categories ?? []).filter((c) => c.status === 'pending')
  const reqSupIds = Array.from(new Set(pendingRaw.map((c) => c.requested_by).filter(Boolean))) as string[]
  const supNames = new Map<string, string>()
  if (reqSupIds.length) {
    const { data: sups } = await (supabase.from('suppliers') as any).select('id, legal_name, trade_name').in('id', reqSupIds)
    for (const s of (sups ?? []) as any[]) supNames.set(s.id, s.trade_name ?? s.legal_name ?? 'Supplier')
  }
  const pending = pendingRaw.map((c) => ({ id: c.id, name: c.name, requested_by_name: c.requested_by ? supNames.get(c.requested_by) ?? null : null }))

  // The live tree shows active categories only (pending appear in the section above).
  const liveCats = (categories ?? []).filter((c) => (c.status ?? 'active') === 'active')

  // Group: root first, then children
  const roots = liveCats.filter((c) => !c.parent_id) ?? []
  const childrenByParent: Record<string, Cat[]> = {}
  liveCats.filter((c) => c.parent_id).forEach((c) => {
    if (!childrenByParent[c.parent_id!]) childrenByParent[c.parent_id!] = []
    childrenByParent[c.parent_id!].push(c)
  })

  const CONTEXT_COLORS: Record<string, string> = {
    both:      'bg-blue-100 text-blue-700',
    wholesale: 'bg-purple-100 text-purple-700',
    retail:    'bg-green-100 text-green-700',
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{categories?.length ?? 0} categories total</p>
        </div>
      </div>

      {/* Supplier-requested categories awaiting review */}
      <PendingCategories pending={pending} roots={roots.map((r) => ({ id: r.id, name: r.name }))} />

      {/* Add new category form */}
      <AddCategoryForm rootCategories={roots.map((r) => ({ id: r.id, name: r.name }))} />

      {/* Category tree */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Slug</th>
              <th className="text-left px-4 py-3 font-medium">Context</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Depth</th>
              <th className="text-left px-4 py-3 font-medium" title="Higher = appears first">Priority</th>
              <th className="text-left px-4 py-3 font-medium">Fields</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {roots.map((root) => (
              <>
                <tr key={root.id} className="bg-muted/20 hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold">{root.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">{root.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${CONTEXT_COLORS[root.marketplace_context] ?? ''}`}>
                      {root.marketplace_context}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">Root</td>
                  <td className="px-4 py-3"><CategoryPriority id={root.id} initial={(root as any).priority ?? 0} /></td>
                  <td className="px-4 py-3">
                    <CategoryTemplateEditor categoryId={root.id} categoryName={root.name} initialFields={(root as any).template_fields ?? []} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteCategory categoryId={root.id} hasChildren={!!(childrenByParent[root.id]?.length)} />
                  </td>
                </tr>
                {(childrenByParent[root.id] ?? []).map((child) => (
                  <tr key={child.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 pl-9 text-muted-foreground">↳ {child.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">{child.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${CONTEXT_COLORS[child.marketplace_context] ?? ''}`}>
                        {child.marketplace_context}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">Sub</td>
                    <td className="px-4 py-3"><CategoryPriority id={child.id} initial={(child as any).priority ?? 0} /></td>
                    <td className="px-4 py-3">
                      <CategoryTemplateEditor categoryId={child.id} categoryName={child.name} initialFields={(child as any).template_fields ?? []} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeleteCategory categoryId={child.id} hasChildren={false} />
                    </td>
                  </tr>
                ))}
              </>
            ))}
            {!roots.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No categories yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
