-- ─── DEMO SEED v2 — safe to run multiple times ───────────────────────────────
-- Deletes and recreates all AgroDemo data on each run.
-- Requires: at least one registered account + countries from 0004_seed_data.sql

DO $$
DECLARE
  v_owner_id    UUID;
  v_country_id  UUID;
  v_city_id     UUID;
  v_supplier_id UUID;
  v_cat_fresh   UUID;
  v_cat_grain   UUID;
  v_cat_oil     UUID;
BEGIN

  -- ── 1. Resolve owner and country ─────────────────────────────────────────
  SELECT id INTO v_owner_id FROM profiles ORDER BY created_at LIMIT 1;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'No profiles found. Register at least one account first.';
  END IF;

  SELECT id INTO v_country_id FROM countries WHERE iso_code = 'ES';
  IF v_country_id IS NULL THEN
    RAISE EXCEPTION 'Country ES not found. Run 0004_seed_data.sql first.';
  END IF;

  -- ── 2. Ensure Madrid exists ───────────────────────────────────────────────
  INSERT INTO cities (country_id, name, slug, retail_active)
  VALUES (v_country_id, 'Madrid', 'madrid', true)
  ON CONFLICT (country_id, slug) DO NOTHING;
  SELECT id INTO v_city_id FROM cities WHERE slug = 'madrid' AND country_id = v_country_id;

  -- ── 3. Ensure demo categories exist (get or create) ──────────────────────
  -- Fresh produce (may already exist from base seed as 'fresh-produce')
  SELECT id INTO v_cat_fresh FROM categories WHERE slug = 'fresh-produce' LIMIT 1;
  IF v_cat_fresh IS NULL THEN
    INSERT INTO categories (name, slug, marketplace_context, depth, sort_order)
    VALUES ('Fresh Produce', 'fresh-produce', 'both', 0, 1)
    RETURNING id INTO v_cat_fresh;
  END IF;

  -- Grains (may already exist as 'grains-cereals')
  SELECT id INTO v_cat_grain FROM categories WHERE slug IN ('grains-cereals', 'grain-cereals') LIMIT 1;
  IF v_cat_grain IS NULL THEN
    INSERT INTO categories (name, slug, marketplace_context, depth, sort_order)
    VALUES ('Grains & Cereals', 'grains-cereals', 'wholesale', 0, 2)
    RETURNING id INTO v_cat_grain;
  END IF;

  -- Oils / processed (may already exist as 'processed-foods')
  SELECT id INTO v_cat_oil FROM categories WHERE slug IN ('processed-foods', 'olive-oil') LIMIT 1;
  IF v_cat_oil IS NULL THEN
    INSERT INTO categories (name, slug, marketplace_context, depth, sort_order)
    VALUES ('Processed Foods', 'processed-foods', 'both', 0, 3)
    RETURNING id INTO v_cat_oil;
  END IF;

  -- ── 4. Wipe existing AgroDemo data cleanly ───────────────────────────────
  DELETE FROM product_images
  WHERE product_id IN (
    SELECT p.id FROM products p
    JOIN suppliers s ON s.id = p.supplier_id
    WHERE s.trade_name = 'AgroDemo'
  );
  DELETE FROM products
  WHERE supplier_id IN (SELECT id FROM suppliers WHERE trade_name = 'AgroDemo');
  DELETE FROM suppliers WHERE trade_name = 'AgroDemo';

  -- ── 5. Create the demo supplier ──────────────────────────────────────────
  INSERT INTO suppliers (
    owner_id, legal_name, trade_name, tax_id,
    country_id, city_id, address_line1, postal_code,
    status, reliability_tier, marketplace_context, description
  ) VALUES (
    v_owner_id,
    'AgroDemo España SL',
    'AgroDemo',
    'B12345678',
    v_country_id, v_city_id,
    'Calle Alcalá 45, Madrid',
    '28014',
    'ACTIVE',
    'GOLD',
    'both',
    'Certified organic producer supplying premium Spanish agricultural products to B2B buyers across the EU since 2005. ISO 9001 certified. Cold-chain logistics included.'
  )
  RETURNING id INTO v_supplier_id;

  -- ── 6. Insert 8 demo products ─────────────────────────────────────────────
  INSERT INTO products (
    supplier_id, category_id, marketplace_context, city_id,
    name, slug, description, sku,
    price_cents, currency_code, min_order_qty, stock_qty,
    is_published, vat_rate
  ) VALUES
    (v_supplier_id, v_cat_fresh, 'both',      v_city_id,
     'Organic Beefsteak Tomatoes',
     'agrodemo-tomatoes-001',
     'Premium organic beefsteak tomatoes grown in the Valencia region. Rich in lycopene, harvested at peak ripeness. Available year-round from our climate-controlled greenhouses.',
     'TOM-001', 280, 'EUR', 50, 2400, true, 10),

    (v_supplier_id, v_cat_fresh, 'wholesale', NULL,
     'Spanish Red Bell Peppers (10kg)',
     'agrodemo-peppers-002',
     'Sweet crisp red bell peppers, Grade A export quality. Packed in 10kg crates. Ideal for food processors, restaurants, and wholesalers.',
     'PEP-002', 1850, 'EUR', 10, 800, true, 10),

    (v_supplier_id, v_cat_fresh, 'both',      v_city_id,
     'Valencian Navel Oranges (5kg)',
     'agrodemo-oranges-003',
     'Hand-picked navel oranges from certified organic orchards in Valencia. Seedless, sweet and juicy. Perfect for fresh juice or retail display.',
     'ORA-003', 650, 'EUR', 20, 3500, true, 10),

    (v_supplier_id, v_cat_fresh, 'wholesale', NULL,
     'Huelva Strawberries (4kg flat)',
     'agrodemo-strawberries-004',
     'World-famous Huelva strawberries. Firm, fragrant and sweet. 4kg retail flats, 12-month supply contract available. Shelf life 7 days refrigerated.',
     'STR-004', 1240, 'EUR', 20, 1200, true, 10),

    (v_supplier_id, v_cat_oil,   'both',      v_city_id,
     'Extra Virgin Olive Oil (5L tin)',
     'agrodemo-evoo-005',
     'Cold-pressed EVOO from Jaén province. Single-estate, low acidity (<0.2%). PDO certified. Ideal for gourmet retail or food service bulk supply.',
     'OIL-005', 2490, 'EUR', 6, 450, true, 10),

    (v_supplier_id, v_cat_grain, 'wholesale', NULL,
     'Castile Durum Wheat (1 tonne bag)',
     'agrodemo-wheat-006',
     'High-protein durum wheat from Castilla-La Mancha. Protein ≥14%. Suitable for pasta, semolina and flour milling. Fumigated and moisture-tested.',
     'WHT-006', 28000, 'EUR', 1, 85, true, 10),

    (v_supplier_id, v_cat_fresh, 'both',      v_city_id,
     'Baby Spinach Leaves (500g bags)',
     'agrodemo-spinach-007',
     'Fresh baby spinach, triple-washed, ready to eat. Air-cooled post-harvest for extended shelf life. Available in retail bags or 5kg catering packs.',
     'SPN-007', 320, 'EUR', 30, 1800, true, 10),

    (v_supplier_id, v_cat_fresh, 'both',      v_city_id,
     'Almería Greenhouse Cucumbers',
     'agrodemo-cucumbers-008',
     'Long English-type cucumbers from Almería hothouses. Uniform calibre, shrink-wrapped. Grown under IPM (integrated pest management). Year-round availability.',
     'CUC-008', 180, 'EUR', 100, 5000, true, 10);

  -- ── 7. Insert product images (join on slug — no UUID variables needed) ────
  INSERT INTO product_images (product_id, url, sort_order)
  SELECT p.id, img.url, img.sort_order
  FROM products p
  JOIN (VALUES
    ('agrodemo-tomatoes-001',     'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&q=80', 0),
    ('agrodemo-tomatoes-001',     'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=800&q=80', 1),
    ('agrodemo-peppers-002',      'https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?w=800&q=80', 0),
    ('agrodemo-peppers-002',      'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&q=80', 1),
    ('agrodemo-oranges-003',      'https://images.unsplash.com/photo-1547514701-42782101795e?w=800&q=80', 0),
    ('agrodemo-oranges-003',      'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=800&q=80', 1),
    ('agrodemo-strawberries-004', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80', 0),
    ('agrodemo-strawberries-004', 'https://images.unsplash.com/photo-1518635017498-87f514b751ba?w=800&q=80', 1),
    ('agrodemo-evoo-005',         'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80', 0),
    ('agrodemo-evoo-005',         'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=800&q=80', 1),
    ('agrodemo-wheat-006',        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80', 0),
    ('agrodemo-spinach-007',      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80', 0),
    ('agrodemo-spinach-007',      'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800&q=80', 1),
    ('agrodemo-cucumbers-008',    'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80', 0)
  ) AS img(slug, url, sort_order) ON p.slug = img.slug
  WHERE p.supplier_id = v_supplier_id;

  RAISE NOTICE 'Demo seed complete. Supplier ID: %. 8 products with images inserted.', v_supplier_id;
END $$;
