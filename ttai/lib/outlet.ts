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

export type UnitKey = 'unit' | 'box' | 'pallet' | 'container' | 'truck'

export const SELLING_UNITS: { key: UnitKey; label: string; icon: string }[] = [
  { key: 'unit',      label: 'Unit',       icon: '📦' },
  { key: 'box',       label: 'Box',        icon: '📦' },
  { key: 'pallet',    label: 'Pallet',     icon: '🟫' },
  { key: 'container', label: 'Container',  icon: '🚢' },
  { key: 'truck',     label: 'Full Truck', icon: '🚚' },
]

export function unitInfo(key?: string | null) {
  return SELLING_UNITS.find((u) => u.key === key) ?? null
}

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

// Example outlet categories (used for the category presentation strip).
export const OUTLET_CATEGORIES = [
  'Electronics', 'Home Appliances', 'Mobile Phones', 'TV & Multimedia', 'Food & Beverage',
  'Cleaning Products', 'Furniture', 'Clothing', 'Toys', 'Tools', 'Mixed Loads',
]
