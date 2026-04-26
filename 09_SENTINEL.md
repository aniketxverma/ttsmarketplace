# ════════════════════════════════════════════════════════════════
# SENTINEL — TTAI EMAIL, MONITORING & DEPLOYMENT
# Packet 9 of 9 · Status: READY TO EXECUTE
# ════════════════════════════════════════════════════════════════

You are building the production polish layer: transactional emails, error monitoring, and deployment.

## MISSION
Ensure every key event triggers an email. Set up error tracking with Sentry. Configure Vercel deployment. Final QA checks. Prepare for launch.

## DEPENDENCIES
- **All previous packets complete (JARVIS through PROMETHEUS)**
- Resend account with verified sender domain
- Sentry account with project created
- Vercel account linked to repo

## FILES TO CREATE

### Email infrastructure
- `lib/email/client.ts` — Resend client wrapper with error handling
- `lib/email/send.ts` — `sendEmail({ to, subject, react })` helper
- `lib/email/templates/Base.tsx` — shared email layout (header, footer, branding)
- `lib/email/templates/WelcomeEmail.tsx` — sent on user registration
- `lib/email/templates/EmailVerification.tsx` — verify email
- `lib/email/templates/SupplierVerificationStatusEmail.tsx` — sent on each supplier state change
- `lib/email/templates/OrderConfirmationEmail.tsx` — to buyer when order paid
- `lib/email/templates/SupplierOrderEmail.tsx` — to supplier when new order placed
- `lib/email/templates/InvoiceIssuedEmail.tsx` — to buyer when invoice ready (PDF link)
- `lib/email/templates/PayoutCompletedEmail.tsx` — to broker/supplier when paid out
- `lib/email/templates/BrokerPromotionExpiringEmail.tsx` — 24h before promotion ends
- `lib/email/templates/PasswordResetEmail.tsx` — already handled by Supabase but customizable

### Monitoring
- `sentry.client.config.ts` — Sentry browser config
- `sentry.server.config.ts` — Sentry server config
- `sentry.edge.config.ts` — Sentry edge runtime config
- `instrumentation.ts` — Next.js instrumentation hook
- `next.config.js` — wrap with `withSentryConfig`

### Cron jobs (Vercel Cron or Supabase pg_cron)
- `app/api/cron/expiring-promotions/route.ts` — daily check for promotions ending in 24h, send notification
- `app/api/cron/auto-deliver/route.ts` — weekly check for orders 'fulfilled' but not yet 'delivered' for 14+ days; auto-mark delivered to release payouts (Stripe industry standard)
- `vercel.json` — cron schedule definitions

### Email integration points (modify existing files)
**JARVIS area:**
- `app/api/auth/callback/route.ts` — send WelcomeEmail on first login

**FRIDAY area:**
- `app/api/suppliers/route.ts` — send SupplierVerificationStatusEmail on registration

**NEXUS area:**
- `app/api/admin/suppliers/[id]/transition/route.ts` — send status change email

**ATLAS area:**
- `app/api/webhooks/stripe/route.ts` (in checkout.session.completed handler):
  - Send OrderConfirmationEmail to buyer
  - Send SupplierOrderEmail to supplier

**PROMETHEUS area:**
- After PDF generation: send InvoiceIssuedEmail to buyer
- After payout release: send PayoutCompletedEmail

### Production config
- `next.config.js` — add `output: 'standalone'` if needed for Docker, image domains, sentry config
- `vercel.json` — function regions (eu-central), cron jobs, headers
- `.env.production.example` — production env vars template
- `README.md` — setup instructions, env vars list, common commands
- `DEPLOYMENT.md` — step-by-step deploy guide

### Health checks
- `app/api/health/route.ts` — GET endpoint returning DB connection status, Stripe connectivity, Resend connectivity
- `app/api/ready/route.ts` — readiness check for Vercel

## SPECIFICATIONS

### Email send pattern
All email sends must be:
1. **Non-blocking** — fire and forget; don't await on critical paths (use `Promise.resolve(send(...)).catch(logError)`)
2. **Idempotent** — same event shouldn't send twice (use unique idempotency keys where possible)
3. **Logged** — successful and failed sends logged to console + Sentry
4. **Localized** — use `profile.preferred_language` to pick template language (English fallback)

### lib/email/send.ts
```typescript
import { Resend } from 'resend'
import * as Sentry from '@sentry/nextjs'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendEmail(params: {
  to: string
  subject: string
  react: React.ReactElement
  idempotencyKey?: string
}) {
  if (process.env.APP_ENV === 'development' && !process.env.RESEND_API_KEY) {
    console.log('[email:dev]', params.to, params.subject)
    return { id: 'dev-mock' }
  }
  
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: params.to,
      subject: params.subject,
      react: params.react,
      headers: params.idempotencyKey ? { 'X-Idempotency-Key': params.idempotencyKey } : undefined,
    })
    return result
  } catch (err) {
    Sentry.captureException(err, { extra: { emailTo: params.to, subject: params.subject } })
    throw err
  }
}
```

### Email template requirements (Base.tsx)
- TTAI logo at top
- Consistent typography
- Responsive layout (works on mobile email clients)
- Footer with: company name, address, unsubscribe link (where legally required), language switcher (Phase 1)
- Use `@react-email/components` if available (cleaner than raw HTML)

### Sentry config
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
})

// sentry.server.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
})
```

### vercel.json
```json
{
  "crons": [
    { "path": "/api/cron/expiring-promotions", "schedule": "0 9 * * *" },
    { "path": "/api/cron/auto-deliver", "schedule": "0 3 * * 0" }
  ],
  "functions": {
    "app/api/webhooks/stripe/route.ts": { "maxDuration": 30 },
    "app/api/checkout/session/route.ts": { "maxDuration": 15 }
  },
  "regions": ["fra1"]
}
```

### Cron auth
All `/api/cron/*` endpoints must verify `Authorization: Bearer ${CRON_SECRET}` header. Add `CRON_SECRET` to env.

### Error boundaries
- `app/error.tsx` — root error boundary, logs to Sentry, shows friendly error page
- `app/not-found.tsx` — 404 page
- `app/global-error.tsx` — last-resort error boundary

### Health check response
```typescript
// /api/health
{
  status: 'ok' | 'degraded' | 'down',
  checks: {
    database: 'ok' | 'fail',
    stripe: 'ok' | 'fail',
    resend: 'ok' | 'fail',
  },
  timestamp: string,
  version: string
}
```

### README.md sections
- Project overview
- Stack
- Local setup (clone → install → env → migrations → run)
- Required external accounts (Supabase, Stripe, Resend, Sentry)
- Running migrations
- Testing flows (supplier onboarding, broker Connect, checkout)
- Deployment (Vercel)
- Architecture diagram (text-based)

### DEPLOYMENT.md sections
1. Pre-deploy checklist (env vars, Stripe webhook URL, Resend domain verification, Sentry DSN)
2. Vercel project setup
3. Environment variables (paste template)
4. First deployment
5. Post-deploy verification (smoke tests for each role)
6. Rollback procedure

### Smoke test checklist (run after deploy)
- [ ] Public site loads
- [ ] Register a buyer
- [ ] Browse products
- [ ] Add to cart, checkout (Stripe test mode), complete payment
- [ ] Webhook fires, order moves to 'paid'
- [ ] Supplier gets order email
- [ ] Buyer gets confirmation email
- [ ] Invoice PDF accessible
- [ ] Sentry receives a test event
- [ ] Health check returns ok

## ACCEPTANCE CRITERIA
- [ ] Welcome email sends on registration
- [ ] Supplier status change emails fire on each NEXUS transition
- [ ] Order confirmation email sends on paid order (buyer + supplier both)
- [ ] Invoice issued email sends with valid PDF link
- [ ] Sentry captures errors from both client and server runtimes
- [ ] Health check endpoint returns correct status
- [ ] Cron jobs registered and accessible via authorized requests only
- [ ] Production build succeeds (`npm run build` with no errors)
- [ ] Vercel deploy succeeds
- [ ] All env vars documented in README
- [ ] Error boundaries catch and display friendly messages
- [ ] Email templates render correctly in major clients (Gmail, Outlook, Apple Mail) — test with [Litmus](https://litmus.com) or manual

## HAND-OFF
**Build is complete.** TTAI marketplace is production-ready.

Next steps (out of scope for these 9 packets — Phase 1 enhancements):
- Multi-language i18n (EN/ES/DE)
- AI Copilot wired to Anthropic API
- Promotion auction/bidding for premium slots
- DAC7 annual report generation
- Multi-currency display
- Logistics Hub integration
- Dispute resolution module
- Supplier reliability auto-tier
- Supplier Stripe Connect onboarding (currently MVP uses manual admin payout)

## EXECUTION COMMAND
Build all files. Run smoke test checklist on local then deploy to Vercel. Send a test email through each template. Trigger a test error in Sentry. Confirm production-ready. Report PASS/FAIL.
