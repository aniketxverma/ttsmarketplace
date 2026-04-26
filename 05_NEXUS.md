# ════════════════════════════════════════════════════════════════
# NEXUS — TTAI ADMIN VERIFICATION GATE
# Packet 5 of 9 · Status: READY TO EXECUTE
# ════════════════════════════════════════════════════════════════

You are building the admin verification system. The "Golden Gate" of TTAI.

## MISSION
Build the admin dashboard with supplier verification queue, state machine transition controls, and immutable audit log. Admins approve/reject suppliers, suspend/reinstate accounts, and review all platform activity.

## DEPENDENCIES
- **JARVIS, EDITH, FRIDAY complete**
- Suppliers exist in PENDING/UNDER_REVIEW states
- Document uploads exist

## FILES TO CREATE

### Admin pages
- `app/(dashboard)/admin/page.tsx` — overview dashboard (queue counts, recent activity, KPIs)
- `app/(dashboard)/admin/suppliers/page.tsx` — supplier list filtered by status (default: PENDING + UNDER_REVIEW)
- `app/(dashboard)/admin/suppliers/[id]/page.tsx` — supplier detail with documents, action buttons, audit history
- `app/(dashboard)/admin/brokers/page.tsx` — broker list (status, Stripe Connect status)
- `app/(dashboard)/admin/brokers/[id]/page.tsx` — broker detail
- `app/(dashboard)/admin/transactions/page.tsx` — transaction ledger viewer with filters
- `app/(dashboard)/admin/disputes/page.tsx` — disputed orders (placeholder list, dispute resolution is Phase 1)
- `app/(dashboard)/admin/audit-log/page.tsx` — full admin_audit_log viewer with filters

### API routes
- `app/api/admin/suppliers/route.ts` — GET list with status/country filters
- `app/api/admin/suppliers/[id]/route.ts` — GET full supplier detail with documents + audit
- `app/api/admin/suppliers/[id]/transition/route.ts` — POST state transition (already specified in spec, finalize here)
- `app/api/admin/suppliers/[id]/notes/route.ts` — POST update admin_notes
- `app/api/admin/brokers/route.ts` — GET list
- `app/api/admin/brokers/[id]/suspend/route.ts` — POST suspend broker
- `app/api/admin/audit/route.ts` — GET audit log with filters (target_type, target_id, actor_id, date range)
- `app/api/admin/transactions/route.ts` — GET transaction_ledger with filters

### Components
- `components/admin/VerificationQueue.tsx` — queue table with filter chips and bulk actions
- `components/admin/StateTransitionModal.tsx` — modal for state change with reason field (required)
- `components/admin/AuditTrail.tsx` — chronological audit list for any entity
- `components/admin/DocumentViewer.tsx` — inline preview of supplier documents (PDFs in iframe, images displayed)
- `components/admin/StatsCard.tsx` — KPI card for dashboard overview

## SPECIFICATIONS

### State machine (HARD RULES)
```
ALLOWED_TRANSITIONS = {
  PENDING:      [UNDER_REVIEW],
  UNDER_REVIEW: [ACTIVE, PENDING, SUSPENDED],
  ACTIVE:       [SUSPENDED],
  SUSPENDED:    [ACTIVE, PENDING],
}
```
**Forbidden transitions:**
- PENDING → ACTIVE (must pass through UNDER_REVIEW)
- Any non-admin attempting any transition

### Validation schema
```typescript
export const transitionSupplierSchema = z.object({
  targetStatus: z.enum(['PENDING', 'UNDER_REVIEW', 'ACTIVE', 'SUSPENDED']),
  reason: z.string().min(5).max(500),
})
```

### POST /api/admin/suppliers/[id]/transition logic
1. Verify caller has admin role (use `requireRole(['admin'])`); reject 403 otherwise
2. Validate body with transitionSupplierSchema
3. Fetch current supplier; reject 404 if not found
4. Check transition is in ALLOWED_TRANSITIONS map; reject 422 if not
5. UPDATE suppliers SET status=target, verified_at=(now() if target=ACTIVE else unchanged)
6. INSERT supplier_state_audit (supplier_id, from_status, to_status, reason, actor_id=auth.uid)
7. INSERT admin_audit_log (actor_id, action='SUPPLIER_TRANSITION', target_type='supplier', target_id, payload={from, to, reason})
8. (Future hook for SENTINEL packet: enqueue email notification to supplier)
9. Return 200 with `{ supplierId, from, to }`

### Verification queue UI
- Top filter bar: status chips (All, PENDING, UNDER_REVIEW, ACTIVE, SUSPENDED)
- Counts shown in chip badges
- Default view: PENDING + UNDER_REVIEW combined
- Table columns: Logo, Legal Name, Country, Status, Created Date, Documents Count, Actions
- Sort: created_at ASC by default (oldest first — first in queue)
- Each row: clickable to detail page

### Supplier detail page
Layout:
- Header: name, status badge, country, action buttons (state transitions based on current status)
- Left column: company info, contact info, address, supplier description
- Center column: Document viewer with each uploaded doc (preview + download)
- Right column: AuditTrail with full state history (from supplier_state_audit + admin_audit_log)
- Bottom: Admin notes textarea (auto-save on blur via PATCH)

Action buttons logic (status-aware):
- If PENDING: [Move to Review]
- If UNDER_REVIEW: [Approve (→ACTIVE)] [Request More Info (→PENDING)] [Reject (→SUSPENDED)]
- If ACTIVE: [Suspend]
- If SUSPENDED: [Reactivate (→ACTIVE)] [Reset to Pending]

Each button opens StateTransitionModal requiring a reason (min 5 chars).

### Audit trail display
- Chronological, newest first
- Each entry: timestamp, actor name, action, before → after, reason
- Different entry types: state transition, admin note, document upload, etc.
- Filter by date range, actor, action type

### Admin dashboard overview (/admin)
KPI cards (top row):
1. Pending Verification Queue (count of PENDING + UNDER_REVIEW)
2. Active Suppliers (count of ACTIVE)
3. Total Transactions (last 30 days, count + sum of gross_cents)
4. Open Disputes (count of orders with status='disputed')

Recent activity feed (next 10 admin_audit_log entries).

### RLS reminder
All admin endpoints MUST verify role via `requireRole(['admin'])`. Database RLS policies allow admin via `current_user_role()='admin'`. Service role client bypasses RLS but should only be used after server-side auth check.

### Audit log filtering
GET /api/admin/audit query params:
- `target_type` — 'supplier', 'broker', 'order', 'invoice'
- `target_id` — UUID
- `actor_id` — UUID
- `from` / `to` — ISO date
- `action` — string
- `page`, `pageSize` (default 50)

## ACCEPTANCE CRITERIA
- [ ] Non-admin users get 403 on every admin API endpoint
- [ ] Non-admin users redirected away from /admin pages
- [ ] PENDING → ACTIVE direct transition is BLOCKED with 422
- [ ] Valid transitions write to both supplier_state_audit AND admin_audit_log
- [ ] State transition modal requires reason ≥ 5 chars
- [ ] Approving a supplier (→ACTIVE) sets verified_at
- [ ] Once ACTIVE, supplier's products become publicly visible (verify with VERONICA browse)
- [ ] Document viewer renders PDFs and images
- [ ] Admin notes save and persist
- [ ] Audit trail shows complete history including the transition that just occurred
- [ ] KPI cards on dashboard show correct counts
- [ ] Audit log filters by target_type, actor, and date range correctly

## HAND-OFF TO NEXT PACKET (HERMES)
- Verification gate fully operational
- Admin can manage entire supplier lifecycle
- Audit infrastructure ready for HERMES (broker actions) and ATLAS (transactions) to log into

## EXECUTION COMMAND
Build all files. Create a test admin user (manually set role='admin' in DB), test full state machine flow, verify audit trails. Report PASS/FAIL on each criterion.
