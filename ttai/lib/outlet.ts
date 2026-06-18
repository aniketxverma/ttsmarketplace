// ─────────────────────────────────────────────────────────────────────────────
// OUTLET ZONE — shared config (conditions, selling units, participant roles,
// example categories). Single source of truth for the public zone, filters and
// any future supplier listing form.
// ─────────────────────────────────────────────────────────────────────────────

export type ConditionKey =
  | 'brand_new' | 'clearance' | 'outlet' | 'overstock'
  | 'return_a' | 'return_b' | 'return_c' | 'return_d'
  | 'refurbished' | 'cosmetic_defect' | 'functional_defect' | 'mixed'

export const CONDITIONS: { key: ConditionKey; label: string; short: string; color: string }[] = [
  { key: 'brand_new',        label: 'Brand New',                short: 'New',       color: 'bg-emerald-100 text-emerald-700' },
  { key: 'clearance',        label: 'Clearance',                short: 'Clearance', color: 'bg-blue-100 text-blue-700' },
  { key: 'outlet',           label: 'Outlet',                   short: 'Outlet',    color: 'bg-indigo-100 text-indigo-700' },
  { key: 'overstock',        label: 'Overstock',                short: 'Overstock', color: 'bg-cyan-100 text-cyan-700' },
  { key: 'return_a',         label: 'Customer Return · Grade A', short: 'Grade A',   color: 'bg-green-100 text-green-700' },
  { key: 'return_b',         label: 'Customer Return · Grade B', short: 'Grade B',   color: 'bg-lime-100 text-lime-700' },
  { key: 'return_c',         label: 'Customer Return · Grade C', short: 'Grade C',   color: 'bg-amber-100 text-amber-700' },
  { key: 'return_d',         label: 'Customer Return · Grade D', short: 'Grade D',   color: 'bg-orange-100 text-orange-700' },
  { key: 'refurbished',      label: 'Refurbished',              short: 'Refurb',    color: 'bg-violet-100 text-violet-700' },
  { key: 'cosmetic_defect',  label: 'Cosmetic Defects',         short: 'Cosmetic',  color: 'bg-yellow-100 text-yellow-700' },
  { key: 'functional_defect',label: 'Functional Defects',       short: 'Functional',color: 'bg-rose-100 text-rose-700' },
  { key: 'mixed',            label: 'Mixed Pallets',            short: 'Mixed',     color: 'bg-fuchsia-100 text-fuchsia-700' },
]

export function conditionInfo(key?: string | null) {
  return CONDITIONS.find((c) => c.key === key) ?? null
}

export type UnitKey = 'unit' | 'box' | 'mixed_box' | 'kg' | 'pallet' | 'mixed_pallet' | 'container' | 'truck'

export const SELLING_UNITS: { key: UnitKey; label: string; icon: string; per?: string }[] = [
  { key: 'unit',         label: 'Per Unit',     icon: '📦', per: '/ unit' },
  { key: 'box',          label: 'Per Box',      icon: '📦', per: '/ box' },
  { key: 'mixed_box',    label: 'Mixed Box',    icon: '🎁', per: '/ box' },
  { key: 'kg',           label: 'Per KG',       icon: '⚖️', per: '/ kg' },
  { key: 'pallet',       label: 'Per Pallet',   icon: '🟫', per: '/ pallet' },
  { key: 'mixed_pallet', label: 'Mixed Pallet', icon: '🧩', per: '/ pallet' },
  { key: 'container',    label: 'Per Container', icon: '🚢', per: '/ container' },
  { key: 'truck',        label: 'Full Truck',   icon: '🚚', per: '/ truck' },
]

export function unitInfo(key?: string | null) {
  return SELLING_UNITS.find((u) => u.key === key) ?? null
}

// ── How a supplier sells in the Outlet Zone — controls the lot CTAs. ──
export type SellModeKey = 'direct_contact' | 'request_quote' | 'buy_online' | 'b2b_only' | 'retail_b2b'

export const SELL_MODES: { key: SellModeKey; label: string; cta: string; desc: string }[] = [
  { key: 'direct_contact', label: 'Direct Contact', cta: 'Contact supplier', desc: 'Buyers contact you directly (WhatsApp / email).' },
  { key: 'request_quote',  label: 'Request a Quote', cta: 'Request a quote',  desc: 'Buyers send a quotation request.' },
  { key: 'buy_online',     label: 'Buy Online',      cta: 'Buy online',       desc: 'Buyers add to cart and check out online.' },
  { key: 'b2b_only',       label: 'B2B Only',        cta: 'Request a quote',  desc: 'Wholesale only — quote / direct deal, no online retail.' },
  { key: 'retail_b2b',     label: 'Retail + B2B',    cta: 'Buy / Quote',      desc: 'Both online retail purchase and B2B quotes.' },
]

export function sellModeInfo(key?: string | null) {
  return SELL_MODES.find((m) => m.key === key) ?? null
}
export const sellAllowsOnline = (key?: string | null) => key === 'buy_online' || key === 'retail_b2b'

// ── TTAIEMA modules a company can activate (independent registration). ──
export type ModuleKey = 'marketplace' | 'outlet' | 'logistics' | 'consulting' | 'trade_hub'
export function hasModule(modules: string[] | null | undefined, key: ModuleKey): boolean {
  // No modules set (pre-migration / legacy) → treat as enrolled everywhere.
  if (!modules || !modules.length) return true
  return modules.includes(key)
}

export const MODULE_CATALOG: { key: ModuleKey; label: string; emoji: string; desc: string; href: string }[] = [
  { key: 'outlet',      label: 'Outlet Zone',          emoji: '🏷️', desc: 'Sell clearance, returns, overstock & liquidation lots by pallet, KG, container or truck.', href: '/outlet' },
  { key: 'marketplace', label: 'TTAI Marketplace',     emoji: '🛍️', desc: 'List your full catalogue in the B2B & retail marketplace with your company website.', href: '/marketplace' },
  { key: 'trade_hub',   label: 'Trade Hub',            emoji: '🚚', desc: 'Wholesale container & truckload trading for importers, exporters and factories.', href: '/b2b' },
  { key: 'logistics',   label: 'Logistics Hub',        emoji: '📦', desc: 'Shipping, warehousing, inspection and customs — request logistics quotes.', href: '/logistics' },
  { key: 'consulting',  label: 'Business Consulting',  emoji: '💼', desc: 'Market entry, partnership & investor matching and growth strategy.', href: '/consulting' },
]

export type RoleKey = 'direct_supplier' | 'retail_chain' | 'distributor' | 'broker' | 'outlet_shop'

export const OUTLET_ROLES: { key: RoleKey; label: string; blurb: string }[] = [
  { key: 'direct_supplier', label: 'Direct Suppliers', blurb: 'Companies working directly with retail chains (Amazon, Lidl, Aldi, Carrefour, MediaMarkt…) selling returns, overstock & end-of-line.' },
  { key: 'retail_chain',    label: 'Retail Chains',    blurb: 'Retail chains selling their own clearance, seasonal and overstock directly through TTAIEMA.' },
  { key: 'distributor',     label: 'Distributors',     blurb: 'Distributors publishing new & outlet products, mixed pallets and full truckloads across categories.' },
  { key: 'broker',          label: 'Brokers',          blurb: 'Brokers connecting buyers and sellers — posting buying requests and selling opportunities.' },
  { key: 'outlet_shop',     label: 'Retail Outlet Shops', blurb: 'Outlet stores buying pallets or truckloads at competitive prices.' },
]

export function roleInfo(key?: string | null) {
  return OUTLET_ROLES.find((r) => r.key === key) ?? null
}

// Retail chains the Direct Suppliers typically work with (marketing + future tags).
export const RETAIL_CHAINS = ['Amazon', 'Lidl', 'Aldi', 'Carrefour', 'MediaMarkt', 'El Corte Inglés', 'Costco', 'Walmart']

// Example outlet categories (used for the category presentation strip + banner→category flow).
export const OUTLET_CATEGORIES = [
  'Smartphones', 'Mobile Accessories', 'TV & Multimedia', 'White Goods', 'Small Appliances',
  'DIY & Hardware', 'Gardening', 'Cleaning Products', 'Food & Beverage', 'Furniture',
  'Toys', 'Beauty & Hair', 'Sports', 'Pet Products',
]

// ── Featured Opportunity banners (homepage). Each maps to a set of conditions. ──
export const OPPORTUNITIES: { key: string; label: string; emoji: string; grad: string; conditions: ConditionKey[] }[] = [
  { key: 'brand_new',   label: 'Brand New Outlet',  emoji: '✨', grad: 'from-emerald-500 to-teal-600',  conditions: ['brand_new'] },
  { key: 'clearance',   label: 'New Clearance',     emoji: '🏷️', grad: 'from-blue-600 to-indigo-700',   conditions: ['clearance', 'outlet'] },
  { key: 'returns',     label: 'Customer Returns',  emoji: '↩️', grad: 'from-amber-500 to-orange-600',  conditions: ['return_a', 'return_b', 'return_c', 'return_d'] },
  { key: 'refurbished', label: 'Refurbished',       emoji: '🔧', grad: 'from-violet-600 to-purple-700', conditions: ['refurbished'] },
  { key: 'overstock',   label: 'Overstock',         emoji: '📦', grad: 'from-cyan-500 to-sky-600',      conditions: ['overstock'] },
  { key: 'mixed',       label: 'Mixed Pallets',     emoji: '🧩', grad: 'from-fuchsia-500 to-pink-600',  conditions: ['mixed'] },
]
export function opportunityInfo(key?: string | null) {
  return OPPORTUNITIES.find((o) => o.key === key) ?? null
}

// ── Featured Retail-chain banners. `match` is an ILIKE on outlet_source. ──
export const RETAIL_CHAIN_BANNERS: { label: string; match: string; grad: string }[] = [
  { label: 'Amazon Returns',     match: 'amazon',     grad: 'from-[#232f3e] to-[#ff9900]' },
  { label: 'Lidl Returns',       match: 'lidl',       grad: 'from-[#0050aa] to-[#ffd500]' },
  { label: 'Aldi Returns',       match: 'aldi',       grad: 'from-[#00387b] to-[#f7c600]' },
  { label: 'Carrefour Outlet',   match: 'carrefour',  grad: 'from-[#004e9f] to-[#e30613]' },
  { label: 'MediaMarkt Returns', match: 'mediamarkt', grad: 'from-[#df0000] to-[#b00000]' },
  { label: 'Costco Returns',     match: 'costco',     grad: 'from-[#005daa] to-[#e31837]' },
  { label: 'Walmart Returns',    match: 'walmart',    grad: 'from-[#0071ce] to-[#ffc220]' },
  { label: 'Tesco Returns',      match: 'tesco',      grad: 'from-[#00539f] to-[#ee1c2e]' },
  { label: 'Metro Returns',      match: 'metro',      grad: 'from-[#003d7d] to-[#ffd200]' },
  { label: 'El Corte Inglés',    match: 'corte',      grad: 'from-[#1a7a3c] to-[#0e5a2a]' },
]

// Popular outlet brands (auto-created from supplier offers; surface the known big ones).
export const OUTLET_BRANDS = [
  'Samsung', 'Apple', 'Bosch', 'LG', 'Sony', 'Philips', 'Toshiba', 'Qlima', 'Xiaomi',
  'JBL', "De'Longhi", 'Dyson', 'Braun', 'Tefal', 'Siemens', 'Whirlpool', 'Beko',
]
