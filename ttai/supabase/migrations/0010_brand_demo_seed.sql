-- ── Brand Profile Demo Seed ─────────────────────────────────────────────────
-- Run this AFTER 0009_brand_profiles.sql and 0006_full_demo_seed.sql
-- Creates one fully-populated brand page you can view at /brand/agrodem-international
-- Safe to run multiple times (cleans up first).

DO $$
DECLARE
  v_supplier_id   UUID;
  v_reviewer1     UUID;
  v_reviewer2     UUID;
  v_reviewer3     UUID;
BEGIN

  -- ── 1. Find the AgroDemo supplier ─────────────────────────────────────────
  SELECT id INTO v_supplier_id
  FROM suppliers
  WHERE trade_name = 'AgroDemo'
  LIMIT 1;

  -- Fallback: grab any supplier if AgroDemo doesn't exist
  IF v_supplier_id IS NULL THEN
    SELECT id INTO v_supplier_id FROM suppliers LIMIT 1;
  END IF;

  IF v_supplier_id IS NULL THEN
    RAISE EXCEPTION 'No suppliers found. Run 0006_full_demo_seed.sql first.';
  END IF;

  -- ── 2. Wipe old brand demo data for this supplier ─────────────────────────
  DELETE FROM brand_gallery        WHERE supplier_id = v_supplier_id;
  DELETE FROM brand_certifications WHERE supplier_id = v_supplier_id;
  DELETE FROM brand_reviews        WHERE supplier_id = v_supplier_id;

  -- ── 3. Update supplier with full brand profile ────────────────────────────
  UPDATE suppliers SET
    brand_slug         = 'agrodem-international',
    tagline            = 'Farm-fresh quality, delivered worldwide since 1998',
    banner_image       = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1400&q=80',
    logo_url           = 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=200&h=200&fit=crop&q=80',
    about_company      = 'AgroDem International is a leading agricultural supplier and food exporter headquartered in Madrid, Spain. Founded in 1998 by the Morales family, we have grown from a regional fresh-produce distributor into a global sourcing partner trusted by supermarket chains, restaurant groups, and food manufacturers across 35 countries.

Our 12,000 m² climate-controlled warehousing facility handles over 4,000 tonnes of produce per month, with same-day dispatch to European ports. We hold exclusive growing contracts with 180+ certified farms across Spain, Morocco, and Turkey, ensuring year-round availability of seasonal items.

We believe in transparent sourcing — every product on our platform includes traceability data right back to the farm, so your customers know exactly where their food comes from.',
    description        = 'Leading agricultural supplier & food exporter. Fresh produce, grains, and processed foods delivered globally from Spain.',
    founded_year       = 1998,
    employee_count     = 340,
    years_experience   = 26,
    countries_served   = 35,
    website            = 'https://example.com',
    phone              = '+34 91 123 4567',
    whatsapp           = '34911234567',
    business_email     = 'trade@agrodem.es',
    working_hours      = 'Monday – Friday: 8:00 AM – 7:00 PM (CET)
Saturday: 9:00 AM – 2:00 PM (CET)
Sunday: Closed',
    google_map_link    = 'https://maps.google.com/?q=Mercamadrid,Madrid,Spain',
    instagram          = 'https://instagram.com',
    facebook           = 'https://facebook.com',
    linkedin           = 'https://linkedin.com',
    twitter            = 'https://x.com',
    youtube            = 'https://youtube.com',
    seo_title          = 'AgroDem International — Fresh Produce & Food Export · TTAI EMA',
    seo_description    = 'Wholesale fresh produce, grains, and processed foods from Spain. 26 years of experience, 35 countries served. Request a quote today on TTAI EMA.',
    seo_keywords       = 'wholesale produce, food export, fresh vegetables, Spanish supplier, bulk grains, agricultural wholesale',
    og_image           = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&h=630&fit=crop&q=80',
    is_featured        = true,
    reliability_tier   = 'GOLD',
    status             = 'ACTIVE',
    badges             = ARRAY['Top Exporter', 'Verified Organic', 'Fast Dispatch'],
    section_visibility = '{"gallery":true,"certifications":true,"documents":true,"reviews":true}',
    address_line1      = 'Calle Mercamadrid, Nave 47',
    postal_code        = '28053'
  WHERE id = v_supplier_id;

  -- ── 4. Gallery (6 images) ──────────────────────────────────────────────────
  INSERT INTO brand_gallery (supplier_id, url, type, caption, sort_order) VALUES
    (v_supplier_id,
     'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
     'image', 'Fresh tomatoes ready for export', 0),
    (v_supplier_id,
     'https://images.unsplash.com/photo-1464297162577-f5295c892194?w=800&q=80',
     'image', 'Our climate-controlled warehouse facility', 1),
    (v_supplier_id,
     'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80',
     'image', 'Harvest season in Valencia', 2),
    (v_supplier_id,
     'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=800&q=80',
     'image', 'Premium olive oil processing line', 3),
    (v_supplier_id,
     'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&q=80',
     'image', 'Quality control team at work', 4),
    (v_supplier_id,
     'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
     'image', 'Loading bay — same-day dispatch', 5);

  -- ── 5. Certifications ─────────────────────────────────────────────────────
  INSERT INTO brand_certifications (supplier_id, title, issuer, issued_date, expiry_date, image_url) VALUES
    (v_supplier_id,
     'ISO 9001:2015 Quality Management',
     'Bureau Veritas',
     '2022-03-15', '2025-03-14',
     'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop&q=80'),
    (v_supplier_id,
     'EU Organic Certification (EC 834/2007)',
     'CAAE — Comité Andaluz de Agricultura Ecológica',
     '2023-01-10', '2026-01-09',
     'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=200&h=200&fit=crop&q=80'),
    (v_supplier_id,
     'GlobalG.A.P. Certified Producer',
     'SGS Group',
     '2023-06-01', '2024-05-31',
     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80'),
    (v_supplier_id,
     'HACCP Food Safety Management',
     'Lloyd''s Register',
     '2021-09-20', '2024-09-19',
     'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop&q=80');

  -- ── 6. Reviews (use first 3 profiles that exist) ──────────────────────────
  SELECT id INTO v_reviewer1 FROM profiles ORDER BY created_at ASC  LIMIT 1 OFFSET 0;
  SELECT id INTO v_reviewer2 FROM profiles ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO v_reviewer3 FROM profiles ORDER BY created_at ASC  LIMIT 1 OFFSET 1;

  -- Insert reviews only when we have distinct users and they're not the supplier owner
  IF v_reviewer1 IS NOT NULL AND v_reviewer1 != (SELECT owner_id FROM suppliers WHERE id = v_supplier_id) THEN
    INSERT INTO brand_reviews
      (supplier_id, user_id, rating, comment, verified_purchase, supplier_reply, replied_at)
    VALUES
      (v_supplier_id, v_reviewer1, 5,
       'Outstanding service and product quality. We have been ordering fresh vegetables from AgroDem for 3 years. Consistent quality, great packaging, and always on time. Highly recommended for any serious buyer.',
       true,
       'Thank you so much for your kind words and continued trust! We look forward to serving you for many more years. 🌾',
       now() - interval '2 days')
    ON CONFLICT (supplier_id, user_id) DO UPDATE
      SET rating = 5,
          comment = EXCLUDED.comment,
          supplier_reply = EXCLUDED.supplier_reply;
  END IF;

  IF v_reviewer2 IS NOT NULL
     AND v_reviewer2 != (SELECT owner_id FROM suppliers WHERE id = v_supplier_id)
     AND v_reviewer2 != v_reviewer1
  THEN
    INSERT INTO brand_reviews
      (supplier_id, user_id, rating, comment, verified_purchase)
    VALUES
      (v_supplier_id, v_reviewer2, 4,
       'Very good supplier overall. Product freshness is excellent and the MOQ is reasonable for mid-sized buyers. Communication was fast and professional. Slight delay in one shipment but they kept us informed throughout.',
       true)
    ON CONFLICT (supplier_id, user_id) DO UPDATE
      SET rating = 4,
          comment = EXCLUDED.comment;
  END IF;

  IF v_reviewer3 IS NOT NULL
     AND v_reviewer3 != (SELECT owner_id FROM suppliers WHERE id = v_supplier_id)
     AND v_reviewer3 != v_reviewer1
     AND v_reviewer3 != v_reviewer2
  THEN
    INSERT INTO brand_reviews
      (supplier_id, user_id, rating, comment, verified_purchase)
    VALUES
      (v_supplier_id, v_reviewer3, 5,
       'Sampled their premium olive oil range — absolutely world class. The traceability documents they provide with each order make compliance straightforward. Will be placing a large bulk order next quarter.',
       false)
    ON CONFLICT (supplier_id, user_id) DO UPDATE
      SET rating = 5,
          comment = EXCLUDED.comment;
  END IF;

  RAISE NOTICE '✅ Brand demo seed complete.';
  RAISE NOTICE '   Supplier ID : %', v_supplier_id;
  RAISE NOTICE '   View page at: /brand/agrodem-international';

END $$;
