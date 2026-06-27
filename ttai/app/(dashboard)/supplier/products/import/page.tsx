import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { requireAuth } from '@/lib/auth/rbac'
import { redirect } from 'next/navigation'
import { ImportWizard } from './ImportWizard'

export default async function ImportProductsPage() {
  
  const tt = await localizeUI(["Import products from Excel", "drafts", "for you to review and publish.", "Download template", "Recommended columns:"], getLocale())
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase.from('suppliers').select('id, status').eq('owner_id', user.id).single()
  if (!supplier) redirect('/supplier/onboarding')

  const { data: categories } = await supabase
    .from('categories').select('id, name, parent_id').order('sort_order')

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{tt("Import products from Excel")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5 max-w-2xl">
            Upload a supplier price list (.xlsx). We auto-detect the columns and pull in the embedded
            product photos. Everything imports as <strong>{tt("drafts")}</strong> {tt("for you to review and publish.")}
          </p>
        </div>
        <a href="/templates/product-import-template.xlsx" download
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0B1F4D] hover:border-[#0B1F4D] transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M4 6a2 2 0 012-2h8l6 6v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          </svg>
          {tt("Download template")}
        </a>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-800">
        <span className="font-bold">{tt("Recommended columns:")}</span> Product Name* · Product Photo · Package Photo · Color ·
        Barcode (EAN) · MOQ (PC) · EXW Price (USD) · EXW Price (RMB) · QTY/CTN · Carton Size (cm) · Weight/PC (g) · Product Description.
        Headers can vary — we match them automatically. <span className="font-semibold">Paste each product&apos;s photo into its Photo cell.</span>
      </div>
      <ImportWizard categories={(categories ?? []) as { id: string; name: string; parent_id: string | null }[]} />
    </div>
  )
}
