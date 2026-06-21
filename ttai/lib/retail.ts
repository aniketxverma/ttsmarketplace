// Stores enabled for online (retail) checkout in the Shopping Mall. Browsing is
// open to everyone; only these stores can be purchased online for now — more are
// added as they're onboarded for retail fulfilment.
export const RETAIL_PURCHASE_STORES = ['rozil', 'coffee', 'bullz', 'yasra']

export function canPurchaseOnline(storeName?: string | null): boolean {
  const n = (storeName ?? '').toLowerCase()
  return RETAIL_PURCHASE_STORES.some((s) => n.includes(s))
}
