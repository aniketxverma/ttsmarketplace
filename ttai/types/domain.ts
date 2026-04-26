export type UserRole = 'buyer' | 'business_client' | 'supplier' | 'broker' | 'admin'
export type MarketplaceContext = 'wholesale' | 'retail' | 'both'
export type SupplierStatus = 'PENDING' | 'UNDER_REVIEW' | 'ACTIVE' | 'SUSPENDED'
export type ReliabilityTier = 'UNVERIFIED' | 'BRONZE' | 'SILVER' | 'GOLD'
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'delivered' | 'cancelled' | 'refunded' | 'disputed'
export type InvoiceStatus = 'draft' | 'pending_conditions' | 'issued' | 'paid' | 'void'
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type VatTreatment = 'standard' | 'reverse_charge' | 'oss' | 'export'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  preferred_language: string
  country_id: string | null
  city_id: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  owner_id: string
  legal_name: string
  trade_name: string | null
  tax_id: string
  vat_number: string | null
  country_id: string
  city_id: string | null
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  status: SupplierStatus
  reliability_tier: ReliabilityTier
  marketplace_context: MarketplaceContext
  description: string | null
  logo_url: string | null
  admin_notes: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface Broker {
  id: string
  user_id: string
  legal_name: string
  tax_id: string
  vat_number: string | null
  tax_jurisdiction: string
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
  commission_pct: number
  fixed_fee_cents: number
  broker_share_pct: number
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  parent_id: string | null
  name: string
  slug: string
  marketplace_context: MarketplaceContext
  depth: number
  sort_order: number
  children?: Category[]
}

export interface Product {
  id: string
  supplier_id: string
  category_id: string
  marketplace_context: MarketplaceContext
  city_id: string | null
  name: string
  slug: string
  description: string | null
  sku: string | null
  price_cents: number
  currency_code: string
  min_order_qty: number
  stock_qty: number
  is_published: boolean
  vat_rate: number | null
  weight_grams: number | null
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  sort_order: number
}

export interface Order {
  id: string
  buyer_id: string
  supplier_id: string
  broker_id: string | null
  marketplace_context: MarketplaceContext
  status: OrderStatus
  subtotal_cents: number
  vat_cents: number
  shipping_cents: number
  total_cents: number
  currency_code: string
  buyer_country_id: string | null
  shipping_address: Record<string, unknown> | null
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  idempotency_key: string | null
  created_at: string
  updated_at: string
}

export interface Country {
  id: string
  iso_code: string
  name: string
  currency_code: string | null
  vat_rate: number | null
  is_eu: boolean
  is_active: boolean
}

export interface City {
  id: string
  country_id: string
  name: string
  slug: string
  retail_active: boolean
}
