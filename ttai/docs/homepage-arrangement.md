# Home Page Arrangement — TTAIEMA (planning note)

Living note of what to arrange on the home page, per Zain (2026-06-23).
Status: PLANNING. Nothing here is built yet unless ticked.

## The model in one line
- **Retail Store** & **Business Shop** = third-party **marketplaces** → buyer is connected to an
  independent seller; **contact + payment go to that seller**.
- **Trade Hub** = **TTAIEMA's OWN store** (our house goods: Bullz, Hudarom/Café, Rozil…) sold
  **dropship**; **contact + payment go to TTAIEMA's account**; dual **B2B / Online** pricing.

---

## 1. Three channel cards (Retail Store / Business Shop / Trade Hub)
- [ ] **Retail Store** (Piece & Box) → redirect to **retail shops** marketplace. Buyer browses →
      on a product, **contacts the retail shop directly OR pays** → money to **that shop**.
- [ ] **Business Shop** (Box & Pallet) → same, for **business sellers**. Payment → **that business**.
- [ ] **Trade Hub** (Pallet & Truck) → **TTAIEMA dropship store**. Splits into **2 cards: B2B + Online**.
  - End-user visitor → **Online** view (retail price). Registered **Supplier** → **B2B** view.
  - Dual price example: **Bullz €0.75 Online / €0.25 B2B**. (retail_price_cents + wholesale tiers
        are ALREADY set on the house brands — mostly wiring.)
  - **All contacts + payments → TTAIEMA account** (the dropship margin).

## 2. "One Supplier — Three Sales Channels" section (chain + Online/Business/Trade rows)
- [ ] Keep the design (liked). Make the 3 rows **redirect**:
  - Online Shop → **retail shops**
  - Business Shop → **suppliers / business**
  - Trade Hub → **TTAIEMA's own profile** (the dropship store)

## 3. "Sell Local → National → Worldwide" step cards (STEP 01–04)
- [ ] Rewrite these to **explain how the system works for the client in their city**:
  - e.g. a **retail shop** redirects end-users to buy from them **via our mini-hub** (a
        **vending machine that serves the goods online — NEXT PROJECT**).
  - Make crystal-clear: **what we do** and **how the system works** at each level.
- NOTE from Zain: full mini-hub/vending-machine details "to send when you start arranging this."

## 4. TTAIEMA company profile (NEW)
- [ ] Create a **TTAIEMA profile/page** that explains our plans:
  **drop shipping, e-commerce**, etc., that **we sell** (with examples), and **redirects to the
  Hub Logistics**. The Trade Hub points here.

## 5. Business Channels section
- [ ] Good as-is. Add a **"Live Channels"** element — a **banner showing active channels /
      WhatsApp groups** (use **TTAI's own channels & groups**).

---

## Suggested build order (high value → lower)
1. **Trade Hub 2-card split (B2B / Online)** + role-based routing + dual pricing wiring. *(Our goods,
   simplest, money to us — biggest immediate win; pricing already modeled.)*
2. **TTAIEMA company profile** page (plans / dropshipping / examples / → Hub Logistics).
3. **Wire the 3 channel cards + the "Three Sales Channels" rows** to their real destinations.
4. **Rewrite the STEP 01–04 cards** to explain the system (await mini-hub details).
5. **Live Channels banner** in the Business Channels section.

## Open items needing Zain's input
- Mini-hub / vending-machine explainer copy (for #3).
- Which channels/groups to feature in the Live Channels banner (#5).
- Marketplace seller payments (Retail/Business shops getting paid directly) = **Stripe Connect**
  onboarding — bigger piece, schedule separately.
