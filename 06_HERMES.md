# ════════════════════════════════════════════════════════════════
# HERMES — TTAI BROKER & STRIPE CONNECT
# Packet 6 of 9 · Status: READY TO EXECUTE
# ════════════════════════════════════════════════════════════════

You are building the broker monetization onboarding system. Brokers are the revenue engine of TTAI.

## MISSION
Build broker registration, broker dashboard, Stripe Connect Express onboarding flow (Spain-incorporated platform), and broker-supplier assignment management. Brokers can mediate transactions and receive automated payouts.

## DEPENDENCIES
- **JARVIS, EDITH complete**
- Stripe account configured: Connect platform enabled, Spain entity, Tax module enabled
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID` set in env

## FILES TO CREATE

### Broker pages
- `app/(dashboard)/broker/page.tsx` — broker dashboard home (Stripe status, assigned suppliers count, upcoming payouts)
- `app/(dashboard)/broker/register/page.tsx` — initial broker application form (legal info, tax)
- `app/(dashboard)/broker/onboarding/page.tsx` — "Complete Stripe Connect" CTA + status display
- `app/(dashboard)/broker/onboarding/complete/page.tsx` — Stripe return URL handler — fetches account status and confirms
- `app/(dashboard)/broker/suppliers/page.tsx` — list of assigned suppliers (broker_supplier_assignments)
- `app/(dashboard)/broker/settings/page.tsx` — edit profile + view commission structure (read-only — set by admin)

### Admin broker management
- `app/(dashboard)/admin/brokers/[id]/assignments/page.tsx` — admin manages broker_supplier_assignments
- `app/api/admin/brokers/[id]/assign-supplier/route.ts` — POST add assignment, DELETE remove
- `app/api/admin/brokers/[id]/commission/route.ts` — PATCH update commission_pct, fixed_fee_cents, broker_share_pct

### API routes
- `app/api/brokers/route.ts` — POST register as broker, GET own
- `app/api/brokers/me/route.ts` — GET, PATCH own broker
- `app/api/brokers/connect/route.ts` — POST initiate Stripe Connect onboarding, GET status
- `app/api/brokers/connect/callback/route.ts` — GET callback handler from Stripe return URL

### Stripe libraries
- `lib/stripe/client.ts` — exports `stripe` instance + checkout helper functions
- `lib/stripe/connect.ts` — Stripe Connect specific helpers
- `lib/stripe/webhooks.ts` — webhook event handlers (used by ATLAS later)

### Components
- `components/broker/RegistrationForm.tsx` — initial broker form
- `components/broker/StripeConnectCard.tsx` — onboarding progress card with action button
- `components/broker/SupplierAssignmentList.tsx` — list of assigned suppliers
- `components/broker/CommissionDisplay.tsx` — read-only display of commission structure

### Validation schemas (add to lib/validation/schemas.ts)
```typescript
export const createBrokerSchema = z.object({
  legalName: z.string().min(2).max(200),
  taxId: z.string().min(3).max(50),
  vatNumber: z.string().max(20).optional(),
  taxJurisdiction: z.string().length(2).default('ES'),
})

export const updateCommissionSchema = z.object({
  commissionPct: z.number().min(0).max(50),
  fixedFeeCents: z.number().int().min(0),
  brokerSharePct: z.number().min(0).max(50),
})
```

## SPECIFICATIONS

### lib/stripe/client.ts
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export function constructWebhookEvent(payload: string | Buffer, signature: string) {
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
}
```

### lib/stripe/connect.ts
```typescript
export async function createConnectAccount(params: {
  email: string
  legalName: string
  taxId: string
}) {
  return stripe.accounts.create({
    type: 'express',
    country: 'ES',
    email: params.email,
    business_type: 'individual',
    business_profile: { name: params.legalName },
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    tos_acceptance: { service_agreement: 'recipient' },
  })
}

export async function createAccountOnboardingLink(accountId: string, baseUrl: string) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/broker/onboarding?refresh=true`,
    return_url: `${baseUrl}/broker/onboarding/complete`,
    type: 'account_onboarding',
  })
}

export async function getConnectAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)
  return {
    detailsSubmitted: account.details_submitted,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    requirementsCurrentlyDue: account.requirements?.currently_due ?? [],
  }
}

export async function transferToConnectAccount(params: {
  amountCents: number
  destinationAccountId: string
  orderId: string
}) {
  return stripe.transfers.create({
    amount: params.amountCents,
    currency: 'eur',
    destination: params.destinationAccountId,
    metadata: { order_id: params.orderId },
  })
}
```

### Broker registration flow
1. User fills RegistrationForm at `/broker/register`
2. POST /api/brokers creates broker row with status='PENDING', stripe_account_id=null, stripe_onboarding_complete=false
3. Update profile.role='broker'
4. Redirect to `/broker/onboarding`

### Stripe Connect onboarding flow
**Step 1: User initiates**
- User clicks "Connect with Stripe" button on `/broker/onboarding`
- Frontend POST /api/brokers/connect
- Backend:
  - If broker.stripe_account_id is null → call createConnectAccount → save stripe_account_id to brokers table
  - Call createAccountOnboardingLink → return `{ url }`
- Frontend redirects to Stripe-hosted URL

**Step 2: User completes Stripe form**
- Stripe collects: legal entity verification, bank account, tax info, ID verification
- Stripe redirects user back to `/broker/onboarding/complete`

**Step 3: Server confirms onboarding**
- `/broker/onboarding/complete` page calls GET /api/brokers/connect
- Backend calls getConnectAccountStatus
- If `detailsSubmitted && chargesEnabled` → UPDATE brokers SET stripe_onboarding_complete=true
- If still incomplete → show "Continue Onboarding" button regenerating link
- Display requirements currently due if any

**Step 4: Webhook syncs status changes**
- Stripe webhook event `account.updated` → handler in `app/api/webhooks/stripe/route.ts` (ATLAS packet) — UPDATE brokers SET stripe_onboarding_complete based on capabilities

### POST /api/brokers/connect logic
```
1. requireAuth() → user
2. Fetch broker WHERE user_id=user.id; 404 if none
3. If broker.stripe_onboarding_complete → 409 "Already onboarded"
4. If broker.stripe_account_id is null:
   - account = await createConnectAccount({ email: user.email, legalName, taxId })
   - UPDATE brokers SET stripe_account_id=account.id
5. link = await createAccountOnboardingLink(broker.stripe_account_id, baseUrl)
6. Return { url: link.url }
```

### GET /api/brokers/connect logic
```
1. requireAuth() → user
2. Fetch broker WHERE user_id=user.id
3. If !broker.stripe_account_id → return { status: 'not_started' }
4. status = await getConnectAccountStatus(broker.stripe_account_id)
5. If status complete and !broker.stripe_onboarding_complete → UPDATE flag to true
6. Return { status: 'onboarded', ...status }
```

### Broker dashboard home
KPI cards:
1. Stripe Connect Status (with action button if incomplete)
2. Assigned Suppliers count
3. Active Promotions count (placeholder for PROMETHEUS)
4. Pending Payouts (€ total — placeholder for ATLAS)

Status banner if onboarding incomplete: "Complete your Stripe onboarding to start earning."

### Admin broker management
- Admin can:
  - View all brokers and their Stripe Connect status
  - Set commission_pct, fixed_fee_cents, broker_share_pct (with validation: total deductions ≤ 50%)
  - Assign/unassign suppliers to brokers (broker_supplier_assignments)
  - Suspend brokers (status='SUSPENDED' — blocks promotions and payouts)

### Broker-supplier assignment
- Admin selects supplier from dropdown of ACTIVE suppliers
- POST creates broker_supplier_assignments row
- DELETE removes assignment
- Once assigned, broker can promote that supplier's products (PROMETHEUS) and earn on those orders (ATLAS)

### Sidebar nav for role='broker'
- Dashboard (/broker)
- Suppliers (/broker/suppliers)
- Promotions (/broker/promotions) — link exists but page is placeholder until PROMETHEUS
- Invoices (/broker/invoices) — placeholder until PROMETHEUS
- Payouts (/broker/payouts) — placeholder until ATLAS
- Settings (/broker/settings)

## ACCEPTANCE CRITERIA
- [ ] User can fill broker registration; broker row created with status=PENDING
- [ ] profile.role updates to 'broker' on successful registration
- [ ] "Connect with Stripe" button creates Stripe Express account in test mode
- [ ] Redirect to Stripe-hosted onboarding works
- [ ] After completing Stripe form, return URL handler confirms onboarding status
- [ ] `stripe_onboarding_complete=true` after Stripe reports details_submitted + charges_enabled
- [ ] Account.updated webhook updates broker flag (test by triggering update in Stripe dashboard)
- [ ] Admin can assign supplier to broker; assignment row created
- [ ] Admin can update commission structure within bounds
- [ ] Non-broker users get 403 on broker API endpoints
- [ ] Brokers cannot edit own commission_pct (admin-only)
- [ ] Sidebar shows broker nav for role=broker

## HAND-OFF TO NEXT PACKET (ATLAS)
- Brokers exist with active Stripe Connect accounts
- broker_supplier_assignments populated for brokered transactions
- Stripe client and Connect helpers ready for checkout
- Webhook infrastructure shell ready to extend with payment events

## EXECUTION COMMAND
Build all files. In Stripe test mode, complete a full broker onboarding cycle end-to-end. Verify webhook updates flag. Report PASS/FAIL on each criterion.
