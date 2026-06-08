import { createClient } from '@/lib/supabase/server'

/**
 * Read-only traceability panel: shows a product's full provenance chain (brand,
 * source type, original factory/supplier, current owner, who created it, and what
 * it was imported from). Degrades gracefully if the provenance columns (migration
 * 0038) aren't applied yet — it just shows fewer rows.
 */
export async function ProvenanceCard({ product }: { product: any }) {
  const supabase = createClient()

  const supIds = [product.supplier_id, product.original_supplier_id, product.original_factory_id, product.current_owner_id]
    .filter(Boolean) as string[]
  const uniq = Array.from(new Set(supIds))
  let sups: any[] = []
  if (uniq.length) {
    const { data } = await (supabase.from('suppliers') as any).select('id, trade_name, legal_name').in('id', uniq)
    sups = data ?? []
  }
  const supName = (id?: string | null) => {
    if (!id) return null
    const s = sups.find((x) => x.id === id)
    return s ? (s.trade_name ?? s.legal_name) : null
  }

  let createdBy: string | null = null
  if (product.created_by) {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', product.created_by).single()
    createdBy = (data as any)?.full_name ?? null
  }
  let importedFrom: string | null = null
  if (product.imported_from_product_id) {
    const { data } = await (supabase.from('products') as any).select('name').eq('id', product.imported_from_product_id).single()
    importedFrom = (data as any)?.name ?? null
  }

  const isImported = !!product.imported_from_product_id
  const rows: { label: string; value: any }[] = [
    { label: 'Brand', value: product.brand_name },
    { label: 'Source type', value: product.source_type },
    { label: 'Original factory', value: supName(product.original_factory_id) },
    { label: 'Original supplier', value: supName(product.original_supplier_id) },
    { label: 'Current owner', value: supName(product.current_owner_id) ?? supName(product.supplier_id) },
    { label: 'Imported from', value: importedFrom },
    { label: 'Import date', value: product.import_date ? new Date(product.import_date).toLocaleDateString('es-ES') : null },
    { label: 'Created by', value: createdBy },
  ].filter((r) => r.value)

  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b">
        <h2 className="font-bold text-[#0B1F4D] text-sm">Provenance &amp; traceability</h2>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isImported ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
          {isImported ? 'Imported / shared' : 'Original product'}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">No provenance recorded yet (run migration 0038 to enable full traceability).</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3 text-sm border-b border-gray-50 py-1.5">
              <span className="text-gray-400">{r.label}</span>
              <span className="font-semibold text-[#0B1F4D] text-right">{r.value}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-gray-400">Provenance follows the product everywhere it&apos;s shared — the basis for commissions, promotions and supplier relationships.</p>
    </div>
  )
}
