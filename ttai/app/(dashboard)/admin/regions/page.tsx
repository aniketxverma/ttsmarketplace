import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'

const REGION_LABELS: Record<string, string> = {
  'middle-east': 'Middle East',
  'europe':      'Europe',
  'asia':        'Asia',
  'africa':      'Africa',
  'americas':    'Americas',
}

const REGION_FLAGS: Record<string, string> = {
  'middle-east': '🌍',
  'europe':      '🇪🇺',
  'asia':        '🌏',
  'africa':      '🌍',
  'americas':    '🌎',
}

export default async function AdminRegionsPage() {
  await requireRole('admin')
  const supabase = createClient()

  const { data: rows } = await (supabase.from('supplier_regions' as any) as any)
    .select('region_key, supplier_id, suppliers(trade_name, legal_name, status)')
    .order('region_key', { ascending: true })

  // Group by region
  const byRegion: Record<string, { supplierName: string; countrySlug: string | null; status: string }[]> = {}

  for (const row of (rows ?? []) as any[]) {
    const [regionSlug, countrySlug] = (row.region_key as string).split(':')
    if (!byRegion[regionSlug]) byRegion[regionSlug] = []
    const supplier = row.suppliers as any
    byRegion[regionSlug].push({
      supplierName: supplier?.trade_name ?? supplier?.legal_name ?? 'Unknown',
      countrySlug:  countrySlug ?? null,
      status:       supplier?.status ?? '—',
    })
  }

  const allRegions = ['middle-east', 'europe', 'asia', 'africa', 'americas']
  const totalAssignments = (rows as any[])?.length ?? 0
  const totalSuppliers = new Set((rows as any[])?.map((r: any) => r.supplier_id)).size

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Regions</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {totalSuppliers} supplier{totalSuppliers !== 1 ? 's' : ''} have declared {totalAssignments} region assignment{totalAssignments !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {allRegions.map((r) => {
          const count = new Set((byRegion[r] ?? []).map((x) => x.supplierName)).size
          return (
            <div key={r} className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl mb-1">{REGION_FLAGS[r]}</p>
              <p className="font-semibold text-sm">{REGION_LABELS[r]}</p>
              <p className="text-2xl font-bold text-[#0B1F4D] mt-1">{count}</p>
              <p className="text-xs text-muted-foreground">supplier{count !== 1 ? 's' : ''}</p>
            </div>
          )
        })}
      </div>

      {/* Detail per region */}
      {allRegions.map((regionSlug) => {
        const assignments = byRegion[regionSlug] ?? []
        if (!assignments.length) return null

        // Group by supplier within this region
        const bySupplier: Record<string, string[]> = {}
        for (const a of assignments) {
          if (!bySupplier[a.supplierName]) bySupplier[a.supplierName] = []
          if (a.countrySlug) bySupplier[a.supplierName].push(a.countrySlug)
        }

        return (
          <div key={regionSlug} className="rounded-xl border overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 flex items-center gap-2">
              <span>{REGION_FLAGS[regionSlug]}</span>
              <span className="font-semibold">{REGION_LABELS[regionSlug]}</span>
              <span className="text-xs text-muted-foreground ml-auto">{Object.keys(bySupplier).length} supplier{Object.keys(bySupplier).length !== 1 ? 's' : ''}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/20">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-xs">Supplier</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(bySupplier).map(([supplierName, countries]) => (
                  <tr key={supplierName} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{supplierName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {countries.length === 0
                        ? <span className="text-xs font-semibold text-[#0B1F4D]">Entire region</span>
                        : <span className="text-xs">{countries.join(', ')}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {totalAssignments === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center text-muted-foreground">
          No suppliers have set their regions yet. They can do so from the Supplier Dashboard → Regions.
        </div>
      )}
    </div>
  )
}
