# ════════════════════════════════════════════════════════════════
# TTAI BUILD — THE NINE PACKETS
# Tony Stark x JARVIS execution protocol
# ════════════════════════════════════════════════════════════════

Each packet is a self-contained brief. Open one, paste it into a fresh AI build session, say "execute", get back working code. Then move to the next.

## EXECUTION ORDER (HARD)

```
01_JARVIS      → Foundation & Database         (everything depends on this)
02_EDITH       → Auth & Identity               (depends on JARVIS)
03_VERONICA    → Public Catalog                (depends on JARVIS, EDITH)
04_FRIDAY      → Supplier Flow                 (depends on JARVIS, EDITH, VERONICA)
05_NEXUS       → Admin Verification Gate       (depends on JARVIS, EDITH, FRIDAY)
06_HERMES      → Broker & Stripe Connect       (depends on JARVIS, EDITH; can run parallel to 03–05)
07_ATLAS       → Checkout, VAT & Fees          (depends on 01–06)
08_PROMETHEUS  → Promotions & Invoicing        (depends on 01–07)
09_SENTINEL    → Email, Monitoring & Deploy    (depends on all)
```

## PARALLEL TRACK
- HERMES (06) can build at the same time as VERONICA → FRIDAY → NEXUS (03–05)
- Everything else is strict order

## HOW TO USE EACH BRIEF

1. Open the brief file (e.g. `01_JARVIS.md`)
2. Copy the entire contents
3. Open a fresh AI session (Claude Code, ChatGPT, Cursor, whatever)
4. Paste, then add: **"Execute this packet."**
5. AI builds. You verify acceptance criteria.
6. Move to next packet.

## CONNECTING THE PACKETS

Each packet hands off through three things — **never through code imports**:

1. **Database state** — tables, rows, RLS policies. Whatever JARVIS creates, FRIDAY assumes exists.
2. **API contracts** — every packet's API routes have stable shapes. Later packets call earlier packets' endpoints.
3. **Environment variables** — set once in `.env.local`, used by all packets.

This means each packet can be built in isolation. The build AI doesn't need to know about the others — it just needs the brief.

## STATUS TRACKING

Mark each packet as you go:

- [ ] 01 JARVIS
- [ ] 02 EDITH
- [ ] 03 VERONICA
- [ ] 04 FRIDAY
- [ ] 05 NEXUS
- [ ] 06 HERMES
- [ ] 07 ATLAS
- [ ] 08 PROMETHEUS
- [ ] 09 SENTINEL

## TIPS

- **Don't skip acceptance criteria.** Each packet's checklist exists because the next packet assumes those things work.
- **Test with real Stripe test mode** for HERMES, ATLAS, PROMETHEUS — webhooks must fire correctly.
- **Run migrations only once per packet build.** If you re-run JARVIS migrations after FRIDAY, you'll wipe your test data.
- **Keep `.env.local` synced.** Every packet adds vars; the example file is your master list.
- **If an AI gets confused mid-packet,** copy the brief again and add: "Continue from where you left off. Already created files: X, Y, Z."

## BRIEFS LOCATION

All briefs live in this directory. They are plain markdown — readable on any device, ready to paste anywhere.

Built for clarity. Built for speed. Built for execution.
