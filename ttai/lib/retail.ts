// Suppliers with an ACTIVE Online Shop. ONLY these appear in the Shopping Mall
// and Today's Deals, and can be purchased online (add-to-cart + pay). Everyone
// else is B2B-only and stays inside the B2B Marketplace. Add a supplier's
// name/slug here when they activate their Online Shop.
//
// For now there are 3 online shops:
//   • rozil   — Rozil online shop
//   • yasra   — Yasra (sells to end users; has a shop)
//   • ttaiema — TTAI EMA's own shop, selling Café, Rozil products & Bullz under
//               its name (set up pending; products move here from those brands).
export const RETAIL_PURCHASE_STORES = ['rozil', 'yasra', 'ttaiema']

export function canPurchaseOnline(storeName?: string | null): boolean {
  const n = (storeName ?? '').toLowerCase()
  return RETAIL_PURCHASE_STORES.some((s) => n.includes(s))
}
