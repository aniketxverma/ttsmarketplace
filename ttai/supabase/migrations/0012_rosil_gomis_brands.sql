-- ── Rosil & Gomis — Full Brand Demo Seed ──────────────────────────────────────
-- Creates two complete supplier brand pages with products, gallery, certs,
-- reviews, and POS locations. Safe to run multiple times.
-- Prerequisites: 0004_seed_data.sql · 0009_brand_profiles.sql · 0011_pos_promotions.sql

DO $$
DECLARE
  v_owner        UUID;
  v_reviewer1    UUID;
  v_reviewer2    UUID;
  v_reviewer3    UUID;

  -- Country / City IDs
  v_es   UUID;  v_ae   UUID;
  v_madrid UUID; v_bcn UUID; v_val UUID; v_dubai UUID;

  -- Category IDs
  v_cat_food   UUID;
  v_cat_text   UUID;
  v_cat_health UUID;
  v_sub_olive  UUID;
  v_sub_bev    UUID;
  v_sub_fashion UUID;

  -- Supplier IDs
  v_rosil  UUID;
  v_gomis  UUID;

  -- POS IDs
  v_pos1 UUID; v_pos2 UUID; v_pos3 UUID; v_pos4 UUID;

  -- Product IDs — Rosil
  v_rp1 UUID; v_rp2 UUID; v_rp3 UUID; v_rp4 UUID; v_rp5 UUID; v_rp6 UUID;
  -- Product IDs — Gomis
  v_gp1 UUID; v_gp2 UUID; v_gp3 UUID; v_gp4 UUID; v_gp5 UUID; v_gp6 UUID;

BEGIN

  -- ── 1. Owner & reviewers ───────────────────────────────────────────────────
  SELECT id INTO v_owner     FROM profiles ORDER BY created_at ASC  LIMIT 1 OFFSET 0;
  SELECT id INTO v_reviewer1 FROM profiles ORDER BY created_at ASC  LIMIT 1 OFFSET 0;
  SELECT id INTO v_reviewer2 FROM profiles ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO v_reviewer3 FROM profiles ORDER BY created_at ASC  LIMIT 1 OFFSET 1;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No profiles found — register at least one account first.';
  END IF;

  -- ── 2. Countries ───────────────────────────────────────────────────────────
  SELECT id INTO v_es FROM countries WHERE iso_code = 'ES';
  SELECT id INTO v_ae FROM countries WHERE iso_code = 'AE';

  IF v_es IS NULL THEN
    RAISE EXCEPTION 'Countries not seeded — run 0004_seed_data.sql first.';
  END IF;

  -- ── 3. Cities ──────────────────────────────────────────────────────────────
  INSERT INTO cities (country_id, name, slug, retail_active) VALUES
    (v_es, 'Madrid',    'madrid',    true),
    (v_es, 'Barcelona', 'barcelona', true),
    (v_es, 'Valencia',  'valencia',  true)
  ON CONFLICT (country_id, slug) DO NOTHING;

  SELECT id INTO v_madrid FROM cities WHERE slug = 'madrid'    AND country_id = v_es;
  SELECT id INTO v_bcn    FROM cities WHERE slug = 'barcelona' AND country_id = v_es;
  SELECT id INTO v_val    FROM cities WHERE slug = 'valencia'  AND country_id = v_es;

  IF v_ae IS NOT NULL THEN
    INSERT INTO cities (country_id, name, slug, retail_active)
    VALUES (v_ae, 'Dubai', 'dubai', true) ON CONFLICT (country_id, slug) DO NOTHING;
    SELECT id INTO v_dubai FROM cities WHERE slug = 'dubai' AND country_id = v_ae;
  END IF;

  -- ── 4. Categories ──────────────────────────────────────────────────────────
  SELECT id INTO v_cat_food   FROM categories WHERE slug = 'agriculture-food'   AND parent_id IS NULL;
  SELECT id INTO v_cat_text   FROM categories WHERE slug = 'textiles-apparel'   AND parent_id IS NULL;
  SELECT id INTO v_cat_health FROM categories WHERE slug = 'health-beauty'      AND parent_id IS NULL;

  -- Ensure sub-categories (existence-check pattern — avoids ON CONFLICT (slug) which
  -- fails because the unique constraint on categories is (parent_id, slug) not just (slug))
  IF v_cat_food IS NOT NULL THEN
    SELECT id INTO v_sub_olive FROM categories WHERE slug = 'olive-oil-condiments' AND parent_id = v_cat_food;
    IF v_sub_olive IS NULL THEN
      INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
      VALUES (v_cat_food, 'Olive Oil & Condiments', 'olive-oil-condiments', 'both', 1, 10)
      RETURNING id INTO v_sub_olive;
    END IF;

    SELECT id INTO v_sub_bev FROM categories WHERE slug = 'beverages' AND parent_id = v_cat_food;
    IF v_sub_bev IS NULL THEN
      INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
      VALUES (v_cat_food, 'Beverages', 'beverages', 'both', 1, 3)
      RETURNING id INTO v_sub_bev;
    END IF;
  END IF;

  IF v_cat_text IS NOT NULL THEN
    SELECT id INTO v_sub_fashion FROM categories WHERE slug = 'workwear-uniforms' AND parent_id = v_cat_text;
    IF v_sub_fashion IS NULL THEN
      INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
      VALUES (v_cat_text, 'Workwear & Uniforms', 'workwear-uniforms', 'both', 1, 5)
      RETURNING id INTO v_sub_fashion;
    END IF;
  END IF;

  -- ── 5. Wipe existing Rosil & Gomis data ───────────────────────────────────
  DELETE FROM brand_gallery        WHERE supplier_id IN (SELECT id FROM suppliers WHERE brand_slug IN ('rosil-spain','gomis-export'));
  DELETE FROM brand_certifications WHERE supplier_id IN (SELECT id FROM suppliers WHERE brand_slug IN ('rosil-spain','gomis-export'));
  DELETE FROM brand_reviews        WHERE supplier_id IN (SELECT id FROM suppliers WHERE brand_slug IN ('rosil-spain','gomis-export'));
  DELETE FROM supplier_pos         WHERE supplier_id IN (SELECT id FROM suppliers WHERE brand_slug IN ('rosil-spain','gomis-export'));
  DELETE FROM products             WHERE supplier_id IN (SELECT id FROM suppliers WHERE brand_slug IN ('rosil-spain','gomis-export'));
  DELETE FROM suppliers            WHERE brand_slug  IN ('rosil-spain','gomis-export');

  -- ════════════════════════════════════════════════════════════════════════════
  -- ── ROSIL SPAIN ─────────────────────────────────────────────────────────────
  -- Premium olive oil & Mediterranean food exporter
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO suppliers (
    owner_id, trade_name, legal_name, status, reliability_tier,
    country_id, city_id,
    address_line1, postal_code,
    brand_slug, tagline, logo_url, banner_image,
    description, about_company,
    founded_year, employee_count, years_experience, countries_served,
    website, phone, whatsapp, business_email, working_hours, google_map_link,
    instagram, linkedin, youtube,
    seo_title, seo_description, seo_keywords, og_image,
    is_featured, badges,
    section_visibility,
    verified_at
  ) VALUES (
    v_owner,
    'Rosil Spain',
    'Rosil Export S.L.',
    'ACTIVE', 'GOLD',
    v_es, v_madrid,
    'Calle de Serrano 41, Planta 3', '28001',

    'rosil-spain',
    'Premium olive oil & Mediterranean foods — crafted in Spain, loved worldwide',
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80',

    'Spain''s leading wholesale exporter of extra-virgin olive oil and Mediterranean specialty foods. 28 years supplying supermarket chains, restaurants, and distributors across 42 countries.',
    E'Rosil Spain was born in 1996 from a single olive grove in Jaén, Andalusia — the olive oil capital of the world. Our founder, Rafael Rosil, had a simple belief: the world deserved access to Spain''s finest single-estate olive oils at fair wholesale prices.\n\nToday, Rosil Spain operates from a 22,000 m² production and logistics facility in Madrid with direct supply contracts covering 280 certified farms across Andalusia, Castilla-La Mancha, and Catalonia. We produce over 12,000 tonnes of extra-virgin olive oil annually, alongside a curated range of Spanish vinegars, preserves, olives, and Mediterranean sauces.\n\nEvery bottle leaving our facility carries full traceability documentation — farm GPS coordinates, harvest date, pressing records, and laboratory certifications. Our clients include REWE Group, Carrefour Spain, and over 400 independent distributors across the Middle East, Asia, and the Americas.\n\nAt Rosil Spain, we don''t just export olive oil. We export a tradition.',

    1996, 180, 28, 42,
    'https://example.com',
    '+34 91 700 1234',
    '34917001234',
    'export@rosil.es',
    E'Monday – Friday: 8:30 AM – 6:30 PM (CET)\nSaturday: 9:00 AM – 1:00 PM (CET)\nSunday: Closed',
    'https://maps.google.com/?q=Calle+de+Serrano+41,+Madrid,+Spain',
    'https://instagram.com',
    'https://linkedin.com',
    'https://youtube.com',

    'Rosil Spain — Premium Olive Oil Wholesale Exporter · TTAI EMA',
    'Wholesale extra-virgin olive oil and Mediterranean foods from Spain. Gold-certified supplier. 42 countries served. Request bulk pricing today.',
    'olive oil wholesale, Spanish olive oil, EVOO bulk, Mediterranean food export, Spain supplier',
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1200&h=630&fit=crop&q=80',

    true,
    ARRAY['Gold Supplier', 'Verified Exporter', 'Organic Certified', 'Fast Dispatch'],
    '{"gallery":true,"certifications":true,"documents":true,"reviews":true}',
    now()
  ) RETURNING id INTO v_rosil;

  -- ── Rosil Products (6) ─────────────────────────────────────────────────────
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_rosil, 'Extra Virgin Olive Oil — Premium Single Estate 5L',
     'rosil-evoo-5l',
     'Cold-pressed within 24 hours of harvest. Harvested from century-old Picual trees in Jaén. Acidity < 0.2%. Ideal for wholesale distribution to gourmet retailers and food service.',
     1850, 'EUR', 50, 5000, true, v_sub_olive)
  RETURNING id INTO v_rp1;

  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_rosil, 'Organic Extra Virgin Olive Oil 750ml — EU Certified',
     'rosil-organic-evoo-750ml',
     'EU Organic certified, single-varietal Arbequina from Catalonia. Fruity, mild, perfect for dressings. Available in branded or white-label packaging.',
     490, 'EUR', 200, 20000, true, v_sub_olive)
  RETURNING id INTO v_rp2;

  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_rosil, 'Spanish Sherry Vinegar PDO — 500ml Bottle',
     'rosil-sherry-vinegar-500ml',
     'Protected Designation of Origin Sherry vinegar aged minimum 2 years in American oak barrels. Complex, nutty flavour. MOQ 100 units.',
     380, 'EUR', 100, 8000, true, v_sub_olive)
  RETURNING id INTO v_rp3;

  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_rosil, 'Manzanilla Olives in Brine — 4.25kg Catering Tin',
     'rosil-manzanilla-olives-tin',
     'Hand-picked Manzanilla olives from Seville. Pitted or whole, natural brine or marinated variants. Catering-size tin ideal for food service buyers.',
     620, 'EUR', 48, 3000, true, v_sub_olive)
  RETURNING id INTO v_rp4;

  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_rosil, 'Rosil Premium Gift Set — Olive Oil Tasting Collection',
     'rosil-gift-set-tasting',
     'Curated gift box: 4 × 250ml estate olive oils (Picual, Arbequina, Hojiblanca, Cornicabra). Ideal for corporate gifting, hotel minibars, and premium retail.',
     2200, 'EUR', 24, 500, true, v_sub_olive)
  RETURNING id INTO v_rp5;

  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_rosil, 'Tomato Frito Sauce — Spanish Style 3kg Bulk',
     'rosil-tomato-frito-3kg',
     'Traditional Spanish fried tomato sauce made with sunflower oil, ripe tomatoes, and sea salt. No preservatives. Catering and food-manufacturing pack.',
     540, 'EUR', 60, 4000, true, v_sub_olive)
  RETURNING id INTO v_rp6;

  -- Product images — Rosil
  INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES
    (v_rp1, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80', 0, true),
    (v_rp2, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', 0, true),
    (v_rp3, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', 0, true),
    (v_rp4, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', 0, true),
    (v_rp5, 'https://images.unsplash.com/photo-1611171711912-e3f3c45d04cd?w=600&q=80', 0, true),
    (v_rp6, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80', 0, true);

  -- ── Rosil Gallery (6 images) ───────────────────────────────────────────────
  INSERT INTO brand_gallery (supplier_id, url, type, caption, sort_order) VALUES
    (v_rosil, 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&q=80', 'image', 'Our olive groves in Jaén, Andalusia', 0),
    (v_rosil, 'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=900&q=80', 'image', 'Cold-pressing facility — harvest season', 1),
    (v_rosil, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=900&q=80', 'image', 'Premium estate olive oil collection', 2),
    (v_rosil, 'https://images.unsplash.com/photo-1593252719232-d5b181b4c78d?w=900&q=80', 'image', 'QC lab — every batch tested before dispatch', 3),
    (v_rosil, 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=900&q=80', 'image', 'Madrid export warehouse — 22,000 m²', 4),
    (v_rosil, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80', 'image', 'Rosil gourmet deli, Madrid flagship store', 5);

  -- ── Rosil Certifications ───────────────────────────────────────────────────
  INSERT INTO brand_certifications (supplier_id, title, issuer, issued_date, expiry_date, image_url) VALUES
    (v_rosil, 'EU Organic Certification (EC 834/2007)',
     'CAAE — Comité Andaluz de Agricultura Ecológica',
     '2023-03-01', '2026-02-28',
     'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=200&h=200&fit=crop&q=80'),
    (v_rosil, 'ISO 22000:2018 Food Safety Management',
     'Bureau Veritas Spain',
     '2022-07-15', '2025-07-14',
     'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop&q=80'),
    (v_rosil, 'Protected Designation of Origin — Jaén EVOO',
     'Consejo Regulador DOP Jaén',
     '2018-01-01', NULL,
     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80'),
    (v_rosil, 'BRC Global Standard for Food Safety — Grade AA',
     'SGS Group',
     '2023-10-01', '2024-09-30',
     'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop&q=80');

  -- ── Rosil Reviews ─────────────────────────────────────────────────────────
  IF v_reviewer1 IS NOT NULL THEN
    INSERT INTO brand_reviews (supplier_id, user_id, rating, comment, verified_purchase, supplier_reply, replied_at)
    VALUES (v_rosil, v_reviewer1, 5,
      'We''ve been importing Rosil''s EVOO into our UAE distribution network for 4 years. Consistent quality batch after batch — the Picual single-estate is exceptional. Documentation is always complete and the Madrid team responds within the hour.',
      true,
      'Thank you for your continued partnership! The UAE market is incredibly important to us and we''re proud to supply such a discerning distribution network. Looking forward to another great season! 🫒',
      now() - interval '5 days')
    ON CONFLICT (supplier_id, user_id) DO UPDATE
      SET rating = 5, comment = EXCLUDED.comment, supplier_reply = EXCLUDED.supplier_reply;
  END IF;

  IF v_reviewer2 IS NOT NULL AND v_reviewer2 != v_reviewer1 THEN
    INSERT INTO brand_reviews (supplier_id, user_id, rating, comment, verified_purchase)
    VALUES (v_rosil, v_reviewer2, 5,
      'Placed our first trial order of 500 units Arbequina 750ml. The product quality far exceeded what we expected at this price point. The white-label packaging option is a huge plus for our private label range. Already submitted repeat order.',
      true)
    ON CONFLICT (supplier_id, user_id) DO UPDATE SET rating = 5, comment = EXCLUDED.comment;
  END IF;

  IF v_reviewer3 IS NOT NULL AND v_reviewer3 != v_reviewer1 AND v_reviewer3 != v_reviewer2 THEN
    INSERT INTO brand_reviews (supplier_id, user_id, rating, comment, verified_purchase)
    VALUES (v_rosil, v_reviewer3, 4,
      'Excellent range and very professional export team. Lead times were accurate and products arrived well-packaged with full traceability certificates. Slightly longer response time during August (holiday season) but that''s understandable for Spain.',
      false)
    ON CONFLICT (supplier_id, user_id) DO UPDATE SET rating = 4, comment = EXCLUDED.comment;
  END IF;

  -- ── Rosil POS (2 locations) ────────────────────────────────────────────────
  -- Madrid HQ
  INSERT INTO supplier_pos (supplier_id, name, type, status, is_public, sort_order)
  VALUES (v_rosil, 'Rosil Madrid — Head Office & Showroom', 'shop', 'active', true, 0)
  RETURNING id INTO v_pos1;

  INSERT INTO pos_locations (pos_id, address_line1, city, region, postal_code, country, latitude, longitude)
  VALUES (v_pos1, 'Calle de Serrano 41, Planta 3', 'Madrid', 'Community of Madrid', '28001', 'Spain', 40.4296, -3.6872);

  INSERT INTO pos_details (pos_id, manager_name, phone, whatsapp, email,
    accepts_walk_ins, accepts_orders, services_offered, notes,
    opening_hours)
  VALUES (v_pos1, 'Carmen Rosil', '+34 91 700 1234', '34917001234', 'madrid@rosil.es',
    true, true,
    ARRAY['Samples', 'Bulk Orders', 'Export Docs', 'Walk-in Viewing'],
    'Showroom with full product range. Scheduled visits preferred for large orders.',
    '{"monday":{"open":"08:30","close":"18:30","closed":false},"tuesday":{"open":"08:30","close":"18:30","closed":false},"wednesday":{"open":"08:30","close":"18:30","closed":false},"thursday":{"open":"08:30","close":"18:30","closed":false},"friday":{"open":"08:30","close":"17:00","closed":false},"saturday":{"open":"09:00","close":"13:00","closed":false},"sunday":{"open":"","close":"","closed":true}}');

  -- Barcelona export hub
  INSERT INTO supplier_pos (supplier_id, name, type, status, is_public, sort_order)
  VALUES (v_rosil, 'Rosil Barcelona — Port Export Hub', 'export_hub', 'active', true, 1)
  RETURNING id INTO v_pos2;

  INSERT INTO pos_locations (pos_id, address_line1, city, region, postal_code, country, latitude, longitude)
  VALUES (v_pos2, 'Zona Franca, Carrer C, Nave 18', 'Barcelona', 'Catalonia', '08040', 'Spain', 41.3388, 2.1504);

  INSERT INTO pos_details (pos_id, manager_name, phone, whatsapp, email,
    accepts_walk_ins, accepts_orders, services_offered, notes,
    opening_hours)
  VALUES (v_pos2, 'Javier Mora', '+34 93 800 5500', '34938005500', 'barcelona@rosil.es',
    false, true,
    ARRAY['Pickup', 'Bulk Orders', 'Export Docs'],
    'Export warehouse and container loading. No walk-in sales. Pre-booked appointments only.',
    '{"monday":{"open":"07:00","close":"19:00","closed":false},"tuesday":{"open":"07:00","close":"19:00","closed":false},"wednesday":{"open":"07:00","close":"19:00","closed":false},"thursday":{"open":"07:00","close":"19:00","closed":false},"friday":{"open":"07:00","close":"17:00","closed":false},"saturday":{"open":"08:00","close":"12:00","closed":false},"sunday":{"open":"","close":"","closed":true}}');

  -- Supplier regions for Rosil
  INSERT INTO supplier_regions (supplier_id, region_key) VALUES
    (v_rosil, 'middle-east'),
    (v_rosil, 'europe'),
    (v_rosil, 'north-africa')
  ON CONFLICT (supplier_id, region_key) DO NOTHING;

  RAISE NOTICE '✅ Rosil Spain created — /brand/rosil-spain';

  -- ════════════════════════════════════════════════════════════════════════════
  -- ── GOMIS EXPORT ────────────────────────────────────────────────────────────
  -- Professional workwear & textile manufacturer/exporter
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO suppliers (
    owner_id, trade_name, legal_name, status, reliability_tier,
    country_id, city_id,
    address_line1, postal_code,
    brand_slug, tagline, logo_url, banner_image,
    description, about_company,
    founded_year, employee_count, years_experience, countries_served,
    website, phone, whatsapp, business_email, working_hours, google_map_link,
    instagram, facebook, linkedin,
    seo_title, seo_description, seo_keywords, og_image,
    is_featured, badges,
    section_visibility,
    verified_at
  ) VALUES (
    v_owner,
    'Gomis Export',
    'Textiles Gomis Export S.A.',
    'ACTIVE', 'SILVER',
    v_es, v_val,
    'Polígono Industrial La Pascualeta, Nave 7', '46910',

    'gomis-export',
    'Professional workwear & technical textiles — made in Valencia, shipped globally',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558171813-2f8aa03e04bd?w=1400&q=80',

    'Valencia-based manufacturer of professional workwear, hospitality uniforms, and technical textiles. 1,200+ B2B clients across 28 countries. MOQ from 50 units.',
    E'Gomis Export was founded in 1988 by the Gomis family in Valencia, Spain''s textile heartland. What started as a small workshop producing workwear for local factories has grown into one of Spain''s most trusted wholesale uniform and professional clothing exporters.\n\nToday, our 8,500 m² production facility runs three shifts, producing over 850,000 garments per year. We serve hotels, restaurants, hospitals, construction companies, logistics firms, and retail chains across Europe, the Middle East, and North Africa.\n\nWhat sets Gomis apart is our full-cycle capability: design, cut, stitch, print, embroider, and dispatch — all under one roof. This means shorter lead times (14–21 days for standard orders), strict quality control at every stage, and the flexibility to create fully custom branded collections from as few as 50 pieces.\n\nWe are proud partners of several Michelin-starred restaurant groups and 4- and 5-star hotel chains who trust Gomis for their front-of-house image. Our technical workwear division also supplies EN-certified protective clothing for industrial and construction clients.',

    1988, 420, 36, 28,
    'https://example.com',
    '+34 96 210 3800',
    '34962103800',
    'sales@gomisexport.com',
    E'Monday – Thursday: 8:00 AM – 5:30 PM (CET)\nFriday: 8:00 AM – 3:00 PM (CET)\nSaturday–Sunday: Closed',
    'https://maps.google.com/?q=Valencia+Polígono+Industrial,Spain',
    'https://instagram.com',
    'https://facebook.com',
    'https://linkedin.com',

    'Gomis Export — Professional Workwear & Uniforms from Spain · TTAI EMA',
    'Wholesale workwear, hospitality uniforms, and technical textiles from Valencia, Spain. Custom branding available. MOQ 50 units. 36 years experience.',
    'workwear wholesale, hotel uniforms, restaurant uniforms, Spain textile exporter, professional clothing bulk, custom uniform manufacturer',
    'https://images.unsplash.com/photo-1558171813-2f8aa03e04bd?w=1200&h=630&fit=crop&q=80',

    true,
    ARRAY['Verified Supplier', 'Custom Branding', 'Fast Production'],
    '{"gallery":true,"certifications":true,"documents":true,"reviews":true}',
    now()
  ) RETURNING id INTO v_gomis;

  -- ── Gomis Products (6) ─────────────────────────────────────────────────────
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_gomis, 'Chef Jacket — Classic White Long Sleeve',
     'gomis-chef-jacket-white',
     'Professional kitchen jacket in 65/35 poly-cotton, double-breasted, knotted buttons. Available in XS–4XL. Custom embroidery from 50 units. EN 13688 compliant.',
     1890, 'EUR', 50, 3000, true, v_sub_fashion)
  RETURNING id INTO v_gp1;

  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_gomis, 'Hotel Housekeeping Uniform Set — Polo + Trousers',
     'gomis-hotel-housekeeping-set',
     'Complete housekeeping uniform: moisture-wicking polo shirt + tailored trousers with reinforced pockets. Available in 12 standard colours. Custom logo included from 100 sets.',
     3450, 'EUR', 100, 2000, true, v_sub_fashion)
  RETURNING id INTO v_gp2;

  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_gomis, 'Hi-Vis Safety Jacket — EN ISO 20471 Class 3',
     'gomis-hivis-jacket-en20471',
     'High-visibility reflective jacket meeting EN ISO 20471 Class 3. Waterproof outer shell, quilted lining, multiple pockets. Construction, logistics, and roadworks certified.',
     4200, 'EUR', 50, 1500, true, v_sub_fashion)
  RETURNING id INTO v_gp3;

  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_gomis, 'Restaurant Waiter Apron — Bistro Style',
     'gomis-waiter-apron-bistro',
     'Classic French bistro apron, 70% cotton 30% linen blend. Double cross-back ties. Three colour options (black, navy, stone). Embroidery pocket available.',
     890, 'EUR', 100, 5000, true, v_sub_fashion)
  RETURNING id INTO v_gp4;

  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_gomis, 'Corporate Polo Shirt — Custom Logo Print',
     'gomis-corporate-polo-custom',
     '220 g/m² piqué cotton-polyester polo. Available in 24 standard colours. Full-colour sublimation print or embroidered logo. 14-day production. Sizes XS–5XL.',
     1250, 'EUR', 50, 10000, true, v_sub_fashion)
  RETURNING id INTO v_gp5;

  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, category_id)
  VALUES
    (v_gomis, 'Medical Scrub Set — Unisex Stretch Fabric',
     'gomis-medical-scrub-set',
     'Comfortable 4-way stretch scrub top and trousers. Anti-bacterial, fluid-resistant fabric. Hospital and clinic standard. Colour-coded department options.',
     2800, 'EUR', 50, 4000, true, v_sub_fashion)
  RETURNING id INTO v_gp6;

  -- Product images — Gomis
  INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES
    (v_gp1, 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&q=80', 0, true),
    (v_gp2, 'https://images.unsplash.com/photo-1583394293214-0b3b3b3b3b3b?w=600&q=80', 0, true),
    (v_gp3, 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80', 0, true),
    (v_gp4, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', 0, true),
    (v_gp5, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80', 0, true),
    (v_gp6, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80', 0, true);

  -- ── Gomis Gallery (6 images) ───────────────────────────────────────────────
  INSERT INTO brand_gallery (supplier_id, url, type, caption, sort_order) VALUES
    (v_gomis, 'https://images.unsplash.com/photo-1558171813-2f8aa03e04bd?w=900&q=80', 'image', 'Production floor — Valencia facility', 0),
    (v_gomis, 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=900&q=80', 'image', 'Chef jacket collection — Spring/Summer', 1),
    (v_gomis, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80', 'image', 'Hotel dining room wearing Gomis uniforms', 2),
    (v_gomis, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80', 'image', 'Custom logo embroidery station', 3),
    (v_gomis, 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&q=80', 'image', 'Hi-vis and PPE range for industrial clients', 4),
    (v_gomis, 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=900&q=80', 'image', 'Export dispatch — 850,000 garments/year', 5);

  -- ── Gomis Certifications ───────────────────────────────────────────────────
  INSERT INTO brand_certifications (supplier_id, title, issuer, issued_date, expiry_date, image_url) VALUES
    (v_gomis, 'ISO 9001:2015 Quality Management System',
     'AENOR — Asociación Española de Normalización',
     '2021-05-10', '2024-05-09',
     'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop&q=80'),
    (v_gomis, 'OEKO-TEX Standard 100 — Harmful Substances Free',
     'OEKO-TEX Association',
     '2023-01-15', '2025-01-14',
     'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=200&h=200&fit=crop&q=80'),
    (v_gomis, 'EN ISO 20471 Personal Protective Equipment',
     'Instituto Nacional de Seguridad e Higiene en el Trabajo',
     '2022-09-01', '2025-08-31',
     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80');

  -- ── Gomis Reviews ─────────────────────────────────────────────────────────
  IF v_reviewer1 IS NOT NULL THEN
    INSERT INTO brand_reviews (supplier_id, user_id, rating, comment, verified_purchase, supplier_reply, replied_at)
    VALUES (v_gomis, v_reviewer1, 5,
      'We outfit all 320 staff across our 4 hotels with Gomis uniforms — front desk, housekeeping, restaurant, and spa. The quality is consistent, custom embroidery looks sharp, and they always hit the 21-day delivery window. Genuinely one of our best supplier relationships.',
      true,
      'It''s a privilege to dress your teams! We take pride in helping hotels present a unified, professional image. Looking forward to the new collection launch next season. 🙏',
      now() - interval '3 days')
    ON CONFLICT (supplier_id, user_id) DO UPDATE
      SET rating = 5, comment = EXCLUDED.comment, supplier_reply = EXCLUDED.supplier_reply;
  END IF;

  IF v_reviewer2 IS NOT NULL AND v_reviewer2 != v_reviewer1 THEN
    INSERT INTO brand_reviews (supplier_id, user_id, rating, comment, verified_purchase)
    VALUES (v_gomis, v_reviewer2, 4,
      'Ordered 200 chef jackets and 150 aprons for our restaurant group. The fabric quality is excellent and the sizing runs true. Only minor feedback: the darker navy colour had a slight tonal variation between batches — Gomis resolved it immediately with a replacement run. Great after-service.',
      true)
    ON CONFLICT (supplier_id, user_id) DO UPDATE SET rating = 4, comment = EXCLUDED.comment;
  END IF;

  IF v_reviewer3 IS NOT NULL AND v_reviewer3 != v_reviewer1 AND v_reviewer3 != v_reviewer2 THEN
    INSERT INTO brand_reviews (supplier_id, user_id, rating, comment, verified_purchase)
    VALUES (v_gomis, v_reviewer3, 5,
      'Corporate polo shirts for 600 employees — delivered on time, exactly as sampled, with all 600 names/departments embroidered. Price was very competitive versus Turkish and Chinese alternatives and we got the EU-made quality we needed for our brand image.',
      false)
    ON CONFLICT (supplier_id, user_id) DO UPDATE SET rating = 5, comment = EXCLUDED.comment;
  END IF;

  -- ── Gomis POS (2 locations) ────────────────────────────────────────────────
  -- Valencia factory/showroom
  INSERT INTO supplier_pos (supplier_id, name, type, status, is_public, sort_order)
  VALUES (v_gomis, 'Gomis Valencia — Factory & Trade Showroom', 'warehouse', 'active', true, 0)
  RETURNING id INTO v_pos3;

  INSERT INTO pos_locations (pos_id, address_line1, city, region, postal_code, country, latitude, longitude)
  VALUES (v_pos3, 'Polígono Industrial La Pascualeta, Nave 7', 'Valencia', 'Valencian Community', '46910', 'Spain', 39.4561, -0.3823);

  INSERT INTO pos_details (pos_id, manager_name, phone, whatsapp, email,
    accepts_walk_ins, accepts_orders, services_offered, notes,
    opening_hours)
  VALUES (v_pos3, 'Marcos Gomis', '+34 96 210 3800', '34962103800', 'valencia@gomisexport.com',
    true, true,
    ARRAY['Samples', 'Bulk Orders', 'Walk-in Viewing', 'Returns', 'Export Docs'],
    'Factory showroom open to trade buyers. Full sample room available. Minimum scheduled visit recommended.',
    '{"monday":{"open":"08:00","close":"17:30","closed":false},"tuesday":{"open":"08:00","close":"17:30","closed":false},"wednesday":{"open":"08:00","close":"17:30","closed":false},"thursday":{"open":"08:00","close":"17:30","closed":false},"friday":{"open":"08:00","close":"15:00","closed":false},"saturday":{"open":"","close":"","closed":true},"sunday":{"open":"","close":"","closed":true}}');

  -- Madrid agent office
  INSERT INTO supplier_pos (supplier_id, name, type, status, is_public, sort_order)
  VALUES (v_gomis, 'Gomis Madrid — Trade Agent Office', 'agent_office', 'active', true, 1)
  RETURNING id INTO v_pos4;

  INSERT INTO pos_locations (pos_id, address_line1, city, region, postal_code, country, latitude, longitude)
  VALUES (v_pos4, 'Calle Alcalá 141, Oficina 6B', 'Madrid', 'Community of Madrid', '28009', 'Spain', 40.4275, -3.6867);

  INSERT INTO pos_details (pos_id, manager_name, phone, whatsapp, email,
    accepts_walk_ins, accepts_orders, services_offered, notes,
    opening_hours)
  VALUES (v_pos4, 'Laura Sánchez', '+34 91 500 2200', '34915002200', 'madrid@gomisexport.com',
    true, false,
    ARRAY['Samples', 'Walk-in Viewing'],
    'Sales agent office for Central Spain accounts. Samples and catalogues available.',
    '{"monday":{"open":"09:00","close":"18:00","closed":false},"tuesday":{"open":"09:00","close":"18:00","closed":false},"wednesday":{"open":"09:00","close":"18:00","closed":false},"thursday":{"open":"09:00","close":"18:00","closed":false},"friday":{"open":"09:00","close":"15:00","closed":false},"saturday":{"open":"","close":"","closed":true},"sunday":{"open":"","close":"","closed":true}}');

  -- Supplier regions for Gomis
  INSERT INTO supplier_regions (supplier_id, region_key) VALUES
    (v_gomis, 'europe'),
    (v_gomis, 'middle-east'),
    (v_gomis, 'north-africa')
  ON CONFLICT (supplier_id, region_key) DO NOTHING;

  RAISE NOTICE '✅ Gomis Export created — /brand/gomis-export';
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════';
  RAISE NOTICE '  Rosil Spain  →  /brand/rosil-spain';
  RAISE NOTICE '  Gomis Export →  /brand/gomis-export';
  RAISE NOTICE '══════════════════════════════════════════';

END $$;
