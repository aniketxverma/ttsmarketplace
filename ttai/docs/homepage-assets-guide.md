# Homepage Assets Guide — 3D Renders & Logos

This explains how to get the **3 marketplace 3D renders** and the **payment/logistics
logos**, and where to put them so they drop straight into the homepage.

When you have the files, just say **"assets are in"** and I'll swap them into the
code (replacing the current icon/text placeholders).

---

## 1. The three marketplace 3D renders

These are the images inside the **Retail / Business / Trade Hub** cards.

**Specs (important — keeps them consistent):**
- **Transparent background** (PNG).
- Square-ish, ~1000×1000 px.
- **3D / isometric product render**, soft studio lighting, clean, no text.
- Slightly top-down ("hero") angle, single object centered.

### Option A — Make them with AI (easiest)
Use **ChatGPT (GPT‑4o image / DALL·E 3)**, **Midjourney**, **Leonardo.ai**, or **Adobe Firefly**.
Paste these prompts (one per image):

**Retail card →** `retail.png`
> 3D isometric render of a shopping trolley filled with stacked brown cardboard
> parcels, glossy clean studio look, soft shadows, transparent background, e‑commerce
> hero product render, high detail, centered, no text, no logo

**Business card →** `business.png`
> 3D isometric render of a wooden shipping pallet stacked with brown cardboard boxes,
> neatly wrapped, clean studio lighting, soft shadows, transparent background, logistics
> hero render, high detail, centered, no text, no logo

**Trade Hub card →** `trade.png`
> 3D render of a modern orange semi‑truck with a shipping container trailer, three‑quarter
> front view, clean studio lighting, soft shadows, transparent background, freight hero
> render, high detail, centered, no text, no logo

**Tips**
- If the tool can't do transparent backgrounds, generate on a plain white/grey
  background and remove it free at **remove.bg** or **photoroom.com**.
- Ask for variations until the style of all three matches (same lighting/angle).

### Option B — Grab ready-made 3D assets (free)
- **iconscout.com/3d-illustrations** (search "shopping cart", "pallet", "delivery truck")
- **icons8.com/3d-icons**
- **freepik.com** (3D section) — check license/attribution.

### Where to put them
```
ttai/public/brand/renders/retail.png
ttai/public/brand/renders/business.png
ttai/public/brand/renders/trade.png
```

---

## 2. Payment & logistics logos (SVG)

The strip: **stripe · wise · VISA · mastercard · PayPal · DHL · GLS · FedEx**.

### Best sources (official + clean SVGs)
- **simpleicons.org** — single‑color brand SVGs for almost all of these (search the name).
  Direct: `https://cdn.simpleicons.org/stripe`, `/visa`, `/mastercard`, `/paypal`,
  `/dhl`, `/fedex`, `/wise`. (GLS may not be on Simple Icons — see below.)
- **worldvectorlogo.com** — full‑color official logos (search "Visa", "DHL", "GLS"…).
- **svgporn.com** / **vectorlogo.zone** — developer logo packs.
- **Official brand/press pages** (most accurate, recommended for real brands):
  - Stripe: stripe.com/newsroom/brand-assets
  - Visa: visa.com → brand center
  - Mastercard: brand.mastercard.com
  - PayPal: paypal.com → brand/logo center
  - DHL: dpdhl-brands.com
  - FedEx: fedex.com → about → brand
  - GLS: gls-group.com (press/brand)
  - Wise: wise.com/brand

> Note: these are trademarks. Showing "we accept / partner with" payment & courier
> logos is standard, but use the **official** versions and don't recolor/distort them.

### Where to put them
```
ttai/public/brand/logos/stripe.svg
ttai/public/brand/logos/wise.svg
ttai/public/brand/logos/visa.svg
ttai/public/brand/logos/mastercard.svg
ttai/public/brand/logos/paypal.svg
ttai/public/brand/logos/dhl.svg
ttai/public/brand/logos/gls.svg
ttai/public/brand/logos/fedex.svg
```

---

## 3. Optional extras

- **Hero globe** — currently an Unsplash "earth at night" photo. To replace with your
  own render, save as `ttai/public/brand/hero-globe.png` (wide, ~1600px) and tell me.
- **Brand logos for "Trusted Suppliers & Brands"** — if you have real logos for
  DOBOS DOBOS, ROZIL, etc., drop them in `ttai/public/brand/suppliers/<name>.png` and
  I'll show them instead of the initials.

---

## 4. Checklist

- [ ] renders/retail.png  (transparent)
- [ ] renders/business.png
- [ ] renders/trade.png
- [ ] logos/stripe.svg, wise.svg, visa.svg, mastercard.svg, paypal.svg, dhl.svg, gls.svg, fedex.svg
- [ ] (optional) hero-globe.png
- [ ] (optional) supplier logos

Drop them in `ttai/public/brand/...` with the **exact names above**, then tell me —
I'll wire them into the cards and the payment strip so it matches the mockup 1:1.
