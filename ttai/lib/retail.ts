// Suppliers with an ACTIVE Online Shop. ONLY these appear in the Shopping Mall
// and Today's Deals, and can be purchased online (add-to-cart + pay). Everyone
// else is B2B-only and stays inside the B2B Marketplace. Add a supplier's
// name/slug here when they activate their Online Shop.
export const RETAIL_PURCHASE_STORES = ['rozil', 'giordano', 'bullz', 'chtaura', 'yasra']

export function canPurchaseOnline(storeName?: string | null): boolean {
  const n = (storeName ?? '').toLowerCase()
  return RETAIL_PURCHASE_STORES.some((s) => n.includes(s))
}
