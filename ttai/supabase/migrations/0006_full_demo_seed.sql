-- ─── FULL DEMO SEED v1 — 5 suppliers · 52 products · 10 categories ───────────
-- Safe to run multiple times. Cleans up all demo data then recreates it.
-- Requires: at least one registered profile + 0004_seed_data.sql

DO $$
DECLARE
  v_owner        UUID;

  -- Country IDs
  v_es UUID; v_de UUID; v_tr UUID; v_ae UUID; v_fr UUID; v_it UUID;

  -- City IDs
  v_madrid UUID; v_barcelona UUID; v_valencia UUID;

  -- Supplier IDs
  v_sup_agro   UUID;
  v_sup_tech   UUID;
  v_sup_fash   UUID;
  v_sup_build  UUID;
  v_sup_well   UUID;
  v_sup_casa   UUID;

  -- Root category IDs
  v_cat_food    UUID;
  v_cat_text    UUID;
  v_cat_elec    UUID;
  v_cat_const   UUID;
  v_cat_health  UUID;
  v_cat_auto    UUID;
  v_cat_home    UUID;
  v_cat_indus   UUID;
  v_cat_sport   UUID;
  v_cat_office  UUID;

  -- Sub-category IDs (Agriculture & Food)
  v_sub_fresh   UUID;
  v_sub_proc    UUID;
  v_sub_bev     UUID;
  v_sub_grain   UUID;

BEGIN

  -- ── 1. Resolve owner ───────────────────────────────────────────────────────
  SELECT id INTO v_owner FROM profiles ORDER BY created_at LIMIT 1;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No profiles found. Register at least one account first.';
  END IF;

  -- ── 2. Resolve countries ───────────────────────────────────────────────────
  SELECT id INTO v_es FROM countries WHERE iso_code = 'ES';
  SELECT id INTO v_de FROM countries WHERE iso_code = 'DE';
  SELECT id INTO v_tr FROM countries WHERE iso_code = 'TR';
  SELECT id INTO v_ae FROM countries WHERE iso_code = 'AE';
  SELECT id INTO v_fr FROM countries WHERE iso_code = 'FR';
  SELECT id INTO v_it FROM countries WHERE iso_code = 'IT';

  IF v_es IS NULL THEN
    RAISE EXCEPTION 'Countries not found. Run 0004_seed_data.sql first.';
  END IF;

  -- ── 3. Ensure cities ───────────────────────────────────────────────────────
  INSERT INTO cities (country_id, name, slug, retail_active) VALUES
    (v_es, 'Madrid',    'madrid',    true),
    (v_es, 'Barcelona', 'barcelona', true),
    (v_es, 'Valencia',  'valencia',  true)
  ON CONFLICT (country_id, slug) DO NOTHING;

  SELECT id INTO v_madrid    FROM cities WHERE slug = 'madrid'    AND country_id = v_es;
  SELECT id INTO v_barcelona FROM cities WHERE slug = 'barcelona' AND country_id = v_es;
  SELECT id INTO v_valencia  FROM cities WHERE slug = 'valencia'  AND country_id = v_es;

  -- ── 4. Resolve categories ──────────────────────────────────────────────────
  SELECT id INTO v_cat_food   FROM categories WHERE slug = 'agriculture-food'       AND parent_id IS NULL;
  SELECT id INTO v_cat_text   FROM categories WHERE slug = 'textiles-apparel'       AND parent_id IS NULL;
  SELECT id INTO v_cat_elec   FROM categories WHERE slug = 'electronics-technology' AND parent_id IS NULL;
  SELECT id INTO v_cat_const  FROM categories WHERE slug = 'construction-materials' AND parent_id IS NULL;
  SELECT id INTO v_cat_health FROM categories WHERE slug = 'health-beauty'          AND parent_id IS NULL;
  SELECT id INTO v_cat_auto   FROM categories WHERE slug = 'automotive-transport'   AND parent_id IS NULL;
  SELECT id INTO v_cat_home   FROM categories WHERE slug = 'home-garden'            AND parent_id IS NULL;
  SELECT id INTO v_cat_indus  FROM categories WHERE slug = 'industrial-machinery'   AND parent_id IS NULL;
  SELECT id INTO v_cat_sport  FROM categories WHERE slug = 'sports-leisure'         AND parent_id IS NULL;
  SELECT id INTO v_cat_office FROM categories WHERE slug = 'office-stationery'      AND parent_id IS NULL;

  -- Sub-categories
  SELECT id INTO v_sub_fresh FROM categories WHERE slug = 'fresh-produce';
  SELECT id INTO v_sub_proc  FROM categories WHERE slug = 'processed-foods';
  SELECT id INTO v_sub_bev   FROM categories WHERE slug = 'beverages';
  SELECT id INTO v_sub_grain FROM categories WHERE slug = 'grains-cereals';

  -- Create any missing sub-categories
  IF v_sub_fresh IS NULL THEN
    INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
    VALUES (v_cat_food, 'Fresh Produce', 'fresh-produce', 'both', 1, 1) RETURNING id INTO v_sub_fresh;
  END IF;
  IF v_sub_proc IS NULL THEN
    INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
    VALUES (v_cat_food, 'Processed Foods', 'processed-foods', 'both', 1, 2) RETURNING id INTO v_sub_proc;
  END IF;
  IF v_sub_bev IS NULL THEN
    INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
    VALUES (v_cat_food, 'Beverages', 'beverages', 'both', 1, 3) RETURNING id INTO v_sub_bev;
  END IF;
  IF v_sub_grain IS NULL THEN
    INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
    VALUES (v_cat_food, 'Grains & Cereals', 'grains-cereals', 'both', 1, 4) RETURNING id INTO v_sub_grain;
  END IF;

  -- ── 5. Wipe all existing demo data ────────────────────────────────────────
  DELETE FROM product_images WHERE product_id IN (
    SELECT p.id FROM products p
    JOIN suppliers s ON s.id = p.supplier_id
    WHERE s.trade_name IN ('AgroDemo','TechZone','FashionHub','BuildPro','WellnessPlus','CasaStile')
  );
  DELETE FROM products WHERE supplier_id IN (
    SELECT id FROM suppliers WHERE trade_name IN ('AgroDemo','TechZone','FashionHub','BuildPro','WellnessPlus','CasaStile')
  );
  DELETE FROM suppliers WHERE trade_name IN ('AgroDemo','TechZone','FashionHub','BuildPro','WellnessPlus','CasaStile');

  -- ── 6. Create 6 suppliers ─────────────────────────────────────────────────

  INSERT INTO suppliers (owner_id, legal_name, trade_name, tax_id, country_id, city_id, address_line1, postal_code, status, reliability_tier, marketplace_context, description)
  VALUES (v_owner, 'AgroDemo España SL', 'AgroDemo', 'B12345678', v_es, v_madrid, 'Calle Alcalá 45', '28014', 'ACTIVE', 'GOLD', 'both', 'Certified organic producer supplying premium Spanish agricultural products to B2B buyers across the EU since 2005. ISO 9001 certified. Cold-chain logistics available.')
  RETURNING id INTO v_sup_agro;

  INSERT INTO suppliers (owner_id, legal_name, trade_name, tax_id, country_id, city_id, address_line1, postal_code, status, reliability_tier, marketplace_context, description)
  VALUES (v_owner, 'TechZone GmbH', 'TechZone', 'DE987654321', v_de, NULL, 'Frankfurter Allee 110', '10247', 'ACTIVE', 'SILVER', 'wholesale', 'Leading German electronics distributor with 15 years of experience supplying consumer electronics and industrial tech components to retailers and OEMs across Europe and the Middle East.')
  RETURNING id INTO v_sup_tech;

  INSERT INTO suppliers (owner_id, legal_name, trade_name, tax_id, country_id, city_id, address_line1, postal_code, status, reliability_tier, marketplace_context, description)
  VALUES (v_owner, 'FashionHub Tekstil A.Ş.', 'FashionHub', 'TR5678901234', v_tr, NULL, 'Atatürk Bulvarı 22', '34000', 'ACTIVE', 'GOLD', 'both', 'Turkish textiles manufacturer with three production facilities. Specialises in cotton, denim, and synthetic fabrics for European fashion brands and global retailers. OEKO-TEX certified.')
  RETURNING id INTO v_sup_fash;

  INSERT INTO suppliers (owner_id, legal_name, trade_name, tax_id, country_id, city_id, address_line1, postal_code, status, reliability_tier, marketplace_context, description)
  VALUES (v_owner, 'BuildPro Trading LLC', 'BuildPro', 'AE1122334455', v_ae, NULL, 'Jebel Ali Free Zone, Block 7', '00000', 'ACTIVE', 'SILVER', 'wholesale', 'Dubai-based construction materials and industrial equipment supplier. Serving major infrastructure and real estate projects across the Middle East and North Africa since 2010.')
  RETURNING id INTO v_sup_build;

  INSERT INTO suppliers (owner_id, legal_name, trade_name, tax_id, country_id, city_id, address_line1, postal_code, status, reliability_tier, marketplace_context, description)
  VALUES (v_owner, 'WellnessPlus SAS', 'WellnessPlus', 'FR9988776655', v_fr, NULL, 'Avenue des Champs-Élysées 72', '75008', 'ACTIVE', 'BRONZE', 'both', 'French wellness and cosmetics group producing premium health, beauty, and sports nutrition products. All formulas EU-compliant and dermatologically tested.')
  RETURNING id INTO v_sup_well;

  INSERT INTO suppliers (owner_id, legal_name, trade_name, tax_id, country_id, city_id, address_line1, postal_code, status, reliability_tier, marketplace_context, description)
  VALUES (v_owner, 'CasaStile SpA', 'CasaStile', 'IT3344556677', v_it, NULL, 'Via Montenapoleone 8', '20121', 'ACTIVE', 'BRONZE', 'both', 'Italian home furnishings and office solutions manufacturer. Design-led products combining Italian craftsmanship with functional innovation. Exported to 30+ countries.')
  RETURNING id INTO v_sup_casa;

  -- ── 7. Insert 52 products ─────────────────────────────────────────────────

  INSERT INTO products (supplier_id, category_id, marketplace_context, city_id, name, slug, description, sku, price_cents, currency_code, min_order_qty, stock_qty, is_published, vat_rate)
  VALUES
  -- ══ AGRODEMO — Agriculture & Food (10 products) ══════════════════════════
  (v_sup_agro, v_sub_fresh, 'both', v_madrid,
   'Organic Beefsteak Tomatoes',
   'demo-agro-tomatoes',
   'Premium organic beefsteak tomatoes from Valencia greenhouses. Rich in lycopene, harvested at peak ripeness. Available year-round.',
   'AGR-001', 280, 'EUR', 50, 2400, true, 10),

  (v_sup_agro, v_sub_fresh, 'wholesale', NULL,
   'Spanish Red Bell Peppers (10 kg)',
   'demo-agro-peppers',
   'Grade A export-quality red bell peppers packed in 10 kg crates. Ideal for food processors and wholesalers.',
   'AGR-002', 1850, 'EUR', 10, 800, true, 10),

  (v_sup_agro, v_sub_fresh, 'both', v_valencia,
   'Valencian Navel Oranges (5 kg)',
   'demo-agro-oranges',
   'Hand-picked seedless navel oranges from certified organic orchards in Valencia. Perfect for fresh juice or retail.',
   'AGR-003', 650, 'EUR', 20, 3500, true, 10),

  (v_sup_agro, v_sub_proc, 'both', v_madrid,
   'Extra Virgin Olive Oil (5 L tin)',
   'demo-agro-evoo',
   'Cold-pressed EVOO from Jaén province. Single-estate, low acidity <0.2%. PDO certified. Perfect for gourmet retail.',
   'AGR-004', 2490, 'EUR', 6, 450, true, 10),

  (v_sup_agro, v_sub_grain, 'wholesale', NULL,
   'Castile Durum Wheat (1 tonne bag)',
   'demo-agro-wheat',
   'High-protein durum wheat from Castilla-La Mancha. Protein ≥14%. For pasta and flour milling. Fumigated and moisture-tested.',
   'AGR-005', 28000, 'EUR', 1, 85, true, 10),

  (v_sup_agro, v_sub_bev, 'both', v_barcelona,
   'Spanish Tempranillo Red Wine (12 btl)',
   'demo-agro-wine',
   'Crianza-grade Tempranillo from Rioja. 12-bottle case. 13.5% ABV. Ideal for wholesale hospitality or premium retail.',
   'AGR-006', 9600, 'EUR', 5, 320, true, 21),

  (v_sup_agro, v_sub_fresh, 'both', v_madrid,
   'Baby Spinach Leaves (500 g)',
   'demo-agro-spinach',
   'Triple-washed fresh baby spinach. Air-cooled post-harvest for extended shelf life. Retail bags or 5 kg catering packs.',
   'AGR-007', 320, 'EUR', 30, 1800, true, 10),

  (v_sup_agro, v_sub_proc, 'wholesale', NULL,
   'Raw Wildflower Honey (25 kg drum)',
   'demo-agro-honey',
   'Unfiltered Spanish wildflower honey. 25 kg food-grade drum. Certificate of origin included. Perfect for food manufacturing.',
   'AGR-008', 18500, 'EUR', 2, 140, true, 10),

  (v_sup_agro, v_sub_bev, 'both', v_barcelona,
   'Cold Brew Coffee Concentrate (6× 1 L)',
   'demo-agro-coffee',
   '100% Arabica cold brew concentrate. 6× 1-litre bottles. Ready to dilute 1:4. Ideal for cafés and retail.',
   'AGR-009', 7200, 'EUR', 6, 600, true, 10),

  (v_sup_agro, v_sub_fresh, 'wholesale', NULL,
   'Huelva Strawberries (4 kg flat)',
   'demo-agro-strawberries',
   'World-famous Huelva strawberries. Firm, fragrant, 4 kg retail flats. 12-month supply contract available.',
   'AGR-010', 1240, 'EUR', 20, 1200, true, 10),

  -- ══ TECHZONE — Electronics & Technology (9 products) ════════════════════
  (v_sup_tech, v_cat_elec, 'wholesale', NULL,
   'Business Laptop 15" i7 16GB (10-unit pallet)',
   'demo-tech-laptop',
   '15-inch Full HD IPS, Intel Core i7 12th gen, 16 GB RAM, 512 GB NVMe SSD. Windows 11 Pro. Minimum 10-unit B2B pallet.',
   'TEC-001', 89900, 'EUR', 10, 150, true, 19),

  (v_sup_tech, v_cat_elec, 'wholesale', NULL,
   'Android Smartphone 6.7" 128GB (Bulk)',
   'demo-tech-smartphone',
   'Unlocked Android smartphone. 6.7" AMOLED, 50 MP triple camera, 5000 mAh battery. Available in black and white.',
   'TEC-002', 24900, 'EUR', 20, 500, true, 19),

  (v_sup_tech, v_cat_elec, 'both', NULL,
   'Wireless Noise-Cancelling Headphones',
   'demo-tech-headphones',
   'Over-ear ANC headphones. 40-hour battery, Bluetooth 5.3, USB-C charging, foldable design. CE certified.',
   'TEC-003', 8900, 'EUR', 5, 800, true, 19),

  (v_sup_tech, v_cat_elec, 'wholesale', NULL,
   'Smart LED TV 55" 4K UHD (6-unit pallet)',
   'demo-tech-tv',
   '55-inch 4K UHD Smart TV. HDR10, WiFi, Bluetooth, 3× HDMI. Pre-installed streaming apps. 6-unit wholesale pallet.',
   'TEC-004', 42000, 'EUR', 6, 90, true, 19),

  (v_sup_tech, v_cat_elec, 'both', NULL,
   'USB-C 10-Port Docking Station',
   'demo-tech-dock',
   '10-in-1 USB-C hub. 4K HDMI, 100W PD, Gigabit LAN, 4× USB-A, SD card. Plug-and-play, no driver needed.',
   'TEC-005', 4900, 'EUR', 10, 1200, true, 19),

  (v_sup_tech, v_cat_elec, 'wholesale', NULL,
   'Industrial IP Camera 4MP PoE (20-unit)',
   'demo-tech-camera',
   '4MP IP security camera. Night vision 30 m, IP67 weatherproof, PoE, H.265+ compression. ONVIF compatible.',
   'TEC-006', 19800, 'EUR', 20, 400, true, 19),

  (v_sup_tech, v_cat_elec, 'both', NULL,
   'Smart Watch Fitness Tracker (Retail Box)',
   'demo-tech-watch',
   '1.96" AMOLED, GPS, heart rate, SpO2, sleep tracking. 7-day battery. IP68 waterproof. iOS & Android.',
   'TEC-007', 5900, 'EUR', 10, 900, true, 19),

  (v_sup_tech, v_cat_elec, 'wholesale', NULL,
   'Solar Panel 400W Monocrystalline (Pallet/10)',
   'demo-tech-solar',
   '400W monocrystalline solar panel. 21.4% efficiency, 25-year performance warranty. IEC 61215 certified.',
   'TEC-008', 58000, 'EUR', 10, 200, true, 19),

  (v_sup_tech, v_cat_elec, 'both', NULL,
   'Wireless Mechanical Keyboard + Mouse Set',
   'demo-tech-keyboard',
   'TKL wireless mechanical keyboard (brown switches) + 6-button silent mouse. 2.4 GHz dongle. Multi-device.',
   'TEC-009', 5400, 'EUR', 10, 650, true, 19),

  -- ══ FASHIONHUB — Textiles & Apparel (8 products) ════════════════════════
  (v_sup_fash, v_cat_text, 'wholesale', NULL,
   'Premium Cotton Fabric Roll (50 m)',
   'demo-fash-cotton',
   '100% combed cotton, 200 GSM. 150 cm wide. Available in 40 stock colours. OEKO-TEX Standard 100 certified.',
   'FAS-001', 18500, 'EUR', 5, 600, true, 20),

  (v_sup_fash, v_cat_text, 'wholesale', NULL,
   'Stretch Denim Fabric Roll (30 m)',
   'demo-fash-denim',
   '98% cotton / 2% elastane denim. 11 oz weight, 145 cm wide. Ideal for jeans, jackets and workwear.',
   'FAS-002', 22000, 'EUR', 3, 420, true, 20),

  (v_sup_fash, v_cat_text, 'both', NULL,
   'Organic Cotton T-Shirts (Pack of 12)',
   'demo-fash-tshirts',
   'Unisex 180 GSM organic cotton tees. Sizes XS–3XL. Pre-shrunk, ribbed collar. Available blank or print-ready.',
   'FAS-003', 3600, 'EUR', 5, 3000, true, 20),

  (v_sup_fash, v_cat_text, 'wholesale', NULL,
   'Men\'s Business Suit (MOQ 50 units)',
   'demo-fash-suits',
   'Slim-fit 2-piece suit. 70% polyester / 30% viscose. Sizes 46–58. Multiple colourways. Private label available.',
   'FAS-004', 14900, 'EUR', 50, 800, true, 20),

  (v_sup_fash, v_cat_text, 'wholesale', NULL,
   'High-Vis Workwear Jacket (MOQ 100)',
   'demo-fash-hivis',
   'EN ISO 20471 Class 2 high-visibility jacket. Waterproof 3000 mm, taped seams, reflective strips. Sizes S–5XL.',
   'FAS-005', 2800, 'EUR', 100, 5000, true, 20),

  (v_sup_fash, v_cat_text, 'both', NULL,
   'Luxury Bath Towel Set (6 pcs)',
   'demo-fash-towels',
   '600 GSM 100% Turkish cotton. Set: 2 bath towels + 2 hand towels + 2 face cloths. 12 colour options.',
   'FAS-006', 4200, 'EUR', 10, 2000, true, 20),

  (v_sup_fash, v_cat_text, 'wholesale', NULL,
   'Sports Performance Fabric (40 m roll)',
   'demo-fash-sport-fabric',
   '4-way stretch polyester/spandex 200 GSM. Moisture-wicking, UPF 50+. 150 cm wide. For activewear production.',
   'FAS-007', 16800, 'EUR', 3, 350, true, 20),

  (v_sup_fash, v_cat_text, 'wholesale', NULL,
   'Linen Upholstery Fabric (30 m roll)',
   'demo-fash-linen',
   '55% linen / 45% cotton blend. 320 GSM upholstery weight. 140 cm wide. Fire-retardant treatment available.',
   'FAS-008', 25500, 'EUR', 3, 280, true, 20),

  -- ══ BUILDPRO — Construction & Materials + Industrial (9 products) ════════
  (v_sup_build, v_cat_const, 'wholesale', NULL,
   'Structural Steel I-Beam S275 (6 m)',
   'demo-build-steel-beam',
   'Hot-rolled S275 steel I-beam, 200×100 mm section. 6 m standard length. Mill certificate included. MOQ 10 pieces.',
   'BLD-001', 28900, 'EUR', 10, 300, true, 5),

  (v_sup_build, v_cat_const, 'wholesale', NULL,
   'Portland Cement 42.5N (50-bag pallet)',
   'demo-build-cement',
   'CEM I 42.5N Portland cement. 25 kg bags, 50-bag pallet = 1.25 tonnes. EN 197-1 certified. UAE origin.',
   'BLD-002', 42000, 'EUR', 1, 500, true, 5),

  (v_sup_build, v_cat_const, 'wholesale', NULL,
   'Ceramic Floor Tiles 60×60 cm (Pallet)',
   'demo-build-tiles',
   'Polished porcelain floor tile 60×60 cm, 10 mm thick. R9 slip resistance. 48 tiles per pallet = 17.28 m².',
   'BLD-003', 38500, 'EUR', 2, 800, true, 5),

  (v_sup_build, v_cat_const, 'wholesale', NULL,
   'HDPE Water Pipe PN16 110mm (100 m coil)',
   'demo-build-pipe',
   'HDPE pressure pipe 110 mm OD, PN16 rating. ISO 4427 certified. UV-stabilised black. 100 m coil.',
   'BLD-004', 62000, 'EUR', 1, 120, true, 5),

  (v_sup_build, v_cat_const, 'wholesale', NULL,
   'Tempered Safety Glass Panel 2400×1200 mm',
   'demo-build-glass',
   '10 mm tempered safety glass. 2400×1200 mm standard size. EN 12150 certified. Available in clear, tinted, frosted.',
   'BLD-005', 18900, 'EUR', 10, 400, true, 5),

  (v_sup_build, v_cat_indus, 'wholesale', NULL,
   'Industrial Air Compressor 500L 7.5kW',
   'demo-build-compressor',
   '7.5 kW belt-driven reciprocating compressor. 500-litre receiver, 10-bar max. 400V 3-phase. CE marked.',
   'BLD-006', 245000, 'EUR', 1, 30, true, 5),

  (v_sup_build, v_cat_indus, 'wholesale', NULL,
   'Electric Forklift 3-Tonne (Warehouse)',
   'demo-build-forklift',
   '3-tonne electric counterbalance forklift. 48V lithium battery, 5 m lift height. Side-shift standard.',
   'BLD-007', 2490000, 'EUR', 1, 8, true, 5),

  (v_sup_build, v_cat_auto, 'wholesale', NULL,
   'Heavy-Duty Truck Tyres 315/80 R22.5 (Set/4)',
   'demo-build-tyres',
   'Commercial truck tyre 315/80 R22.5. Load index 156/150. M+S rated. Set of 4. Drive axle pattern.',
   'BLD-008', 88000, 'EUR', 5, 200, true, 5),

  (v_sup_build, v_cat_auto, 'wholesale', NULL,
   'Generator Set 100 kVA Diesel (Open Frame)',
   'demo-build-generator',
   '100 kVA / 80 kW diesel generator. Perkins engine, 400V 3-phase, 50 Hz. Brushless alternator. CE certified.',
   'BLD-009', 1250000, 'EUR', 1, 15, true, 5),

  -- ══ WELLNESSPLUS — Health, Beauty & Sports (8 products) ═════════════════
  (v_sup_well, v_cat_health, 'both', NULL,
   'Vitamin D3 + K2 Softgels (360 caps, bulk)',
   'demo-well-vitamind',
   '2000 IU Vitamin D3 + 75 mcg K2 MK-7 per softgel. 360-cap bulk bottle for private label. EU-compliant formula.',
   'WEL-001', 3200, 'EUR', 24, 5000, true, 20),

  (v_sup_well, v_cat_health, 'both', NULL,
   'Organic Argan Oil 100 ml (12-unit box)',
   'demo-well-argan',
   '100% pure cold-pressed Moroccan argan oil. 12× 100 ml bottles per box. Ecocert certified. For hair & skin.',
   'WEL-002', 8400, 'EUR', 6, 2000, true, 20),

  (v_sup_well, v_cat_health, 'wholesale', NULL,
   'Professional Collagen Powder 500g (24-unit)',
   'demo-well-collagen',
   'Hydrolysed marine collagen type I & III. 10g serving, 50 servings per tub. Unflavoured. Wholesale 24-tub case.',
   'WEL-003', 19200, 'EUR', 1, 1200, true, 20),

  (v_sup_well, v_cat_health, 'both', NULL,
   'SPF 50+ Sunscreen Lotion 200 ml (6-unit)',
   'demo-well-sunscreen',
   'Broad-spectrum UVA/UVB SPF 50+ lotion. Water-resistant 80 min. Fragrance-free. Dermatologically tested.',
   'WEL-004', 4800, 'EUR', 6, 3500, true, 20),

  (v_sup_well, v_cat_health, 'both', NULL,
   'Natural Charcoal Facial Mask (50 ml × 24)',
   'demo-well-mask',
   'Detoxifying activated charcoal clay mask. 24× 50 ml jars per case. Vegan, cruelty-free, EU-compliant.',
   'WEL-005', 5760, 'EUR', 6, 4000, true, 20),

  (v_sup_well, v_cat_sport, 'both', NULL,
   'Yoga & Fitness Mat 6mm Non-Slip (10-unit)',
   'demo-well-yogamat',
   '6 mm TPE eco yoga mat. 183× 61 cm. Non-slip texture both sides. Carrying strap included. 10 assorted colours.',
   'WEL-006', 5900, 'EUR', 10, 2500, true, 20),

  (v_sup_well, v_cat_sport, 'wholesale', NULL,
   'Adjustable Dumbbell Set 5–32 kg (Pair)',
   'demo-well-dumbbells',
   'Rapid-adjust dumbbell pair. 5–32 kg in 2 kg increments. Chrome steel with rubberised grip. Storage tray included.',
   'WEL-007', 34900, 'EUR', 5, 400, true, 20),

  (v_sup_well, v_cat_sport, 'both', NULL,
   'Whey Protein Isolate 2kg (Vanilla)',
   'demo-well-protein',
   '90% protein content. 2 kg resealable pouch. Vanilla flavour. <1g sugar per serving. Informed Sport certified.',
   'WEL-008', 5400, 'EUR', 12, 3000, true, 20),

  -- ══ CASASTILE — Home, Garden & Office (8 products) ══════════════════════
  (v_sup_casa, v_cat_home, 'both', NULL,
   'Modular Bookshelf Unit 200× 80 cm',
   'demo-casa-shelf',
   'Solid pine modular bookshelf. 200 cm H × 80 cm W × 28 cm D. 5 adjustable shelves. Flat-pack, easy assembly.',
   'CAS-001', 18900, 'EUR', 5, 800, true, 22),

  (v_sup_casa, v_cat_home, 'both', NULL,
   'Stainless Steel Cookware Set (10 pcs)',
   'demo-casa-cookware',
   '18/10 stainless steel. 10-piece set: 4 pots + 4 lids + 2 frying pans. Induction compatible. Dishwasher safe.',
   'CAS-002', 14500, 'EUR', 5, 600, true, 22),

  (v_sup_casa, v_cat_home, 'both', NULL,
   'LED Floor Lamp Dimmable 150 cm',
   'demo-casa-lamp',
   '24W LED integrated arc floor lamp. 3000–6500 K CCT adjustable, touch dimmer, USB-A charging port. Matte black.',
   'CAS-003', 8900, 'EUR', 10, 1200, true, 22),

  (v_sup_casa, v_cat_home, 'wholesale', NULL,
   'Garden Irrigation Drip Kit (100-plant)',
   'demo-casa-irrigation',
   'Complete drip irrigation kit for 100 plants. Pressure compensating emitters, 50 m main tube, timer valve.',
   'CAS-004', 12400, 'EUR', 5, 500, true, 22),

  (v_sup_casa, v_cat_home, 'both', NULL,
   'Handwoven Wool Area Rug 200×300 cm',
   'demo-casa-rug',
   'Hand-knotted 100% New Zealand wool rug. 200×300 cm. Geometric pattern. Available in 6 colourways.',
   'CAS-005', 48900, 'EUR', 2, 150, true, 22),

  (v_sup_casa, v_cat_office, 'both', NULL,
   'Ergonomic Office Chair (Mesh Back)',
   'demo-casa-chair',
   'Adjustable lumbar support, breathable mesh back, 4D armrests, seat depth adjustment. EN 1335 compliant.',
   'CAS-006', 32900, 'EUR', 5, 400, true, 22),

  (v_sup_casa, v_cat_office, 'both', NULL,
   'A4 Premium Copy Paper 80gsm (5-ream box)',
   'demo-casa-paper',
   'FSC-certified 80 gsm A4 copy paper. 500 sheets/ream, 5 reams/box = 2500 sheets. Laser & inkjet compatible.',
   'CAS-007', 1490, 'EUR', 20, 10000, true, 22),

  (v_sup_casa, v_cat_office, 'both', NULL,
   'Height-Adjustable Standing Desk 160×80 cm',
   'demo-casa-desk',
   'Electric sit-stand desk. 160×80 cm solid wood top. 70–120 cm height range, 4 memory presets, anti-collision.',
   'CAS-008', 69900, 'EUR', 2, 200, true, 22);

  -- ── 8. Insert product images ───────────────────────────────────────────────
  INSERT INTO product_images (product_id, url, sort_order)
  SELECT p.id, img.url, img.sort_order
  FROM products p
  JOIN (VALUES
    -- AgroDemo
    ('demo-agro-tomatoes',     'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&q=80', 0),
    ('demo-agro-tomatoes',     'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=800&q=80', 1),
    ('demo-agro-peppers',      'https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?w=800&q=80', 0),
    ('demo-agro-peppers',      'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&q=80', 1),
    ('demo-agro-oranges',      'https://images.unsplash.com/photo-1547514701-42782101795e?w=800&q=80', 0),
    ('demo-agro-oranges',      'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=800&q=80', 1),
    ('demo-agro-evoo',         'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80', 0),
    ('demo-agro-evoo',         'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=800&q=80', 1),
    ('demo-agro-wheat',        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80', 0),
    ('demo-agro-wine',         'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80', 0),
    ('demo-agro-wine',         'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80', 1),
    ('demo-agro-spinach',      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80', 0),
    ('demo-agro-honey',        'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80', 0),
    ('demo-agro-honey',        'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80', 1),
    ('demo-agro-coffee',       'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80', 0),
    ('demo-agro-coffee',       'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', 1),
    ('demo-agro-strawberries', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80', 0),
    ('demo-agro-strawberries', 'https://images.unsplash.com/photo-1518635017498-87f514b751ba?w=800&q=80', 1),
    -- TechZone
    ('demo-tech-laptop',       'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80', 0),
    ('demo-tech-laptop',       'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80', 1),
    ('demo-tech-smartphone',   'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', 0),
    ('demo-tech-smartphone',   'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80', 1),
    ('demo-tech-headphones',   'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 0),
    ('demo-tech-headphones',   'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80', 1),
    ('demo-tech-tv',           'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=80', 0),
    ('demo-tech-dock',         'https://images.unsplash.com/photo-1558126319-c9feecbf57ee?w=800&q=80', 0),
    ('demo-tech-camera',       'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', 0),
    ('demo-tech-watch',        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 0),
    ('demo-tech-watch',        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80', 1),
    ('demo-tech-solar',        'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 0),
    ('demo-tech-keyboard',     'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80', 0),
    -- FashionHub
    ('demo-fash-cotton',       'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80', 0),
    ('demo-fash-denim',        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80', 0),
    ('demo-fash-denim',        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 1),
    ('demo-fash-tshirts',      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80', 0),
    ('demo-fash-tshirts',      'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80', 1),
    ('demo-fash-suits',        'https://images.unsplash.com/photo-1490725263030-1f0521cec8ec?w=800&q=80', 0),
    ('demo-fash-hivis',        'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=800&q=80', 0),
    ('demo-fash-towels',       'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80', 0),
    ('demo-fash-sport-fabric', 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80', 0),
    ('demo-fash-linen',        'https://images.unsplash.com/photo-1586495777744-4e6232bf2e34?w=800&q=80', 0),
    -- BuildPro
    ('demo-build-steel-beam',  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', 0),
    ('demo-build-cement',      'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80', 0),
    ('demo-build-tiles',       'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80', 0),
    ('demo-build-tiles',       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', 1),
    ('demo-build-pipe',        'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80', 0),
    ('demo-build-glass',       'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80', 0),
    ('demo-build-compressor',  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', 0),
    ('demo-build-forklift',    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80', 0),
    ('demo-build-tyres',       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', 0),
    ('demo-build-generator',   'https://images.unsplash.com/photo-1558983359-112ca43ef33a?w=800&q=80', 0),
    -- WellnessPlus
    ('demo-well-vitamind',     'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80', 0),
    ('demo-well-argan',        'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80', 0),
    ('demo-well-argan',        'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80', 1),
    ('demo-well-collagen',     'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', 0),
    ('demo-well-sunscreen',    'https://images.unsplash.com/photo-1526758097130-bab247274f58?w=800&q=80', 0),
    ('demo-well-mask',         'https://images.unsplash.com/photo-1586495781513-cf647c1d0e31?w=800&q=80', 0),
    ('demo-well-yogamat',      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', 0),
    ('demo-well-yogamat',      'https://images.unsplash.com/photo-1601925228508-6498662f1778?w=800&q=80', 1),
    ('demo-well-dumbbells',    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 0),
    ('demo-well-dumbbells',    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', 1),
    ('demo-well-protein',      'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&q=80', 0),
    -- CasaStile
    ('demo-casa-shelf',        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', 0),
    ('demo-casa-shelf',        'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800&q=80', 1),
    ('demo-casa-cookware',     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', 0),
    ('demo-casa-cookware',     'https://images.unsplash.com/photo-1584990347449-39ce7cf8c22f?w=800&q=80', 1),
    ('demo-casa-lamp',         'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&q=80', 0),
    ('demo-casa-lamp',         'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80', 1),
    ('demo-casa-irrigation',   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80', 0),
    ('demo-casa-rug',          'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=80', 0),
    ('demo-casa-rug',          'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&q=80', 1),
    ('demo-casa-chair',        'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80', 0),
    ('demo-casa-chair',        'https://images.unsplash.com/photo-1596162954151-cdcb4c0f70a8?w=800&q=80', 1),
    ('demo-casa-paper',        'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80', 0),
    ('demo-casa-desk',         'https://images.unsplash.com/photo-1484820540004-14229fe36ca4?w=800&q=80', 0),
    ('demo-casa-desk',         'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80', 1)
  ) AS img(slug, url, sort_order) ON p.slug = img.slug
  WHERE p.supplier_id IN (v_sup_agro, v_sup_tech, v_sup_fash, v_sup_build, v_sup_well, v_sup_casa);

  RAISE NOTICE 'Full demo seed complete: 6 suppliers, 52 products with images across all 10 categories.';

END $$;
