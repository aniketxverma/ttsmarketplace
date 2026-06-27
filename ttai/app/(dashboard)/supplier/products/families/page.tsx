import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { FamilyOrganizer } from '@/components/supplier/FamilyOrganizer'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OrganizeFamiliesPage() {
  
  const tt = await localizeUI(["Products", "Organize families", "Your account is suspended — product management is disabled.", "No products yet."], getLocale())
  const user = await requireAuth()
  const supabase = createClient()
  const { data: supplier } = await supabase
    .from('suppliers').select('id, status').eq('owner_id', user.id).single()
  if (!supplier) redirect('/supplier/onboarding')

  const { data: products } = await (supabase.from('products') as any)
    .select('id, name, brand_name, product_line, categories(name), product_images(url, sort_order)')
    .eq('supplier_id', supplier.id)
    .order('brand_name', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true }) as { data: any[] | null }

  const items = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name as string,
    brand: (p.brand_name as string) ?? null,
    line: (p.product_line as string) ?? null,
    category: (p.categories as any)?.name ?? null,
    thumb: ((p.product_images ?? []) as any[]).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
  }))

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link href="/supplier/products" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#0B1F4D] transition-colors mb-2">
          <ChevronLeft className="w-4 h-4" /> {tt("Products")}
        </Link>
        <h1 className="text-2xl font-extrabold text-[#0B1F4D]">{tt("Organize families")}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Group products into families (e.g. iPhone · Samsung · Xiaomi). Products sharing a family show as one card in the marketplace — buyers open it to pick a variant.
        </p>
      </div>

      {supplier.status === 'SUSPENDED' ? (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800 font-medium">
          {tt("Your account is suspended — product management is disabled.")}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-500">{tt("No products yet.")}</div>
      ) : (
        <FamilyOrganizer items={items} />
      )}
    </div>
  )
}
