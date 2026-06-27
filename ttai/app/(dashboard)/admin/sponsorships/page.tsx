import { requireRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { SponsorshipsManager } from './SponsorshipsManager'

export default async function AdminSponsorshipsPage() {
  await requireRole('admin')

  const tt = await localizeUI(["Sponsored placements"], getLocale())
  const admin = createAdminClient()

  // Active placements (defensive — table may not be migrated)
  let placements: any[] = []
  try {
    const { data } = await (admin.from('sponsored_placements') as any)
      .select('id, weight, ends_at, is_active, products(name), categories(name)')
      .eq('kind', 'product').order('created_at', { ascending: false })
    placements = (data ?? []).map((p: any) => ({
      id: p.id, weight: p.weight, ends_at: p.ends_at, is_active: p.is_active,
      product: p.products?.name ?? '—', category: p.categories?.name ?? 'All categories',
    }))
  } catch { /* not migrated */ }

  const [{ data: products }, { data: categories }] = await Promise.all([
    admin.from('products').select('id, name').eq('is_published', true).order('created_at', { ascending: false }).limit(300),
    admin.from('categories').select('id, name').order('sort_order'),
  ])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{tt("Sponsored placements")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Promote products to the top of the marketplace (and category sections). A paid revenue lever.
        </p>
      </div>
      <SponsorshipsManager
        placements={placements}
        products={(products ?? []) as { id: string; name: string }[]}
        categories={(categories ?? []) as { id: string; name: string }[]}
      />
    </div>
  )
}
