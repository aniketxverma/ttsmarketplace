# TTAIEMA — Supplier Profile System Specification
> AI-ready implementation spec. Every section is self-contained and buildable independently.

---

## Overview

The Supplier Profile is a **multi-layered business hub** inside TTAIEMA. It is not a standard user account. It functions as a mini business website, wholesale storefront, and POS network — all connected under one supplier identity.

**Core principle:** Every supplier gets a structured, public-facing profile the moment they register. Features unlock progressively as they fill in more data.

---

## 1. Data Architecture

### 1.1 Supplier Entity (Top-Level Record)

```
SupplierProfile {
  id:                  UUID (primary key)
  slug:                string (unique, URL-safe, e.g. "rosil-spain")
  status:              enum [ draft | active | suspended | pending_review ]
  verified:            boolean
  created_at:          timestamp
  updated_at:          timestamp
  owner_user_id:       UUID → User
  plan:                enum [ free | starter | professional | enterprise ]
}
```

### 1.2 Company Information

```
CompanyInfo {
  supplier_id:         UUID → SupplierProfile
  company_name:        string (required)
  legal_name:          string
  logo_url:            string (CDN path)
  cover_image_url:     string
  tagline:             string (max 120 chars)
  description:         text (max 2000 chars, rich text supported)
  founded_year:        integer
  employee_count:      enum [ 1-10 | 11-50 | 51-200 | 201-500 | 500+ ]
  country:             string (ISO 3166-1 alpha-2)
  headquarters_city:   string
  languages_spoken:    string[] (ISO 639-1 codes)
  business_type:       enum [ manufacturer | distributor | wholesaler | retailer | importer | exporter | agent ]
}
```

### 1.3 Contact Details

```
ContactDetails {
  supplier_id:         UUID → SupplierProfile
  email_primary:       string
  email_secondary:     string
  phone_primary:       string (E.164 format)
  phone_secondary:     string
  whatsapp:            string (E.164 format)
  website_url:         string
  linkedin_url:        string
  instagram_url:       string
  facebook_url:        string
  contact_person_name: string
  contact_person_role: string
}
```

### 1.4 Business Categories & Certifications

```
BusinessCategory {
  supplier_id:         UUID → SupplierProfile
  category_id:         UUID → GlobalCategory (TTAIEMA taxonomy)
  is_primary:          boolean
  custom_label:        string (optional override)
}

Certification {
  supplier_id:         UUID → SupplierProfile
  name:                string (e.g. "ISO 9001", "CE", "FDA")
  issuing_body:        string
  certificate_url:     string (PDF or image)
  issue_date:          date
  expiry_date:         date
  verified:            boolean (reviewed by TTAIEMA admin)
}
```

---

## 2. Product Presentation Layer

### 2.1 Product Catalogue

```
Product {
  id:                  UUID
  supplier_id:         UUID → SupplierProfile
  name:                string (required)
  slug:                string (unique within supplier)
  sku:                 string
  description:         text (rich text)
  short_description:   string (max 300 chars)
  brand:               string
  category_id:         UUID → GlobalCategory
  tags:                string[]
  status:              enum [ draft | active | archived ]
  created_at:          timestamp
  updated_at:          timestamp
}
```

### 2.2 Product Media

```
ProductMedia {
  id:                  UUID
  product_id:          UUID → Product
  type:                enum [ image | video | pdf_catalogue | 3d_model ]
  url:                 string (CDN path)
  thumbnail_url:       string
  title:               string
  sort_order:          integer
  is_primary:          boolean
  file_size_kb:        integer
}
```

### 2.3 Wholesale Pricing & Stock

```
ProductPricing {
  id:                  UUID
  product_id:          UUID → Product
  currency:            string (ISO 4217)
  price_type:          enum [ wholesale | retail | negotiable | on_request ]
  unit_price:          decimal
  unit:                string (e.g. "per piece", "per kg", "per box")
  moq:                 integer (minimum order quantity)
  moq_unit:            string
  price_tiers: [
    { min_qty: integer, max_qty: integer, unit_price: decimal }
  ]
  stock_status:        enum [ in_stock | low_stock | out_of_stock | pre_order ]
  stock_qty:           integer (optional, can be hidden)
  lead_time_days:      integer
}
```

---

## 3. Points of Sale (POS) System

### 3.1 POS Record

Each supplier can have **unlimited** points of sale. Each POS behaves as a mini-profile linked to the main account.

```
PointOfSale {
  id:                  UUID
  supplier_id:         UUID → SupplierProfile
  name:                string (required, e.g. "Madrid Showroom")
  type:                enum [
                         shop |
                         warehouse |
                         distributor |
                         pickup_point |
                         franchise |
                         client_store |
                         agent_office |
                         export_hub
                       ]
  status:              enum [ active | temporarily_closed | closed ]
  is_public:           boolean (show on profile map or not)
  sort_order:          integer
}
```

### 3.2 POS Location

```
POSLocation {
  pos_id:              UUID → PointOfSale
  address_line1:       string
  address_line2:       string
  city:                string
  region:              string
  postal_code:         string
  country:             string (ISO 3166-1 alpha-2)
  latitude:            decimal
  longitude:           decimal
  plus_code:           string (Google Plus Code, for areas without street addresses)
}
```

### 3.3 POS Details

```
POSDetails {
  pos_id:              UUID → PointOfSale
  manager_name:        string
  phone:               string
  whatsapp:            string
  email:               string
  opening_hours: {
    monday:    { open: "HH:MM", close: "HH:MM", closed: boolean }
    tuesday:   { ... }
    wednesday: { ... }
    thursday:  { ... }
    friday:    { ... }
    saturday:  { ... }
    sunday:    { ... }
  }
  accepts_walk_ins:    boolean
  accepts_orders:      boolean
  services_offered:    string[] (e.g. ["samples", "pickup", "returns"])
  notes:               text
  logo_url:            string
  images:              string[] (CDN paths)
}
```

---

## 4. Online Shop System

### 4.1 Shop Configuration

```
SupplierShop {
  supplier_id:         UUID → SupplierProfile
  shop_name:           string (default: company name + " Shop")
  shop_slug:           string (unique: ttaiema.com/shop/rosil)
  banner_url:          string
  accent_color:        string (hex)
  tagline:             string
  description:         text
  is_active:           boolean
  managed_by:          enum [ supplier | ttaiema_team ]
  currency_primary:    string (ISO 4217)
  currency_secondary:  string
  payment_methods:     string[]
  shop_policy:         text (returns, shipping, etc.)
}
```

### 4.2 Sales Inquiries

```
SalesInquiry {
  id:                  UUID
  supplier_id:         UUID → SupplierProfile
  product_id:          UUID → Product (optional)
  pos_id:              UUID → PointOfSale (optional)
  buyer_name:          string
  buyer_company:       string
  buyer_email:         string
  buyer_phone:         string
  buyer_country:       string
  message:             text
  quantity_requested:  integer
  unit:                string
  status:              enum [ new | read | replied | converted | closed ]
  source:              enum [ profile | shop | catalogue | pos_page | direct ]
  created_at:          timestamp
}
```

### 4.3 Order Request

```
OrderRequest {
  id:                  UUID
  supplier_id:         UUID → SupplierProfile
  buyer_user_id:       UUID → User (if registered)
  buyer_name:          string
  buyer_email:         string
  items: [
    {
      product_id:      UUID
      quantity:        integer
      unit:            string
      note:            string
    }
  ]
  delivery_address:    object (structured address)
  preferred_pos_id:    UUID → PointOfSale (optional)
  status:              enum [ pending | confirmed | processing | shipped | delivered | cancelled ]
  total_estimated:     decimal
  currency:            string
  notes:               text
  created_at:          timestamp
}
```

---

## 5. Promotion & Marketing Section

```
PromotionBanner {
  id:                  UUID
  supplier_id:         UUID → SupplierProfile
  title:               string
  subtitle:            string
  image_url:           string
  cta_label:           string (e.g. "View Catalogue")
  cta_url:             string
  valid_from:          timestamp
  valid_until:         timestamp
  is_active:           boolean
  placement:           enum [ profile_top | shop_top | category_page | homepage_featured ]
}

SupplierNews {
  id:                  UUID
  supplier_id:         UUID → SupplierProfile
  title:               string
  body:                text
  image_url:           string
  published_at:        timestamp
  type:                enum [ new_product | trade_show | announcement | promotion ]
}
```

---

## 6. Seller Dashboard — Feature Set

The supplier dashboard must expose these management sections:

```
Dashboard Sections:
├── Overview
│   ├── Profile completion score (0–100%)
│   ├── Profile views (7d / 30d)
│   ├── Inquiry count
│   └── Quick actions
│
├── Profile Editor
│   ├── Company info
│   ├── Contact details
│   ├── Certifications
│   └── Categories
│
├── Products
│   ├── Product list (filterable)
│   ├── Add / edit product
│   ├── Upload catalogue (PDF)
│   ├── Manage media
│   └── Pricing & stock
│
├── Points of Sale
│   ├── POS list (map view + list view)
│   ├── Add / edit POS
│   ├── Opening hours editor
│   └── POS performance (views, inquiries)
│
├── Shop
│   ├── Shop settings
│   ├── Active listings
│   ├── Promotions
│   └── Shop preview
│
├── Inquiries & Orders
│   ├── All inquiries (with status filter)
│   ├── Order requests
│   └── Response templates
│
└── Analytics (Phase 2)
    ├── Profile traffic
    ├── Product views
    ├── Inquiry conversion
    └── POS performance
```

---

## 7. UI Architecture & Screen Map

### 7.1 Public Profile Page — `/supplier/[slug]`

```
Layout: Full-width, single-column with sticky sidebar on desktop

Sections (top to bottom):
┌─────────────────────────────────────────────┐
│  COVER IMAGE (full width, 320px tall)        │
│  [Logo]  Company Name  ★ Verified badge      │
│  Tagline | Country flag | Categories        │
│  [Contact] [WhatsApp] [Website] [Enquire]   │
├─────────────────────────────────────────────┤
│  NAV TABS: Overview | Products | Shop | POS  │
├───────────────────────┬─────────────────────┤
│  MAIN CONTENT         │  SIDEBAR             │
│                       │  • Quick contact     │
│  [Active Tab Panel]   │  • Business hours    │
│                       │  • Categories        │
│                       │  • Certifications    │
│                       │  • Share / Save      │
└───────────────────────┴─────────────────────┘

Tab: Overview
  - Description
  - Key stats (products, POS count, years active)
  - Promotions / banners
  - Latest news

Tab: Products
  - Category filter bar
  - Product grid (card: image, name, brand, MOQ, price range, CTA)
  - "View Catalogue" PDF download button

Tab: Shop
  - Active listings with wholesale prices
  - Add to inquiry cart
  - Inquiry request form

Tab: Points of Sale
  - Map view (all POS pinned)
  - List view (cards per POS with type badge, address, hours, contact)
  - Filter by type (shop / warehouse / distributor / etc.)
```

### 7.2 POS Mini-Profile Page — `/supplier/[slug]/pos/[pos-id]`

```
┌──────────────────────────────────────┐
│  POS Name + Type badge               │
│  Address + Map embed                 │
│  Contact: phone, WhatsApp, email     │
│  Opening hours table                 │
│  Services offered (pills)            │
│  Gallery (if images uploaded)        │
│  Products available here (optional)  │
│  ← Back to [Supplier Name] profile   │
└──────────────────────────────────────┘
```

### 7.3 Seller Dashboard — `/dashboard/supplier/[id]`

```
Layout: Left sidebar nav + main content area

Sidebar:
  Logo + supplier name
  • Overview
  • Edit Profile
  • Products
  • Points of Sale
  • My Shop
  • Inquiries (badge with count)
  • Orders
  • Analytics
  • Settings
  • Help

Main area: context panel per section (see Section 6)
```

---

## 8. UI Design Directions

### 8.1 Overall Aesthetic
- Clean, professional B2B tone — not a consumer e-commerce look
- White/off-white backgrounds with strong typographic hierarchy
- Primary brand color: deep navy or dark teal (pick one, stay consistent)
- Accent: amber or green for CTAs and verified badges
- No decorative gradients — use whitespace and card shadows instead

### 8.2 Component Patterns

**Supplier Card (used in marketplace listings):**
- Logo top-left, cover strip behind
- Company name bold, country flag inline
- 3 category pills max (+ overflow count)
- Verified badge (checkmark + "Verified Supplier")
- Bottom row: product count | POS count | "View Profile" button

**Product Card:**
- Square image (1:1 ratio), lazy loaded
- Brand name (small, muted) above product name
- MOQ badge bottom-left of image
- Price range or "Request Price" text
- Hover: show "Add to Inquiry" overlay

**POS Card:**
- Type badge top-right (color-coded: shop=blue, warehouse=gray, distributor=amber)
- Location name bold
- City + country line
- Status pill: Open Now (green) / Closed (gray)
- Quick icons: phone, WhatsApp, directions

### 8.3 Profile Completion Bar
- Visible at top of dashboard and lightly on public profile (if under 80%)
- Steps: Company Info → Contact → First Product → First POS → Shop Activated
- Show percentage and next recommended action

### 8.4 Map Integration (POS)
- Use Leaflet.js or Google Maps embed
- Cluster pins when zoomed out (10+ POS)
- Click pin → show POS card popup with link to mini-profile
- Filter controls above map: All | Shop | Warehouse | Distributor | Other

### 8.5 Responsive Behavior
- Mobile: tabs collapse to dropdown, sidebar moves below main content
- Tablet: 2-column product grid, sidebar as bottom sheet
- Desktop: full 3-column layout with sticky sidebar

---

## 9. Future Expansion Hooks

These fields/flags should be stubbed now so future phases don't require schema migrations:

```
SupplierProfile (add these fields):
  logistics_connected:     boolean (default false) → Phase: Logistics System
  ttai_on_enrolled:        boolean (default false) → Phase: TTAI ON Services
  inventory_sync_enabled:  boolean (default false) → Phase: Inventory Tracking
  international_shipping:  boolean (default false) → Phase: Global Orders
  exchange_goods_enabled:  boolean (default false) → Phase: Exchange System
  smart_dashboard_enabled: boolean (default false) → Phase: AI Analytics
  external_shop_url:       string                  → Phase: External shop link
  erp_integration_id:      string                  → Phase: ERP sync
```

---

## 10. Build Order (Recommended Phases)

```
Phase 1 — Core Profile (Build First)
  ✓ Supplier registration + CompanyInfo
  ✓ ContactDetails
  ✓ BusinessCategories
  ✓ Certifications upload
  ✓ Public profile page (Overview tab only)
  ✓ Seller dashboard — Edit Profile section

Phase 2 — Products & Catalogue
  ✓ Product CRUD
  ✓ ProductMedia (images + PDF)
  ✓ ProductPricing (wholesale + MOQ)
  ✓ Products tab on public profile
  ✓ Dashboard — Products section

Phase 3 — Points of Sale
  ✓ POS CRUD (unlimited)
  ✓ POSLocation + map rendering
  ✓ Opening hours editor
  ✓ POS mini-profile page
  ✓ POS tab on public profile
  ✓ Dashboard — POS section

Phase 4 — Online Shop & Inquiries
  ✓ SupplierShop configuration
  ✓ SalesInquiry form + management
  ✓ OrderRequest flow
  ✓ Shop tab on public profile
  ✓ Dashboard — Inquiries + Orders sections

Phase 5 — Promotions & Analytics
  ✓ PromotionBanner system
  ✓ SupplierNews
  ✓ Profile view tracking
  ✓ Dashboard — Analytics panel

Phase 6 — Future Integrations
  → Logistics, TTAI ON, Inventory, Exchange Goods
  → Smart AI dashboard
  → International shipping module
```

---

## 11. Key Business Rules

1. **One user can own multiple supplier profiles** (for multi-brand operators)
2. **POS count is unlimited** on all plans — it's a core feature, not a paid upsell
3. **Products default to "on request" pricing** — forcing a price is optional
4. **Shop is opt-in** — the profile is always active, the shop requires activation
5. **Managed shop** (TTAIEMA handles it) is a service tier, not a platform restriction
6. **Verified badge** is granted manually by TTAIEMA admin after document review
7. **Slugs are permanent** once set (redirect if changed) to protect SEO and shared links
8. **All media** goes through TTAIEMA CDN — no external image URLs on listings
9. **Inquiries always copy** to the supplier's registered email as a backup
10. **POS can be hidden** from public (is_public: false) for internal logistics use

---

*End of specification. Each section maps directly to a database table, a UI component, or a dashboard panel. Hand this document to any developer or AI and they can build each phase independently.*
