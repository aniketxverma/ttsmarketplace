# ════════════════════════════════════════════════════════════════
# ATLAS — TTAI CHECKOUT, VAT & FEES
# Packet 7 of 9 · Status: READY TO EXECUTE
# ════════════════════════════════════════════════════════════════
# THIS IS THE HEART OF THE MARKETPLACE. EXECUTE WITH PRECISION.

You are building the financial core of TTAI: cart, checkout, EU VAT determination, fee calculation, Stripe Checkout integration, webhook handling, transaction ledger, and payout queueing.

## MISSION
Enable buyers to purchase products. Determine VAT correctly per EU rules. Split fees across TTAI/broker/supplier. Write immutable transaction ledger. Queue payouts. All transactions must be auditable and idempotent.

## DEPENDENCIES
- **JARVIS, EDITH, VERONICA, FRIDAY, HERMES complete**
- Stripe webhook endpoint registered in Stripe dashboard pointing to `https://yourapp.com/api/webhooks/stripe`
- Active suppliers with published products exist
- (Optional) brokers with completed Stripe Connect for broker-mediated paths

## FILES TO CREATE

### Cart system (client-side, in-memory + localStorage)
- `lib/cart/store.ts` — cart state management (uses Zustand or React Context — simple object array in localStorage)
- `lib/cart/types.ts` — CartItem type
- `components/checkout/CartDrawer.tsx` — slide-out cart with line items, quantities, totals
- `components/checkout/CartIcon.tsx` — header icon with item count badge
- `components/checkout/AddToCartButton.tsx` — replaces placeholder from VERONICA on product detail

### Checkout flow
- `app/(public)/checkout/page.tsx` — checkout page: shipping address form, VAT number input (B2B), order summary
- `app/(public)/checkout/processing/page.tsx` — interstitial while creating session
- `components/checkout/CheckoutForm.tsx` — main checkout form
- `components/checkout/OrderSummary.tsx` — line items + subtotal + VAT + total breakdown
- `components/checkout/AddressForm.tsx` — country/city/address fields with VIES VAT lookup

### Buyer dashboard
- `app/(dashboard)/buyer/page.tsx` — dashboard home (recent orders, status overview)
- `app/(dashboard)/buyer/orders/page.tsx` — full order history
- `app/(dashboard)/buyer/orders/[id]/page.tsx` — order detail with status timeline
- `app/(dashboard)/buyer/settings/page.tsx` — profile + saved addresses

### Conditions Engine (EU VAT)
- `lib/conditions-engine/index.ts` — main `runConditionsEngine()` function
- `lib/conditions-engine/eu-vat.ts` — EU country list, VAT rates, helpers
- `lib/conditions-engine/vies.ts` — VIES VAT validation client
- `lib/conditions-engine/oss.ts` — OSS (One-Stop Shop) destination-country logic

### Fee Engine
- `lib/fees/calculate.ts` — fee splitting logic with all formulas

### Stripe integration (extends HERMES)
- `lib/stripe/checkout.ts` — `createCheckoutSession()` with Connect transfer_data
- `lib/stripe/webhooks.ts` — typed webhook event handlers

### API routes
- `app/api/checkout/session/route.ts` — POST creates pending order, runs conditions engine, creates Stripe Checkout session
- `app/api/webhooks/stripe/route.ts` — POST handles all Stripe events (checkout.session.completed, payment_intent.payment_failed, charge.refunded, account.updated)
- `app/api/orders/route.ts` — GET buyer's own orders
- `app/api/orders/[id]/route.ts` — GET single order with full detail (RLS enforces visibility)

## SPECIFICATIONS

### lib/conditions-engine/index.ts (HARD RULES)

EU country list (uppercase ISO codes):
```typescript
const EU_COUNTRIES = new Set([
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI',
  'FR','GR','HR','HU','IE','IT','LT','LU','LV','MT',
  'NL','PL','PT','RO','SE','SI','SK',
])
```

VAT rates per EU country (use standard rates):
```typescript
const EU_VAT_RATES: Record<string, number> = {
  AT: 20, BE: 21, BG: 20, CY: 19, CZ: 21, DE: 19, DK: 25,
  EE: 22, ES: 21, FI: 24, FR: 20, GR: 24, HR: 25, HU: 27,
  IE: 23, IT: 22, LT: 21, LU: 17, LV: 21, MT: 18, NL: 21,
  PL: 23, PT: 23, RO: 19, SE: 25, SI: 22, SK: 20,
}
```

**runConditionsEngine logic (EXACT):**
```
Input: { buyerCountryIso, buyerIsEuVatRegistered, buyerVatNumber, productType, sellerCountryIso='ES' }

1. If buyerCountryIso NOT IN EU_COUNTRIES → 
   return { passed: true, vatTreatment: 'export', vatRate: 0 }

2. If isEuBuyer && NOT Spain && buyerIsEuVatRegistered && buyerVatNumber:
   - viesValid = await validateViesNumber(buyerCountryIso, buyerVatNumber)
   - If viesValid → return { passed: true, vatTreatment: 'reverse_charge', vatRate: 0, viesValidated: true }
   - If !viesValid → return { passed: true, vatTreatment: 'oss', vatRate: EU_VAT_RATES[country], viesValidated: false, reason: 'VAT number failed VIES validation; treated as B2C' }

3. If buyer is Spain (B2C) → 
   return { passed: true, vatTreatment: 'standard', vatRate: 21 }

4. Else (other EU B2C) → 
   return { passed: true, vatTreatment: 'oss', vatRate: EU_VAT_RATES[buyerCountryIso] ?? 21 }
```

### VIES validation (lib/conditions-engine/vies.ts)
```typescript
export async function validateViesNumber(countryCode: string, vatNumber: string): Promise<boolean> {
  try {
    const cleanNumber = vatNumber.replace(/^[A-Z]{2}/i, '').trim()
    const url = `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${cleanNumber}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return false
    const data = await res.json()
    return data.isValid === true
  } catch {
    console.error('VIES validation failed:', { countryCode, vatNumber })
    return false  // do not block transaction; treat as B2C
  }
}
```

### lib/fees/calculate.ts (HARD RULES)

```typescript
export interface FeeInput {
  grossCents: number              // total paid by buyer (incl VAT)
  brokerCommissionPct: number     // TTAI's % cut on broker-mediated tx
  brokerFixedFeeCents: number     // TTAI's flat fee per broker tx
  brokerSharePct: number          // Broker's share of net
  processorFeeCents: number       // Stripe fee
  vatCents: number                // VAT collected
  isBrokerMediated: boolean
}

export interface FeeOutput {
  ttaiFixedCents: number
  ttaiCommissionCents: number
  brokerNetCents: number
  supplierNetCents: number
  vatCollectedCents: number
  netGrossCents: number  // grossCents - vatCents
}

const PLATFORM_FEE_PCT_DIRECT = 3.0  // when no broker

export function calculateFees(input: FeeInput): FeeOutput {
  const { grossCents, brokerCommissionPct, brokerFixedFeeCents,
          brokerSharePct, processorFeeCents, vatCents, isBrokerMediated } = input
  
  const netGrossCents = grossCents - vatCents
  
  if (!isBrokerMediated) {
    const ttaiCommissionCents = Math.floor(netGrossCents * PLATFORM_FEE_PCT_DIRECT / 100)
    const supplierNetCents = netGrossCents - processorFeeCents - ttaiCommissionCents
    if (supplierNetCents <= 0) throw new Error('Fee structure exceeds gross')
    return {
      ttaiFixedCents: 0, ttaiCommissionCents,
      brokerNetCents: 0, supplierNetCents,
      vatCollectedCents: vatCents, netGrossCents,
    }
  }
  
  const ttaiFixedCents = brokerFixedFeeCents
  const ttaiCommissionCents = Math.floor(netGrossCents * brokerCommissionPct / 100)
  const brokerNetCents = Math.floor(netGrossCents * brokerSharePct / 100)
  const supplierNetCents = netGrossCents - processorFeeCents - ttaiFixedCents - ttaiCommissionCents - brokerNetCents
  
  if (supplierNetCents <= 0) throw new Error(`Fee structure exceeds gross. Net: ${netGrossCents}, Deductions: ${processorFeeCents + ttaiFixedCents + ttaiCommissionCents + brokerNetCents}`)
  
  return { ttaiFixedCents, ttaiCommissionCents, brokerNetCents, supplierNetCents, vatCollectedCents: vatCents, netGrossCents }
}

export function estimateProcessorFee(amountCents: number): number {
  return Math.ceil(amountCents * 0.015) + 25  // Stripe EU: 1.5% + €0.25
}

export function calculateApplicationFee(fees: FeeOutput): number {
  return fees.ttaiFixedCents + fees.ttaiCommissionCents
}
```

### Validation schema
```typescript
export const checkoutSessionSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postalCode: z.string(),
    countryIso: z.string().length(2),
  }),
  buyerIsVatRegistered: z.boolean().default(false),
  buyerVatNumber: z.string().optional(),
  idempotencyKey: z.string().uuid(),
})
```

### POST /api/checkout/session (full flow)
```
1. requireAuth() → user
2. Validate body with checkoutSessionSchema
3. Check idempotency: SELECT orders WHERE idempotency_key=key
   - If exists → return { sessionId: existing.stripe_checkout_session_id, orderId: existing.id }
4. Fetch products with supplier + category, filter is_published=true AND supplier.status='ACTIVE'
5. MVP CONSTRAINT: All items must be from same supplier_id; reject 422 otherwise
6. Check broker assignment: SELECT broker_supplier_assignments WHERE supplier_id=X AND brokers.stripe_onboarding_complete=true LIMIT 1
7. Run conditions engine with shippingAddress.countryIso, buyerIsVatRegistered, buyerVatNumber
8. Calculate per-item: subtotal_cents = price * qty; vat_cents = (vatRate > 0 ? subtotal * vatRate / 100 : 0)
9. Sum: subtotalCents, vatCents, grossCents = sub + vat
10. processorFeeCents = estimateProcessorFee(grossCents)
11. fees = calculateFees(...)
12. applicationFeeCents = calculateApplicationFee(fees)
13. INSERT order with status='pending', idempotency_key, totals, shipping_address
14. INSERT order_items
15. INSERT invoice with status='pending_conditions', conditions_payload, vat_treatment
16. session = await createCheckoutSession({
      orderId: order.id,
      lineItems: [{ name, amountCents: priceWithVat, quantity }],
      applicationFeeCents,
      brokerStripeAccountId: broker?.stripe_account_id ?? null,
      customerEmail: user.email,
      successUrl, cancelUrl,
      metadata: { order_id, supplier_id, broker_id, vat_treatment }
    })
17. UPDATE orders SET stripe_checkout_session_id=session.id
18. Return { sessionId, orderId }
```

### lib/stripe/checkout.ts
```typescript
export async function createCheckoutSession(params: {
  orderId: string
  lineItems: { name: string; amountCents: number; quantity: number }[]
  applicationFeeCents: number
  brokerStripeAccountId: string | null
  customerEmail: string
  successUrl: string
  cancelUrl: string
  metadata: Record<string, string>
}) {
  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.customerEmail,
    line_items: params.lineItems.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.name },
        unit_amount: item.amountCents,
      },
      quantity: item.quantity,
    })),
    payment_intent_data: params.brokerStripeAccountId
      ? {
          application_fee_amount: params.applicationFeeCents,
          transfer_data: { destination: params.brokerStripeAccountId },
        }
      : { application_fee_amount: params.applicationFeeCents },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { order_id: params.orderId, ...params.metadata },
    payment_method_types: ['card', 'sepa_debit'],
    billing_address_collection: 'required',
  })
}
```

### POST /api/webhooks/stripe (HARD RULES)

```
1. Read raw body + stripe-signature header
2. event = constructWebhookEvent(body, signature) — throws on invalid signature → 400
3. Switch event.type:

CASE 'checkout.session.completed':
  - orderId = session.metadata.order_id
  - UPDATE orders SET status='paid', stripe_payment_intent_id=session.payment_intent
  - SELECT order with broker info (joined)
  - grossCents = session.amount_total
  - processorFeeCents = ceil(grossCents * 0.015) + 25
  - fees = calculateFees(...)
  - INSERT transaction_ledger with all fee amounts (immutable)
  - UPDATE invoice SET status='issued', issued_at=now()
  - INSERT payouts (recipient_type='supplier', recipient_id, amount=fees.supplierNetCents, status='pending') — held until delivery
  - If broker mediated: INSERT payouts (recipient_type='broker', amount=fees.brokerNetCents, status='processing') — Stripe handles automatically via Connect transfer_data, this is for our own audit

CASE 'payment_intent.payment_failed':
  - UPDATE orders SET status='cancelled' WHERE stripe_payment_intent_id=pi.id

CASE 'charge.refunded':
  - orderId = charge.metadata.order_id
  - UPDATE orders SET status='refunded'
  - UPDATE invoices SET status='void'

CASE 'account.updated':  // from HERMES, finalized here
  - UPDATE brokers SET stripe_onboarding_complete=(account.details_submitted && account.charges_enabled) WHERE stripe_account_id=account.id

4. Return 200 { received: true }
```

**IMPORTANT:** Webhook must use `runtime = 'nodejs'` and `req.text()` for raw body to verify signature.

### Idempotency
- Frontend generates UUID per checkout attempt and includes as `idempotencyKey`
- Backend uses unique constraint on `orders.idempotency_key`
- If same key submitted twice, return existing session ID instead of creating duplicate

### Order detail page (/buyer/orders/[id])
Display:
- Order ID, date, status (with timeline: pending → paid → fulfilled → delivered)
- Items: product name, qty, unit price, line total
- Subtotal, VAT (with treatment label: "Spanish VAT", "Reverse Charge", "OSS — France 20%", "Export 0%"), total
- Shipping address
- Invoice link (PDF — generated in PROMETHEUS, placeholder here)
- If status='delivered', show "Mark Issue" button (disputes — Phase 1)

### Cart implementation
- Use simple Zustand store OR React Context with useReducer
- Persist to localStorage on every change
- CartItem: { productId, name, priceCents, quantity, supplierId, mainImageUrl }
- Cart enforces: all items from same supplier (block adding if mixing); show error toast

### Add to cart from product detail
Replace placeholder button from VERONICA with real AddToCartButton:
- If cart is empty OR item supplier matches → add
- If different supplier → show modal: "Replace cart? Your current cart is from {other supplier}." (Confirm/Cancel)

### Checkout page UX
- Step 1: Confirm cart items (editable quantities)
- Step 2: Shipping address (country dropdown, city, address, postal code)
- Step 3: VAT info (toggle "I'm a registered business" → reveals VAT number field)
- Step 4: Order summary with VAT breakdown shown live as user changes country
- Submit → POST /api/checkout/session → redirect to Stripe Checkout URL using `@stripe/stripe-js`

### Sidebar nav for role='buyer' / 'business_client'
- Dashboard (/buyer)
- Orders (/buyer/orders)
- Settings (/buyer/settings)

## ACCEPTANCE CRITERIA
- [ ] Add to cart works; cart persists across reloads
- [ ] Multi-supplier cart blocked with clear messaging
- [ ] Checkout page calculates VAT correctly per scenario:
  - [ ] Spain B2C: 21% VAT charged
  - [ ] France B2C: 20% VAT charged (OSS)
  - [ ] Germany B2B with valid VAT number: 0% (reverse charge), VIES validated
  - [ ] Germany B2B with invalid VAT number: 19% charged (OSS fallback)
  - [ ] US buyer: 0% VAT (export)
- [ ] Idempotency works: same key returns existing session
- [ ] Stripe Checkout session creates with correct application_fee_amount
- [ ] Broker-mediated checkout uses transfer_data.destination correctly
- [ ] Webhook signature verification rejects invalid signatures (400)
- [ ] checkout.session.completed → order status=paid, ledger row written, invoice issued
- [ ] Fee math: gross 12100 cents (incl 21% VAT) on direct sale = 10000 net, 300 to TTAI, supplier ~9550 after Stripe fee
- [ ] Fee math: same but broker-mediated with 5% commission, €1 fixed, 10% broker share = 500 + 100 to TTAI, 1000 to broker, ~8400 to supplier
- [ ] Order detail page shows correct VAT treatment label
- [ ] Refund flow: charge.refunded → order=refunded, invoice=void
- [ ] /buyer/orders shows only own orders (RLS enforced)

## HAND-OFF TO NEXT PACKET (PROMETHEUS)
- Working end-to-end checkout
- Transaction ledger populated
- Invoices in 'issued' state ready for PDF generation
- Payouts queued for processing
- Webhook infrastructure complete

## EXECUTION COMMAND
Build all files. Run through every VAT scenario in test mode. Verify webhook with Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`). Verify ledger entries match fee calculations exactly. Report PASS/FAIL on each criterion with calculated values for the math tests.
