# ════════════════════════════════════════════════════════════════
# VERONICA — TTAI PUBLIC CATALOG
# Packet 3 of 9 · Status: READY TO EXECUTE
# ════════════════════════════════════════════════════════════════

You are building the public-facing catalog of the TTAI marketplace. Read-only — no checkout in this packet.

## MISSION
Build the landing page, B2B wholesale marketplace browse, B2C city store browse, product detail pages, and supplier profile pages. Buyers can browse but cannot yet purchase.

## DEPENDENCIES
- **JARVIS complete** (database, types)
- **EDITH complete** (Header, Footer, auth context for conditional CTAs)

## FILES TO CREATE

### Public pages
- `app/(public)/layout.tsx` — wraps Header + Footer around public routes
- `app/(public)/page.tsx` — landing page with hero, four pillars (Marketplace, Logistics Hub, Instant Transport, Trade Finance), CTA
- `app/(public)/marketplace/page.tsx` — wholesale browse with category sidebar, search, pagination
- `app/(public)/marketplace/[productId]/page.tsx` — product detail (wholesale view)
- `app/(public)/store/page.tsx` — city picker landing for B2C
- `app/(public)/store/[citySlug]/page.tsx` — city-specific retail browse
- `app/(public)/store/[citySlug]/[productId]/page.tsx` — product detail (retail view)
- `app/(public)/suppliers/[supplierId]/page.tsx` — public supplier profile with their products
- `app/(public)/brokers/[brokerId]/page.tsx` — public broker profile (shows their promotions)

### Components
- `components/marketplace/ProductCard.tsx` — single product card (image, name, price, supplier, MOQ, reliability badge)
- `components/marketplace/ProductGrid.tsx` — responsive grid wrapper
- `components/marketplace/CategoryNav.tsx` — sidebar with category tree
- `components/marketplace/FilterSidebar.tsx` — filters (price range, country, reliability tier)
- `components/marketplace/SupplierBadge.tsx` — small badge showing reliability tier with tooltip
- `components/marketplace/PromotionBanner.tsx` — broker promotion display on marketplace
- `components/marketplace/CityPicker.tsx` — city selector for retail
- `components/marketplace/SearchBar.tsx` — search input with submit
- `components/marketplace/Pagination.tsx` — page navigation

### API routes
- `app/api/products/route.ts` — GET list with query params: `context`, `city`, `category`, `q`, `page`, `minPrice`, `maxPrice`, `country`
- `app/api/products/[id]/route.ts` — GET single product with full supplier + images + category
- `app/api/categories/route.ts` — GET full category tree
- `app/api/cities/route.ts` — GET cities with `retail_active=true`
- `app/api/suppliers/[id]/public/route.ts` — GET supplier public profile + their published products

## SPECIFICATIONS

### Landing page (`app/(public)/page.tsx`)
- Hero: "Global Trade Ecosystem" headline, subhead about B2B + B2C, primary CTA "Browse Wholesale" → `/marketplace`, secondary CTA "Join as Supplier" → `/register`
- Four-pillar grid: Marketplace, Logistics Hub, Instant Transport, Trade Finance — with brief description each
- Final CTA section

### Marketplace browse (`app/(public)/marketplace/page.tsx`)
- Server component, reads searchParams: `category`, `q`, `page`, `country`
- Sidebar: CategoryNav with all root categories where context IN ('wholesale','both')
- Grid: ProductCards filtered to `is_published=true` AND `supplier.status='ACTIVE'` AND `marketplace_context IN ('wholesale','both')`
- Pagination: 24 per page
- Search: simple ILIKE on product name
- Above grid: PromotionBanner showing 3 most recent active broker promotions

### Store (`app/(public)/store/[citySlug]/page.tsx`)
- City must exist and have `retail_active=true` — else 404
- Same grid pattern but filter `city_id=<resolved>` AND `marketplace_context IN ('retail','both')`
- Header shows "Shopping in {city.name}" with link to switch cities

### Product detail (`app/(public)/marketplace/[productId]/page.tsx`)
- Image gallery (sorted by `sort_order`)
- Product info: name, description, price (with VAT note for retail context), MOQ, stock indicator
- Supplier card: legal_name/trade_name, reliability_tier, country, link to supplier profile
- Category breadcrumb
- "Add to Cart" button — currently shows toast "Coming soon" (real cart in ATLAS packet)
- Show any active broker promotions for this product

### Supplier profile (`app/(public)/suppliers/[supplierId]/page.tsx`)
- Only show if `supplier.status='ACTIVE'`
- Display: legal_name, trade_name, description, country/city, reliability tier with explanation, logo
- Grid of all published products from this supplier

### ProductCard component (mandatory props)
```typescript
interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price_cents: number
    currency_code: string
    min_order_qty: number
    marketplace_context: MarketplaceContext
  }
  supplier: {
    legal_name: string
    trade_name: string | null
    reliability_tier: ReliabilityTier
  }
  mainImageUrl?: string
  href: string  // '/marketplace/{id}' or '/store/{citySlug}/{id}'
}
```

### Reliability tier badge styling
- UNVERIFIED: gray
- BRONZE: amber
- SILVER: slate
- GOLD: yellow with subtle glow

### Pricing display
- Wholesale context: show price ex-VAT with "ex. VAT" note + "MOQ: {n}" badge
- Retail context: show price inc-VAT (computed: price_cents + (price_cents * vat_rate / 100))

### API: GET /api/products
Query params and response shape:
```typescript
// ?context=wholesale&category=textiles-apparel&q=cotton&page=2&country=ES
{
  products: Product[],
  pagination: { page, pageSize: 24, total, totalPages }
}
```
- Filter products by `is_published=true` AND join suppliers WHERE status='ACTIVE'
- Order by created_at DESC
- Include nested: `suppliers(legal_name, trade_name, logo_url, reliability_tier)`, `categories(name, slug)`, `product_images(url, sort_order)`

### API: GET /api/categories
Returns tree structure:
```typescript
[
  { id, name, slug, marketplace_context, children: [...] }
]
```

## ACCEPTANCE CRITERIA
- [ ] Landing page renders with hero + four pillars + CTAs
- [ ] `/marketplace` shows products grid with working category filter, search, pagination
- [ ] Only ACTIVE supplier products are visible
- [ ] Only is_published=true products are visible
- [ ] `/store/madrid` works for active retail cities; non-retail city slugs 404
- [ ] Product detail shows full info, image gallery, supplier card
- [ ] Supplier profile shows that supplier's published products
- [ ] Reliability tier badges render with correct styling
- [ ] B2B price shows ex-VAT note; B2C shows inc-VAT computed total
- [ ] Visiting `/marketplace` while logged out works fine
- [ ] Header reflects auth state correctly
- [ ] Mobile-responsive grid (2 cols on mobile, 4 on desktop)

## HAND-OFF TO NEXT PACKET (FRIDAY)
- Public catalog fully functional
- Product/supplier data displays correctly
- Components reusable for dashboard product management

## EXECUTION COMMAND
Build all files. Test browsing without logging in. Verify all filters work. Report PASS/FAIL on each criterion.
