// Sales-network lineage: which brand invited a supplier into its official network.
// Used to badge member shops as "Powered by <mother brand>" (e.g. a Chtaura
// distributor → "Powered by Chtaura"). See the Distribution Network program.

export type MotherBrand = { name: string; slug: string | null }

/**
 * For each member supplier id, the brand (inviter) whose official sales network
 * they belong to. Two-step query (no FK embed) + try/catch so a public page never
 * breaks if the table/columns aren't present.
 */
export async function getMotherBrands(supabase: any, memberIds: string[]): Promise<Map<string, MotherBrand>> {
  const out = new Map<string, MotherBrand>()
  const ids = Array.from(new Set(memberIds.filter(Boolean)))
  if (!ids.length) return out
  try {
    const { data: links } = await (supabase.from('sales_network') as any)
      .select('member_supplier_id, inviter_supplier_id')
      .in('member_supplier_id', ids)
      .eq('status', 'accepted')
    const rows = (links ?? []) as any[]
    if (!rows.length) return out
    const inviterIds = Array.from(new Set(rows.map((r) => r.inviter_supplier_id).filter(Boolean)))
    const { data: inviters } = await (supabase.from('suppliers') as any)
      .select('id, trade_name, legal_name, brand_slug')
      .in('id', inviterIds.length ? inviterIds : ['00000000-0000-0000-0000-000000000000'])
    const byId = new Map<string, any>(((inviters ?? []) as any[]).map((s) => [s.id, s]))
    for (const r of rows) {
      const inv = byId.get(r.inviter_supplier_id)
      if (r.member_supplier_id && inv) {
        out.set(r.member_supplier_id, { name: inv.trade_name ?? inv.legal_name ?? 'Brand', slug: inv.brand_slug ?? null })
      }
    }
  } catch { /* sales_network not migrated — no badges, page still renders */ }
  return out
}
