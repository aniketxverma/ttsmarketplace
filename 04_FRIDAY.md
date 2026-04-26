# ════════════════════════════════════════════════════════════════
# FRIDAY — TTAI SUPPLIER FLOW
# Packet 4 of 9 · Status: READY TO EXECUTE
# ════════════════════════════════════════════════════════════════

You are building the supplier dashboard and operational flow.

## MISSION
Allow users to register as suppliers, complete onboarding, upload verification documents, manage products (CRUD), and view orders for their products. New suppliers start as PENDING and cannot publish products until ACTIVE (NEXUS packet handles approval).

## DEPENDENCIES
- **JARVIS, EDITH, VERONICA complete**
- Auth and RBAC working
- Public catalog functional

## FILES TO CREATE

### Dashboard layout
- `app/(dashboard)/layout.tsx` — sidebar nav (role-aware), top bar with user menu, content area
- `components/dashboard/Sidebar.tsx` — collapsible sidebar with role-based menu items
- `components/dashboard/StatusBadge.tsx` — badge for supplier_status / order_status / etc.
- `components/dashboard/EmptyState.tsx` — reusable empty state component

### Supplier pages
- `app/(dashboard)/supplier/page.tsx` — dashboard home (status banner, stats: products count, orders count, pending docs)
- `app/(dashboard)/supplier/onboarding/page.tsx` — multi-step form: company info → address → marketplace context → submit
- `app/(dashboard)/supplier/products/page.tsx` — list own products with status, edit/delete actions
- `app/(dashboard)/supplier/products/new/page.tsx` — create product form
- `app/(dashboard)/supplier/products/[id]/edit/page.tsx` — edit product form
- `app/(dashboard)/supplier/orders/page.tsx` — list orders for own products
- `app/(dashboard)/supplier/orders/[id]/page.tsx` — order detail with fulfillment status update
- `app/(dashboard)/supplier/documents/page.tsx` — list uploaded docs, upload new
- `app/(dashboard)/supplier/settings/page.tsx` — edit profile + supplier info

### API routes
- `app/api/suppliers/route.ts` — POST create supplier (returns 409 if exists), GET own
- `app/api/suppliers/me/route.ts` — GET, PATCH own supplier (only if status IN PENDING, UNDER_REVIEW)
- `app/api/suppliers/me/documents/route.ts` — POST upload doc, GET list, DELETE
- `app/api/products/[id]/route.ts` — PATCH update, DELETE soft-delete (set is_published=false)
- `app/api/products/me/route.ts` — GET supplier's own products (regardless of published state)
- `app/api/orders/supplier/route.ts` — GET orders where supplier is current user
- `app/api/orders/[id]/fulfill/route.ts` — POST mark order as fulfilled (status: paid → fulfilled)

### Components
- `components/supplier/OnboardingForm.tsx` — multi-step wizard
- `components/supplier/ProductForm.tsx` — shared form for create + edit
- `components/supplier/DocumentUploader.tsx` — file input → Supabase Storage → insert supplier_documents row
- `components/supplier/OrderRow.tsx` — single order line for the orders list
- `components/supplier/StatusBanner.tsx` — top banner showing supplier verification status with explanation

### Validation schemas (add to lib/validation/schemas.ts)
```typescript
export const createSupplierSchema = z.object({
  legalName: z.string().min(2).max(200),
  tradeName: z.string().max(200).optional(),
  taxId: z.string().min(3).max(50),
  vatNumber: z.string().max(20).optional(),
  countryId: z.string().uuid(),
  cityId: z.string().uuid().optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  marketplaceContext: z.enum(['wholesale', 'retail', 'both']).default('wholesale'),
  description: z.string().max(2000).optional(),
})

export const createProductSchema = z.object({
  categoryId: z.string().uuid(),
  marketplaceContext: z.enum(['wholesale', 'retail', 'both']),
  cityId: z.string().uuid().optional(),
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  sku: z.string().max(100).optional(),
  priceCents: z.number().int().positive(),
  currencyCode: z.string().length(3).default('EUR'),
  minOrderQty: z.number().int().positive().default(1),
  stockQty: z.number().int().min(0).default(0),
  vatRate: z.number().min(0).max(100).optional(),
  weightGrams: z.number().int().positive().optional(),
})
```

## SPECIFICATIONS

### Onboarding flow
1. New supplier registration goes to `/supplier/onboarding` if `profiles.role` is 'buyer' OR no supplier record exists
2. Step 1 — Company info: legal_name, trade_name, tax_id, vat_number
3. Step 2 — Address: country (dropdown from countries table), city, address lines, postal code
4. Step 3 — Context: marketplace_context selector with explanation of B2B vs B2C
5. Step 4 — Description: textarea
6. Submit → POST /api/suppliers → status PENDING
7. Update profiles.role to 'supplier'
8. Redirect to `/supplier` with status banner explaining "Awaiting Verification"

### Product creation rules
- **HARD GATE:** supplier.status MUST be 'ACTIVE' to create products. API returns 403 if not.
- Product is created with `is_published=false` always; supplier toggles publish themselves after creation
- If marketplace_context='retail' or 'both', city_id is required
- Slug must be unique within supplier (enforce in API: combine supplier_id + slug check)
- vat_rate: if Spain, default to 21 unless supplier sets reduced rate per category

### Supplier product list
- Shows ALL own products regardless of is_published
- Columns: image thumbnail, name, category, price, stock, status (Published/Draft), actions
- Quick toggle: publish/unpublish per row (PATCH is_published)
- Bulk actions: Publish selected, Unpublish selected, Delete selected

### Document upload
- Use Supabase Storage bucket `supplier-documents` (private, signed URLs only)
- Allowed types: PDF, PNG, JPG up to 10MB
- doc_type values: 'tax_certificate', 'business_license', 'vat_certificate', 'bank_proof', 'other'
- After upload, insert into supplier_documents table with `file_url` = signed URL or storage path

### Status banner logic
- PENDING: yellow banner — "Verification pending. Add required documents to expedite review."
- UNDER_REVIEW: blue banner — "Your application is under review. We'll notify you within 48 hours."
- ACTIVE: green banner OR hidden — "Verified supplier. You can now publish products."
- SUSPENDED: red banner — "Your account is suspended. Contact support."

### Order management for supplier
- View only orders where order.supplier_id = current supplier's id
- Order detail shows: items, buyer info (limited — only name + city, not full address until paid), shipping address (after paid), status timeline
- Action: "Mark as Fulfilled" → POST /api/orders/[id]/fulfill — only allowed if status='paid'
- Cannot modify order content

### Sidebar nav for role='supplier'
- Dashboard (/supplier)
- Products (/supplier/products)
- Orders (/supplier/orders)
- Documents (/supplier/documents)
- Settings (/supplier/settings)

### Settings page
- Edit profile (full_name, phone, language)
- Edit supplier (only fields editable when status IN PENDING, UNDER_REVIEW)
- Show supplier_state_audit history

## ACCEPTANCE CRITERIA
- [ ] User can register, then go to /supplier/onboarding and submit
- [ ] After onboarding, supplier record exists with status=PENDING, profile.role=supplier
- [ ] Supplier sees PENDING banner and cannot create products (form returns 403)
- [ ] Once admin sets status=ACTIVE (manually for now via DB or NEXUS later), supplier can create products
- [ ] Created products start with is_published=false
- [ ] Supplier can publish/unpublish own products
- [ ] Document upload works to Supabase Storage; appears in documents list
- [ ] Orders list shows only own supplier orders
- [ ] Mark as Fulfilled transitions order from paid → fulfilled
- [ ] Settings page shows audit history
- [ ] All forms use Zod validation with inline error display
- [ ] Sidebar nav shows correct items for supplier role

## HAND-OFF TO NEXT PACKET (NEXUS)
- Suppliers in PENDING/UNDER_REVIEW state ready for admin verification
- Document uploads ready for admin review
- Product creation gated on ACTIVE status

## EXECUTION COMMAND
Build all files. Test full supplier onboarding → manually flip a supplier to ACTIVE in DB → verify product creation works → verify products appear in public catalog (VERONICA). Report PASS/FAIL on each criterion.
