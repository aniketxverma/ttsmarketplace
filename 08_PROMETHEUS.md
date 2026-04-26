# ════════════════════════════════════════════════════════════════
# PROMETHEUS — TTAI PROMOTIONS & INVOICING
# Packet 8 of 9 · Status: READY TO EXECUTE
# ════════════════════════════════════════════════════════════════

You are building the broker promotion engine and invoice/payout management.

## MISSION
Allow brokers to create curated product promotions visible on the marketplace. Build invoice list with PDF generation and payout history. Complete the broker monetization loop.

## DEPENDENCIES
- **JARVIS, EDITH, VERONICA, HERMES, ATLAS complete**
- Brokers with Stripe Connect onboarded
- Transaction ledger populated from real or test transactions
- Invoices issued from ATLAS

## FILES TO CREATE

### Broker promotion pages
- `app/(dashboard)/broker/promotions/page.tsx` — list own promotions with status (active/expired)
- `app/(dashboard)/broker/promotions/new/page.tsx` — create promotion (select product → set dates → custom pitch)
- `app/(dashboard)/broker/promotions/[id]/edit/page.tsx` — edit promotion

### Broker invoice + payout pages
- `app/(dashboard)/broker/invoices/page.tsx` — list invoices with filters (status, date range), download PDF action
- `app/(dashboard)/broker/invoices/[id]/page.tsx` — invoice detail
- `app/(dashboard)/broker/payouts/page.tsx` — payout history table
- `app/(dashboard)/broker/payouts/[id]/page.tsx` — payout detail

### Public promotion display
- Update `components/marketplace/PromotionBanner.tsx` (created in VERONICA) — show top 3 active promotions with broker logo + pitch
- Update `app/(public)/marketplace/page.tsx` to render PromotionBanner above product grid
- Update `app/(public)/marketplace/[productId]/page.tsx` to show "Promoted by {Broker}" badge if active promotion exists

### API routes
- `app/api/brokers/promotions/route.ts` — GET list own, POST create
- `app/api/brokers/promotions/[id]/route.ts` — GET, PATCH, DELETE
- `app/api/brokers/invoices/route.ts` — GET list own
- `app/api/brokers/invoices/[id]/route.ts` — GET single + signed PDF URL
- `app/api/brokers/invoices/[id]/pdf/route.ts` — GET regenerate PDF
- `app/api/brokers/payouts/route.ts` — GET list own
- `app/api/admin/invoices/[id]/override/route.ts` — admin override of conditions engine block
- `app/api/admin/payouts/[id]/release/route.ts` — admin manually release supplier payout (when delivery confirmed)

### PDF invoicing
- `lib/invoicing/generatePdf.ts` — generates invoice PDF using `@react-pdf/renderer` or `pdfkit`
- `lib/invoicing/templates/InvoiceTemplate.tsx` — React PDF template (or HTML→PDF if using puppeteer)
- `lib/invoicing/uploadPdf.ts` — uploads to Supabase Storage and returns signed URL

### Payout release logic
- `lib/payouts/releaseSupplier.ts` — when supplier marks order delivered, release supplier payout via Stripe Transfer
- Wire into FRIDAY's existing fulfill endpoint OR add new "Mark Delivered" action

### Components
- `components/broker/PromotionEditor.tsx` — form for create/edit promotion
- `components/broker/PromotionCard.tsx` — display card for own promotions list
- `components/broker/InvoiceList.tsx` — table of invoices
- `components/broker/InvoiceDetail.tsx` — invoice display matching PDF
- `components/broker/PayoutTable.tsx` — payouts table with filters
- `components/broker/PromotionBanner.tsx` — public-facing banner (extend VERONICA's placeholder)

### Validation schemas
```typescript
export const createPromotionSchema = z.object({
  productId: z.string().uuid(),
  promotionSlot: z.number().int().min(1).max(10),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  customPitch: z.string().max(500).optional(),
}).refine(d => new Date(d.endsAt) > new Date(d.startsAt), {
  message: 'End must be after start',
  path: ['endsAt'],
})
```

## SPECIFICATIONS

### Promotion creation rules
- Broker must have `stripe_onboarding_complete=true` to create promotions
- Product must be from a supplier in broker's `broker_supplier_assignments`
- `promotion_slot` is 1-10 (slots displayed on marketplace by sort order)
- Two promotions cannot occupy the same slot in overlapping time ranges (validate on create — check for slot conflict during requested timeframe)
- Max active promotions per broker: 5 simultaneously

### POST /api/brokers/promotions logic
```
1. requireRole(['broker'])
2. Fetch broker → verify stripe_onboarding_complete
3. Validate body
4. Verify product belongs to assigned supplier:
   SELECT 1 FROM products p
   JOIN broker_supplier_assignments bsa ON bsa.supplier_id=p.supplier_id
   WHERE p.id=productId AND bsa.broker_id=broker.id
   → 403 if not found
5. Check slot conflict: SELECT 1 FROM broker_promotions WHERE promotion_slot=X AND (starts_at, ends_at) overlaps (input range) AND is_active=true → 409 if conflict
6. Check active count: SELECT count(*) WHERE broker_id=B AND ends_at > now() AND is_active=true → 422 if >= 5
7. INSERT broker_promotions
8. Return promotion
```

### Public promotion display
- On `/marketplace`, fetch top 3 active promotions where ends_at > now() AND is_active=true ordered by promotion_slot ASC
- For each: show product image, broker logo (or trade name), custom_pitch, "View Product" CTA
- On product detail: if any active promotion for this product → show "Featured by {broker.legal_name}" badge

### PDF invoice generation
**Spanish/EU invoice requirements (legal):**
- Invoice number (sequential, unique — already in `invoices.invoice_number`)
- Issue date
- Seller info: TTAI legal name, NIF, address (your TTAI Spain entity)
- Buyer info: name, country, VAT number (if reverse charge)
- Line items: description, quantity, unit price ex-VAT, line total ex-VAT
- VAT breakdown: rate, taxable base, VAT amount
- Total amount due
- VAT treatment notice:
  - 'standard': "IVA incluido" / "VAT included"
  - 'reverse_charge': "Inversión del sujeto pasivo — Art. 196 Directive 2006/112/EC. Reverse charge applies."
  - 'oss': "VAT charged via OSS scheme — destination country rate"
  - 'export': "Export — 0% VAT — Article 146 of EU VAT Directive"

### lib/invoicing/generatePdf.ts (using @react-pdf/renderer)
```typescript
import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'

export async function generateInvoicePdf(invoiceId: string): Promise<Buffer> {
  const admin = createAdminClient()
  const { data: invoice } = await admin
    .from('invoices')
    .select('*, orders(*, order_items(*, products(name)), profiles(full_name)), brokers(legal_name, vat_number)')
    .eq('id', invoiceId)
    .single()
  
  if (!invoice) throw new Error('Invoice not found')
  
  return renderToBuffer(<InvoiceTemplate invoice={invoice} />)
}
```

### Invoice PDF storage
- After generation, upload to Supabase Storage bucket `invoices` (private)
- Generate signed URL (24h expiry) and update `invoices.pdf_url`
- Endpoint `/api/brokers/invoices/[id]/pdf` regenerates if URL expired

### Payout release flow (supplier)
**Trigger:** Supplier marks order as 'delivered' (extension of FRIDAY's fulfill action — add Mark Delivered action)
1. UPDATE orders SET status='delivered'
2. SELECT pending payout for this order with recipient_type='supplier'
3. transferToConnectAccount({ amount=payout.amount_cents, destination=supplier's stripe account })
   - Note: Suppliers ALSO need Stripe Connect onboarding for payouts. **For MVP simplification:** keep supplier payouts as 'pending' status and require admin manual release until supplier Stripe Connect is built (Phase 1).
4. UPDATE payouts SET status='completed', stripe_transfer_id, completed_at
5. Send email notification (SENTINEL packet)

**MVP fallback for supplier payouts:**
- Admin manually triggers payout release from `/admin/payouts` page
- POST `/api/admin/payouts/[id]/release` → admin reviews and confirms → status='completed' (manual bank transfer outside Stripe for MVP)
- Document this as a temporary measure — Phase 1 will add supplier Stripe Connect

### Admin invoice override
For edge cases where Conditions Engine blocks but business rule allows manual override:
- POST `/api/admin/invoices/[id]/override`
- Body: `{ reason: string, forceTreatment: VatTreatment, forceVatRate: number }`
- UPDATE invoices SET conditions_passed=true, status='issued' (or stays 'pending_conditions' depending on workflow)
- Write to admin_audit_log: action='INVOICE_OVERRIDE'

### Broker invoice list
- Show all invoices where broker_id matches current broker
- Columns: Invoice #, Date, Order ID, Buyer Country, VAT Treatment, Net (broker share), Status, Actions (View, Download PDF)
- Filters: status (issued, paid, void), date range
- Pagination: 50 per page

### Broker payout list
- Columns: Date, Amount, Status, Stripe Transfer ID, Actions (View)
- Note: For broker-mediated transactions, Stripe Connect handles transfer automatically. Our payouts table is for our own audit trail.
- Show running total: Total earned this month, all-time

## ACCEPTANCE CRITERIA
- [ ] Broker without Stripe onboarding cannot create promotions (403)
- [ ] Broker can create promotion only for products of assigned suppliers
- [ ] Slot conflict detection works
- [ ] Max 5 active promotions enforced
- [ ] Active promotions appear on /marketplace top
- [ ] Promotion banner shows broker info + pitch
- [ ] Product detail shows "Featured by" badge when promoted
- [ ] PDF invoice generates correctly with all required EU fields
- [ ] PDF shows correct VAT treatment language per scenario
- [ ] PDFs upload to Supabase Storage; signed URLs work
- [ ] Broker invoice list filtered correctly to own
- [ ] Mark order delivered triggers payout release flow (admin manual for MVP supplier)
- [ ] Admin override endpoint logs to audit_log
- [ ] Payout history shows all broker transfers from Connect
- [ ] Expired promotions automatically excluded from public display

## HAND-OFF TO NEXT PACKET (SENTINEL)
- Full broker monetization loop functional
- Invoices generated and downloadable
- Payouts tracked
- Ready for email notifications and production polish

## EXECUTION COMMAND
Build all files. Test promotion creation, slot conflict, PDF generation with all 4 VAT treatments, payout release. Generate at least one PDF for each VAT treatment scenario. Report PASS/FAIL with PDF samples attached if possible.
