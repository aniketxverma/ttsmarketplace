import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { AddCategoryForm } from './AddCategoryForm'
import { DeleteCategory } from './DeleteCategory'

export default async function AdminCategoriesPage() {
  await requireRole('admin')
  const supabase = createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, depth, marketplace_context, sort_order, parent_id')
    .order('depth', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  // Group: root first, then children
  const roots = categories?.filter((c) => !c.parent_id) ?? []
  const childrenByParent: Record<string, typeof roots> = {}
  categories?.filter((c) => c.parent_id).forEach((c) => {
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
                    <td className="px-4 py-3 text-right">
                      <DeleteCategory categoryId={child.id} hasChildren={false} />
                    </td>
                  </tr>
                ))}
              </>
            ))}
            {!roots.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No categories yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
