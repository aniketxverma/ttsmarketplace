-- ── Químicas Rozaf S.L.U. / Rozil Brand — Full Seed ────────────────────────
-- Real brand data. Images uploaded to Supabase storage via scripts/upload-rozil-images.js
-- Safe to run multiple times (wipes then re-inserts Rozil).
-- Prerequisites: 0004_seed_data.sql · 0009_brand_profiles.sql · 0011_pos_promotions.sql

DO $$
DECLARE
  v_owner        UUID;
  v_reviewer1    UUID;
  v_reviewer2    UUID;

  -- Country / City IDs
  v_es     UUID;
  v_malaga UUID;

  -- Category IDs
  v_cat_home     UUID;  -- Home & Garden (root)
  v_sub_cleaning UUID;  -- Cleaning Products (sub)
  v_cat_health   UUID;  -- Health & Beauty (root)
  v_sub_personal UUID;  -- Personal Care (sub)

  -- Supplier ID
  v_rozil UUID;

  -- POS ID
  v_pos1 UUID;

  -- Product IDs (14 products)
  v_p01 UUID; v_p02 UUID; v_p03 UUID; v_p04 UUID; v_p05 UUID; v_p06 UUID; v_p07 UUID;
  v_p08 UUID; v_p09 UUID; v_p10 UUID; v_p11 UUID; v_p12 UUID; v_p13 UUID; v_p14 UUID;

  -- Supabase storage base URL (public bucket: brand-assets)
  v_img TEXT := 'https://vtjtrbdyotsnautbqadi.supabase.co/storage/v1/object/public/brand-assets/rozil';

BEGIN

  -- ── 1. Owner & reviewers ─────────────────────────────────────────────────
  SELECT id INTO v_owner     FROM profiles ORDER BY created_at ASC LIMIT 1 OFFSET 0;
  SELECT id INTO v_reviewer1 FROM profiles ORDER BY created_at ASC LIMIT 1 OFFSET 0;
  SELECT id INTO v_reviewer2 FROM profiles ORDER BY created_at DESC LIMIT 1 OFFSET 0;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No profiles found — register at least one account first.';
  END IF;

  -- ── 2. Country & city ────────────────────────────────────────────────────
  SELECT id INTO v_es FROM countries WHERE iso_code = 'ES';
  IF v_es IS NULL THEN
    RAISE EXCEPTION 'Countries not seeded — run 0004_seed_data.sql first.';
  END IF;

  -- Málaga is in seed data
  SELECT id INTO v_malaga FROM cities WHERE slug = 'malaga' AND country_id = v_es;
  IF v_malaga IS NULL THEN
    INSERT INTO cities (country_id, name, slug, retail_active)
    VALUES (v_es, 'Málaga', 'malaga', true)
    RETURNING id INTO v_malaga;
  END IF;

  -- ── 3. Categories ────────────────────────────────────────────────────────
  SELECT id INTO v_cat_home FROM categories WHERE slug = 'home-garden' AND parent_id IS NULL;

  IF v_cat_home IS NOT NULL THEN
    SELECT id INTO v_sub_cleaning FROM categories
    WHERE slug = 'cleaning-products' AND parent_id = v_cat_home;

    IF v_sub_cleaning IS NULL THEN
      INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
      VALUES (v_cat_home, 'Cleaning Products', 'cleaning-products', 'both', 1, 1)
      RETURNING id INTO v_sub_cleaning;
    END IF;
  END IF;

  SELECT id INTO v_cat_health FROM categories WHERE slug = 'health-beauty' AND parent_id IS NULL;

  IF v_cat_health IS NOT NULL THEN
    SELECT id INTO v_sub_personal FROM categories
    WHERE slug = 'personal-care' AND parent_id = v_cat_health;

    IF v_sub_personal IS NULL THEN
      INSERT INTO categories (parent_id, name, slug, marketplace_context, depth, sort_order)
      VALUES (v_cat_health, 'Personal Care', 'personal-care', 'both', 1, 2)
      RETURNING id INTO v_sub_personal;
    END IF;
  END IF;

  -- ── 4. Wipe existing Rozil data ──────────────────────────────────────────
  DELETE FROM brand_gallery        WHERE supplier_id IN (SELECT id FROM suppliers WHERE brand_slug = 'rozil');
  DELETE FROM brand_certifications WHERE supplier_id IN (SELECT id FROM suppliers WHERE brand_slug = 'rozil');
  DELETE FROM brand_reviews        WHERE supplier_id IN (SELECT id FROM suppliers WHERE brand_slug = 'rozil');
  DELETE FROM supplier_pos         WHERE supplier_id IN (SELECT id FROM suppliers WHERE brand_slug = 'rozil');
  DELETE FROM products             WHERE supplier_id IN (SELECT id FROM suppliers WHERE brand_slug = 'rozil');
  DELETE FROM suppliers            WHERE brand_slug = 'rozil';

  -- ── 5. Create Químicas Rozaf / Rozil supplier ───────────────────────────
  INSERT INTO suppliers (
    owner_id, trade_name, legal_name, tax_id, status, reliability_tier,
    country_id, city_id,
    address_line1, postal_code,
    brand_slug, tagline, logo_url, banner_image,
    description, about_company,
    founded_year, employee_count, years_experience, countries_served,
    website, phone, whatsapp, business_email, working_hours, google_map_link,
    instagram, facebook,
    seo_title, seo_description, seo_keywords, og_image,
    is_featured, badges,
    section_visibility,
    verified_at
  ) VALUES (
    v_owner,
    'Rozil',
    'Químicas Rozaf S.L.U.',
    'ESB93750495',
    'ACTIVE', 'GOLD',
    v_es, v_malaga,
    'Polígono Industrial, Málaga', '29000',

    -- brand identity
    'rozil',
    'Limpieza de calidad superior — fabricada en Málaga, distribuida en toda España',
    v_img || '/logo.png',
    v_img || '/banner.jpg',

    -- short description (marketplace card)
    'Fabricante malagueño de productos de limpieza del hogar. Detergentes, suavizantes, fregasuelos y lavavajillas de alta calidad para distribución mayorista. Fundada en 2020.',

    -- full about_company
    E'Químicas Rozaf S.L.U. nació en 2020 en Málaga con una misión clara: ofrecer productos de limpieza del hogar de calidad superior a precios competitivos, fabricados en España con materias primas cuidadosamente seleccionadas.\n\nBajo la marca Rozil, hemos desarrollado una gama completa que cubre todas las necesidades de limpieza del hogar moderno: detergentes con tecnología OXY activo, suavizantes con fragancias exclusivas, limpiahogar multiusos, fregasuelos especializados y lavavajillas profesional.\n\nDesde nuestras instalaciones en Málaga, gestionamos la formulación, producción y distribución de toda nuestra gama, lo que nos permite mantener un control total de la calidad y flexibilidad para adaptarnos a las necesidades de nuestros clientes distribuidores.\n\nNos especializamos en:\n• Detergentes líquidos y en polvo con tecnología OXY\n• Suavizantes concentrados con fragancias duraderas\n• Productos de limpieza multiusos para el hogar\n• Fregasuelos especializados (mascotas, desinfectantes)\n• Lavavajillas líquido en formato profesional 5L\n\nNuestra filosofía es sencilla: calidad real, precio justo, servicio cercano. Trabajamos directamente con distribuidores, supermercados de proximidad, y centrales de compra en toda España.',

    -- company stats
    2020, 25, 5, 5,

    -- contact
    'https://www.quimicasrozaf.es',
    '+34 951 937 792',
    '34951937792',
    'quimicasrozaf@quimicasrozaf.es',
    E'Lunes – Viernes: 9:00 – 18:00 (CET)\nSábado: 9:00 – 13:00 (CET)\nDomingo: Cerrado',
    'https://maps.google.com/?q=Polígono+Industrial+Málaga+Spain',
    NULL, -- instagram (add if they have one)
    NULL, -- facebook

    -- SEO
    'Rozil — Productos de Limpieza Mayorista | Químicas Rozaf Málaga · TTAI EMA',
    'Distribuidor mayorista de productos de limpieza Rozil: detergentes OXY, suavizantes, fregasuelos y lavavajillas. Fabricado en Málaga. Contacta para pedidos al por mayor.',
    'productos limpieza mayorista, detergente OXY rozil, suavizante rozil, lavavajillas profesional, fregasuelos, quimicas rozaf malaga',
    v_img || '/og-image.jpg',

    -- featured + badges
    true,
    ARRAY['Fabricado en España', 'Distribuidor Directo', 'Pedido Mínimo Bajo', 'Calidad OXY'],

    '{"gallery":true,"certifications":true,"documents":true,"reviews":true}',
    now()
  ) RETURNING id INTO v_rozil;

  -- ══════════════════════════════════════════════════════════════════════════
  -- ── PRODUCTS (14) ─────────────────────────────────────────────────────────
  -- ══════════════════════════════════════════════════════════════════════════

  -- 1. Detergente OXY
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil Detergente OXY — Limpieza Profunda',
    'rozil-detergente-oxy',
    'Detergente líquido con tecnología OXY activo para una limpieza profunda de la ropa. Elimina manchas difíciles incluso en lavado en frío. Apto para todo tipo de tejidos. Formato distribución mayorista.',
    890, 'EUR', 24, 2000, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p01;

  -- 2. Gel Activo MAX
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil Gel Activo MAX — Detergente Concentrado',
    'rozil-gel-activo-max',
    'Gel detergente de alta concentración con fórmula MAX power. Dosis reducida, máxima eficacia. Perfume intenso y duradero. Ideal para distribuidores que buscan producto de alto valor percibido.',
    990, 'EUR', 24, 1800, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p02;

  -- 3. Más Color
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil Más Color — Detergente para Ropa de Color',
    'rozil-mas-color',
    'Detergente especializado para ropa de colores. Fórmula protege la intensidad del color y evita el desteñido. Sin fosfatos. Compatible con lavadoras de carga frontal y superior.',
    850, 'EUR', 24, 2000, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p03;

  -- 4. La Abuela
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil La Abuela — Detergente Tradicional',
    'rozil-la-abuela',
    'Detergente de fórmula tradicional con fragancia clásica de jabón natural. Gran aceptación en mercados de proximidad y supermercados. Formato económico para el consumidor final.',
    750, 'EUR', 36, 3000, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p04;

  -- 5. Jabón de Marsella
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil Jabón de Marsella — Detergente Clásico',
    'rozil-jabon-marsella',
    'Detergente inspirado en la tradición del jabón de Marsella. Fragancia suave y natural. Fórmula respetuosa con las telas delicadas. Perfecto para manos sensibles.',
    820, 'EUR', 24, 2500, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p05;

  -- 6. Max Power
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil Max Power — Detergente Alta Potencia',
    'rozil-max-power',
    'Máxima potencia limpiadora para ropa con suciedad intensa: trabajo, deporte, hostelería. Fórmula enzimática que actúa sobre proteínas, grasas y almidones. Alta rotación en canal HORECA.',
    1050, 'EUR', 24, 1500, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p06;

  -- 7. Suavizante Pasión Rojo
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil Suavizante Pasión Rojo — Fragancia Intensa',
    'rozil-suavizante-pasion-rojo',
    'Suavizante concentrado con fragancia Pasión Roja. Perfume intenso y duradero con notas florales y amaderadas. Suavidad superior en cada lavado. Formato 1,5L y 4L para distribución.',
    780, 'EUR', 24, 2000, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p07;

  -- 8. Suavizante Pasión Azul
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil Suavizante Pasión Azul — Frescor Marino',
    'rozil-suavizante-pasion-azul',
    'Suavizante concentrado con fragancia Pasión Azul, notas frescas y marinas. Antiestático, suaviza las fibras y reduce el tiempo de planchado. Gran aceptación en el mercado.',
    780, 'EUR', 24, 2000, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p08;

  -- 9. Suavizante Pasión Rosa
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil Suavizante Pasión Rosa — Floral Femenino',
    'rozil-suavizante-pasion-rosa',
    'Suavizante concentrado con delicada fragancia floral rosada. Especial para ropa de bebé y prendas delicadas. Formulación suave con pH neutro. Ideal para supermercados y droguerías.',
    780, 'EUR', 24, 2000, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p09;

  -- 10. Fregasuelos Mascotas
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil Fregasuelos Mascotas — Limpieza & Neutralizador',
    'rozil-fregasuelos-mascotas',
    'Fregasuelos especializado para hogares con mascotas. Neutraliza olores de animales, elimina bacterias y limpia en profundidad. Seguro para el contacto posterior con mascotas. Formato 1L y 5L.',
    950, 'EUR', 24, 1500, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p10;

  -- 11. OXY Activo Ropa Color
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil OXY Activo Ropa Color — Quitamanchas',
    'rozil-oxy-activo-color',
    'Quitamanchas OXY específico para ropa de color. Elimina manchas de café, vino, hierba y grasa sin dañar el color de la prenda. Se puede usar directamente sobre la mancha o en el tambor.',
    690, 'EUR', 36, 2500, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p11;

  -- 12. OXY Activo Ropa Blanca
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil OXY Activo Ropa Blanca — Blanqueador Activo',
    'rozil-oxy-activo-blanca',
    'Quitamanchas OXY con efecto blanqueador para ropa blanca. Restituye el blanco original y elimina manchas amarillas, moho y manchas de sudor. Sin cloro. Apto para 30°C.',
    690, 'EUR', 36, 2500, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p12;

  -- 13. Limpiahogar
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil Limpiahogar Multiusos — Frescor del Hogar',
    'rozil-limpiahogar',
    'Limpiador multiusos para todas las superficies del hogar: suelos, azulejos, baños y cocinas. Desengrasante y desinfectante. Fragancia fresca y duradera. Dilución económica para uso profesional.',
    720, 'EUR', 24, 3000, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p13;

  -- 14. Lavavajillas Profesional 5L
  INSERT INTO products (supplier_id, name, slug, description, price_cents, currency_code, min_order_qty, stock_qty, is_published, marketplace_context, category_id)
  VALUES (v_rozil,
    'Rozil Lavavajillas Profesional — Formato 5 Litros',
    'rozil-lavavajillas-profesional-5l',
    'Lavavajillas líquido en formato profesional de 5 litros. Alta capacidad desengrasante para vajilla, cristalería y utensilios de cocina. Rendimiento hasta 5× el formato doméstico. Ideal para restaurantes, hoteles y cocinas colectivas.',
    1890, 'EUR', 12, 800, true, 'wholesale', v_sub_cleaning)
  RETURNING id INTO v_p14;

  -- ── Product images ─────────────────────────────────────────────────────────
  INSERT INTO product_images (product_id, url, sort_order) VALUES
    (v_p01, v_img || '/products/detergente-oxy.jpg',          0),
    (v_p02, v_img || '/products/gel-activo-max.jpg',          0),
    (v_p03, v_img || '/products/mas-color.jpg',               0),
    (v_p04, v_img || '/products/la-abuela.jpg',               0),
    (v_p05, v_img || '/products/jabon-marsella.jpg',          0),
    (v_p06, v_img || '/products/max-power.jpg',               0),
    (v_p07, v_img || '/products/suavizante-pasion-rojo.jpg',  0),
    (v_p08, v_img || '/products/suavizante-pasion-azul.jpg',  0),
    (v_p09, v_img || '/products/suavizante-pasion-rosa.jpg',  0),
    (v_p10, v_img || '/products/fregasuelos-mascotas.jpg',    0),
    (v_p11, v_img || '/products/oxy-activo-color.jpg',        0),
    (v_p12, v_img || '/products/oxy-activo-blanca.jpg',       0),
    (v_p13, v_img || '/products/limpiahogar.jpg',             0),
    (v_p14, v_img || '/products/lavavajillas-profesional-5l.jpg', 0);

  -- ── Gallery (6 images from product shots) ─────────────────────────────────
  INSERT INTO brand_gallery (supplier_id, url, type, caption, sort_order) VALUES
    (v_rozil, v_img || '/gallery/gama-completa.jpg',         'image', 'Gama completa Rozil — detergentes, suavizantes y limpiadores',      0),
    (v_rozil, v_img || '/gallery/suavizantes-pasion.jpg',    'image', 'Línea Suavizante Pasión — 3 fragancias exclusivas',                  1),
    (v_rozil, v_img || '/gallery/oxy-activo.jpg',            'image', 'Tecnología OXY Activo — limpieza profunda garantizada',              2),
    (v_rozil, v_img || '/gallery/lavavajillas-5l.jpg',       'image', 'Lavavajillas Profesional 5L — para restaurantes y hostelería',       3),
    (v_rozil, v_img || '/gallery/fregasuelos-mascotas.jpg',  'image', 'Fregasuelos Mascotas — seguro y eficaz con animales',               4),
    (v_rozil, v_img || '/gallery/fabrica-malaga.jpg',        'image', 'Producción en Málaga — calidad española desde 2020',                5);

  -- ── Certifications ─────────────────────────────────────────────────────────
  INSERT INTO brand_certifications (supplier_id, title, issuer, issued_date, expiry_date, image_url) VALUES
    (v_rozil,
     'Registro Sanitario de Productos Químicos — AEMPS',
     'Agencia Española de Medicamentos y Productos Sanitarios',
     '2020-09-01', NULL,
     v_img || '/certs/registro-sanitario.jpg'),
    (v_rozil,
     'Ficha de Datos de Seguridad (FDS) — Reglamento REACH/CLP',
     'Unión Europea — Reglamento (CE) 1907/2006',
     '2021-01-01', NULL,
     v_img || '/certs/reach-clp.jpg'),
    (v_rozil,
     'Certificado de Empresa — CIF B93750495',
     'Registro Mercantil de Málaga',
     '2020-06-15', NULL,
     v_img || '/certs/registro-mercantil.jpg');

  -- ── Reviews ────────────────────────────────────────────────────────────────
  IF v_reviewer1 IS NOT NULL THEN
    INSERT INTO brand_reviews (supplier_id, user_id, rating, comment, verified_purchase, supplier_reply, replied_at)
    VALUES (v_rozil, v_reviewer1, 5,
      'Llevamos 2 años distribuyendo los productos Rozil en nuestra red de supermercados de proximidad en Andalucía. La rotación es excelente, especialmente el Gel Activo MAX y los suavizantes Pasión. Muy buen precio por litro y el servicio de Químicas Rozaf es cercano y rápido.',
      true,
      '¡Muchas gracias por la confianza! Para nosotros cada distribuidor es un socio estratégico y damos mucha importancia al servicio personalizado. ¡Seguimos creciendo juntos! 💚',
      now() - interval '10 days')
    ON CONFLICT (supplier_id, user_id) DO UPDATE
      SET rating = 5, comment = EXCLUDED.comment, supplier_reply = EXCLUDED.supplier_reply;
  END IF;

  IF v_reviewer2 IS NOT NULL AND v_reviewer2 != v_reviewer1 THEN
    INSERT INTO brand_reviews (supplier_id, user_id, rating, comment, verified_purchase)
    VALUES (v_rozil, v_reviewer2, 5,
      'Primer pedido de prueba de 48 unidades del Lavavajillas Profesional 5L para nuestros clientes de hostelería. El producto supera ampliamente lo esperado: rendimiento alto, olor agradable y precio competitivo. Ya hemos hecho el segundo pedido. Muy recomendable.',
      true)
    ON CONFLICT (supplier_id, user_id) DO UPDATE SET rating = 5, comment = EXCLUDED.comment;
  END IF;

  -- ── POS — Málaga factory/office ─────────────────────────────────────────
  INSERT INTO supplier_pos (supplier_id, name, type, status, is_public, sort_order)
  VALUES (v_rozil, 'Químicas Rozaf — Fábrica y Oficina Málaga', 'warehouse', 'active', true, 0)
  RETURNING id INTO v_pos1;

  INSERT INTO pos_locations (pos_id, address_line1, city, region, postal_code, country, latitude, longitude)
  VALUES (v_pos1, 'Polígono Industrial, Málaga', 'Málaga', 'Andalucía', '29000', 'Spain', 36.7213, -4.4214);

  INSERT INTO pos_details (pos_id, manager_name, phone, whatsapp, email,
    accepts_walk_ins, accepts_orders, services_offered, notes,
    opening_hours)
  VALUES (v_pos1,
    'Equipo Químicas Rozaf',
    '+34 951 937 792',
    '34951937792',
    'quimicasrozaf@quimicasrozaf.es',
    false, true,
    ARRAY['Pedidos mayorista', 'Catálogo de productos', 'Muestras', 'Recogida en fábrica'],
    'Fábrica y oficina comercial en Málaga. Pedidos mayoristas por teléfono o email. Recogida en fábrica con cita previa.',
    '{"monday":{"open":"09:00","close":"18:00","closed":false},"tuesday":{"open":"09:00","close":"18:00","closed":false},"wednesday":{"open":"09:00","close":"18:00","closed":false},"thursday":{"open":"09:00","close":"18:00","closed":false},"friday":{"open":"09:00","close":"15:00","closed":false},"saturday":{"open":"09:00","close":"13:00","closed":false},"sunday":{"open":"","close":"","closed":true}}');

  -- ── Supplier regions ────────────────────────────────────────────────────
  INSERT INTO supplier_regions (supplier_id, region_key) VALUES
    (v_rozil, 'europe'),
    (v_rozil, 'north-africa')
  ON CONFLICT (supplier_id, region_key) DO NOTHING;

  RAISE NOTICE '✅ Rozil (Químicas Rozaf S.L.U.) created — /brand/rozil';
  RAISE NOTICE '   CIF: B93750495 | Málaga, Spain | Founded 2020';
  RAISE NOTICE '   14 products + 6 gallery + 3 certifications';
  RAISE NOTICE '   ⚠️  Run scripts/upload-rozil-images.js to upload product images';

END $$;
