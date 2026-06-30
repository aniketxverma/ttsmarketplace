#!/usr/bin/env node
/**
 * seed-rozil.js
 * ─────────────
 * Seeds the complete Rozil / Químicas Rozaf brand profile via Supabase JS client.
 * Safe to run multiple times — wipes then re-inserts.
 *
 * Run:   node scripts/seed-rozil.js
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL     = 'https://vtjtrbdyotsnautbqadi.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0anRyYmR5b3RzbmF1dGJxYWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE3NzA2NiwiZXhwIjoyMDkyNzUzMDY2fQ.FjNLcMvvgjWzVMsKScl3NwR8j7LwcWyiQ7cRLmVcL0g'

const sb  = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const IMG = `${SUPABASE_URL}/storage/v1/object/public/brand-assets/rozil`

// ── helpers ─────────────────────────────────────────────────────────────────

function ok(label, data, error) {
  if (error) { console.error(`❌ ${label}:`, error.message); process.exit(1) }
  return data
}

async function sel(table, col, val) {
  const { data, error } = await sb.from(table).select('id').eq(col, val).single()
  if (error && error.code !== 'PGRST116') ok(`select ${table}`, null, error)
  return data?.id ?? null
}

async function ins(table, row) {
  const { data, error } = await sb.from(table).insert(row).select('id').single()
  ok(`insert ${table}`, data, error)
  return data.id
}

async function upsertCat(parentId, name, slug, ctx) {
  // check existence
  let q = sb.from('categories').select('id').eq('slug', slug)
  if (parentId) q = q.eq('parent_id', parentId)
  else          q = q.is('parent_id', null)
  const { data } = await q.single()
  if (data) return data.id
  return ins('categories', { parent_id: parentId, name, slug, marketplace_context: ctx, depth: parentId ? 1 : 0, sort_order: 1 })
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Rozil Brand Seed — Químicas Rozaf S.L.U.')
  console.log('═══════════════════════════════════════════════════════\n')

  // ── 1. Look-ups ────────────────────────────────────────────────────────
  const { data: profiles } = await sb.from('profiles').select('id').order('created_at', { ascending: true }).limit(2)
  ok('profiles', profiles, null)
  const ownerId     = profiles[0].id
  const reviewerId1 = profiles[0].id
  const reviewerId2 = profiles.length > 1 ? profiles[1].id : profiles[0].id
  console.log(`✓ Owner profile: ${ownerId}`)

  const spainId = await sel('countries', 'iso_code', 'ES')
  ok('spain id', spainId, spainId ? null : { message: 'Spain not found' })
  console.log(`✓ Spain: ${spainId}`)

  // Ensure Málaga city
  let malagaId = await sel('cities', 'slug', 'malaga')
  if (!malagaId) {
    malagaId = await ins('cities', { country_id: spainId, name: 'Málaga', slug: 'malaga', retail_active: true })
    console.log(`✓ Created Málaga: ${malagaId}`)
  } else {
    console.log(`✓ Málaga: ${malagaId}`)
  }

  // Categories
  const homeGardenId = await upsertCat(null, 'Home & Garden', 'home-garden', 'both')
  const cleaningId   = await upsertCat(homeGardenId, 'Cleaning Products', 'cleaning-products', 'both')
  console.log(`✓ Category "Cleaning Products": ${cleaningId}`)

  // ── 2. Wipe existing Rozil ─────────────────────────────────────────────
  const { data: existing } = await sb.from('suppliers').select('id').eq('brand_slug', 'rozil')
  if (existing && existing.length > 0) {
    const rozilId = existing[0].id
    console.log(`⚠  Wiping existing Rozil supplier (${rozilId})…`)
    await sb.from('brand_gallery').delete().eq('supplier_id', rozilId)
    await sb.from('brand_certifications').delete().eq('supplier_id', rozilId)
    await sb.from('brand_reviews').delete().eq('supplier_id', rozilId)
    await sb.from('supplier_pos').delete().eq('supplier_id', rozilId)
    // cascade deletes products + images via FK
    await sb.from('suppliers').delete().eq('id', rozilId)
    console.log('   Wiped.')
  }

  // ── 3. Insert supplier ─────────────────────────────────────────────────
  console.log('\n→ Creating Rozil supplier…')
  const rozilId = await ins('suppliers', {
    owner_id:      ownerId,
    trade_name:    'Rozil',
    legal_name:    'Químicas Rozaf S.L.U.',
    tax_id:        'ESB93750495',
    status:        'ACTIVE',
    reliability_tier: 'GOLD',
    country_id:    spainId,
    city_id:       malagaId,
    address_line1: 'Polígono Industrial, Málaga',
    postal_code:   '29000',

    brand_slug:    'rozil',
    tagline:       'Limpieza de calidad superior — fabricada en Málaga, distribuida en toda España',
    logo_url:      `${IMG}/logo.png`,
    banner_image:  `${IMG}/banner.jpg`,

    description:
      'Fabricante malagueño de productos de limpieza del hogar. Detergentes, suavizantes, fregasuelos y lavavajillas de alta calidad para distribución mayorista. Fundada en 2020.',

    about_company:
      'Químicas Rozaf S.L.U. nació en 2020 en Málaga con una misión clara: ofrecer productos de limpieza del hogar de calidad superior a precios competitivos, fabricados en España con materias primas cuidadosamente seleccionadas.\n\nBajo la marca Rozil, hemos desarrollado una gama completa que cubre todas las necesidades de limpieza del hogar moderno: detergentes con tecnología OXY activo, suavizantes con fragancias exclusivas, limpiahogar multiusos, fregasuelos especializados y lavavajillas profesional.\n\nDesde nuestras instalaciones en Málaga, gestionamos la formulación, producción y distribución de toda nuestra gama, lo que nos permite mantener un control total de la calidad y flexibilidad para adaptarnos a las necesidades de nuestros clientes distribuidores.\n\nNos especializamos en:\n• Detergentes líquidos con tecnología OXY\n• Suavizantes concentrados con fragancias duraderas\n• Productos de limpieza multiusos para el hogar\n• Fregasuelos especializados (mascotas, desinfectantes)\n• Lavavajillas líquido en formato profesional 5L\n\nNuestra filosofía es sencilla: calidad real, precio justo, servicio cercano. Trabajamos directamente con distribuidores, supermercados de proximidad, y centrales de compra en toda España.',

    founded_year:    2020,
    employee_count:  25,
    years_experience: 5,
    countries_served: 5,

    website:        'https://www.quimicasrozaf.es',
    phone:          '+34 951 937 792',
    whatsapp:       '34951937792',
    business_email: 'quimicasrozaf@quimicasrozaf.es',
    working_hours:  'Lunes – Viernes: 9:00 – 18:00 (CET)\nSábado: 9:00 – 13:00 (CET)\nDomingo: Cerrado',
    google_map_link:'https://maps.google.com/?q=Polígono+Industrial+Málaga+Spain',

    seo_title:       'Rozil — Productos de Limpieza Mayorista | Químicas Rozaf Málaga · TTAI EMA',
    seo_description: 'Distribuidor mayorista de productos de limpieza Rozil: detergentes OXY, suavizantes, fregasuelos y lavavajillas. Fabricado en Málaga. Contacta para pedidos al por mayor.',
    seo_keywords:    'productos limpieza mayorista, detergente OXY rozil, suavizante rozil, lavavajillas profesional, fregasuelos, quimicas rozaf malaga',
    og_image:        `${IMG}/og-image.jpg`,

    is_featured: true,
    badges:      ['Fabricado en España', 'Distribuidor Directo', 'Pedido Mínimo Bajo', 'Calidad OXY'],
    section_visibility: { gallery: true, certifications: true, documents: true, reviews: true },
    verified_at: new Date().toISOString(),
  })
  console.log(`✅ Supplier created: ${rozilId}`)

  // ── 4. Products ────────────────────────────────────────────────────────
  console.log('\n→ Inserting 14 products…')

  const PRODUCTS = [
    {
      name: 'Rozil Detergente OXY — Limpieza Profunda',
      slug: 'rozil-detergente-oxy',
      description: 'Detergente líquido con tecnología OXY activo para una limpieza profunda de la ropa. Elimina manchas difíciles incluso en lavado en frío. Apto para todo tipo de tejidos. Formato distribución mayorista.',
      price_cents: 890, img: 'detergente-oxy.jpg',
    },
    {
      name: 'Rozil Gel Activo MAX — Detergente Concentrado',
      slug: 'rozil-gel-activo-max',
      description: 'Gel detergente de alta concentración con fórmula MAX power. Dosis reducida, máxima eficacia. Perfume intenso y duradero. Ideal para distribuidores que buscan producto de alto valor percibido.',
      price_cents: 990, img: 'gel-activo-max.jpg',
    },
    {
      name: 'Rozil Más Color — Detergente para Ropa de Color',
      slug: 'rozil-mas-color',
      description: 'Detergente especializado para ropa de colores. Fórmula protege la intensidad del color y evita el desteñido. Sin fosfatos. Compatible con lavadoras de carga frontal y superior.',
      price_cents: 850, img: 'mas-color.jpg',
    },
    {
      name: 'Rozil La Abuela — Detergente Tradicional',
      slug: 'rozil-la-abuela',
      description: 'Detergente de fórmula tradicional con fragancia clásica de jabón natural. Gran aceptación en mercados de proximidad y supermercados. Formato económico para el consumidor final.',
      price_cents: 750, img: 'la-abuela.jpg',
    },
    {
      name: 'Rozil Jabón de Marsella — Detergente Clásico',
      slug: 'rozil-jabon-marsella',
      description: 'Detergente inspirado en la tradición del jabón de Marsella. Fragancia suave y natural. Fórmula respetuosa con las telas delicadas. Perfecto para manos sensibles.',
      price_cents: 820, img: 'jabon-marsella.jpg',
    },
    {
      name: 'Rozil Max Power — Detergente Alta Potencia',
      slug: 'rozil-max-power',
      description: 'Máxima potencia limpiadora para ropa con suciedad intensa: trabajo, deporte, hostelería. Fórmula enzimática que actúa sobre proteínas, grasas y almidones. Alta rotación en canal HORECA.',
      price_cents: 1050, img: 'max-power.jpg',
    },
    {
      name: 'Rozil Suavizante Pasión Rojo — Fragancia Intensa',
      slug: 'rozil-suavizante-pasion-rojo',
      description: 'Suavizante concentrado con fragancia Pasión Roja. Perfume intenso y duradero con notas florales y amaderadas. Suavidad superior en cada lavado. Formato 1,5L y 4L para distribución.',
      price_cents: 780, img: 'suavizante-pasion-rojo.jpg',
    },
    {
      name: 'Rozil Suavizante Pasión Azul — Frescor Marino',
      slug: 'rozil-suavizante-pasion-azul',
      description: 'Suavizante concentrado con fragancia Pasión Azul, notas frescas y marinas. Antiestático, suaviza las fibras y reduce el tiempo de planchado. Gran aceptación en el mercado.',
      price_cents: 780, img: 'suavizante-pasion-azul.jpg',
    },
    {
      name: 'Rozil Suavizante Pasión Rosa — Floral Femenino',
      slug: 'rozil-suavizante-pasion-rosa',
      description: 'Suavizante concentrado con delicada fragancia floral rosada. Especial para ropa de bebé y prendas delicadas. Formulación suave con pH neutro. Ideal para supermercados y droguerías.',
      price_cents: 780, img: 'suavizante-pasion-rosa.jpg',
    },
    {
      name: 'Rozil Fregasuelos Mascotas — Limpieza & Neutralizador',
      slug: 'rozil-fregasuelos-mascotas',
      description: 'Fregasuelos especializado para hogares con mascotas. Neutraliza olores de animales, elimina bacterias y limpia en profundidad. Seguro para el contacto posterior con mascotas. Formato 1L y 5L.',
      price_cents: 950, img: 'fregasuelos-mascotas.jpg',
    },
    {
      name: 'Rozil OXY Activo Ropa Color — Quitamanchas',
      slug: 'rozil-oxy-activo-color',
      description: 'Quitamanchas OXY específico para ropa de color. Elimina manchas de café, vino, hierba y grasa sin dañar el color de la prenda. Se puede usar directamente sobre la mancha o en el tambor.',
      price_cents: 690, img: 'oxy-activo-color.jpg',
    },
    {
      name: 'Rozil OXY Activo Ropa Blanca — Blanqueador Activo',
      slug: 'rozil-oxy-activo-blanca',
      description: 'Quitamanchas OXY con efecto blanqueador para ropa blanca. Restituye el blanco original y elimina manchas amarillas, moho y manchas de sudor. Sin cloro. Apto para 30°C.',
      price_cents: 690, img: 'oxy-activo-blanca.jpg',
    },
    {
      name: 'Rozil Limpiahogar Multiusos — Frescor del Hogar',
      slug: 'rozil-limpiahogar',
      description: 'Limpiador multiusos para todas las superficies del hogar: suelos, azulejos, baños y cocinas. Desengrasante y desinfectante. Fragancia fresca y duradera. Dilución económica para uso profesional.',
      price_cents: 720, img: 'limpiahogar.jpg',
    },
    {
      name: 'Rozil Lavavajillas Profesional — Formato 5 Litros',
      slug: 'rozil-lavavajillas-profesional-5l',
      description: 'Lavavajillas líquido en formato profesional de 5 litros. Alta capacidad desengrasante para vajilla, cristalería y utensilios de cocina. Rendimiento hasta 5× el formato doméstico. Ideal para restaurantes, hoteles y cocinas colectivas.',
      price_cents: 1890, img: 'lavavajillas-profesional-5l.jpg',
    },
  ]

  for (const [i, p] of PRODUCTS.entries()) {
    const { data: prod, error: prodErr } = await sb.from('products').insert({
      supplier_id:       rozilId,
      name:              p.name,
      slug:              p.slug,
      description:       p.description,
      price_cents:       p.price_cents,
      currency_code:     'EUR',
      min_order_qty:     24,
      stock_qty:         2000,
      is_published:      true,
      marketplace_context: 'wholesale',
      category_id:       cleaningId,
    }).select('id').single()
    ok(`product ${p.slug}`, prod, prodErr)

    // product image
    await sb.from('product_images').insert({
      product_id: prod.id,
      url:        `${IMG}/products/${p.img}`,
      sort_order: 0,
    })
    process.stdout.write(`  [${i + 1}/14] ${p.name.replace('Rozil ', '')}\n`)
  }
  console.log('✅ Products done')

  // ── 5. Gallery ─────────────────────────────────────────────────────────
  console.log('\n→ Inserting gallery…')
  const GALLERY = [
    { url: `${IMG}/gallery/gama-completa.jpg`,        caption: 'Gama completa Rozil — detergentes, suavizantes y limpiadores',     sort_order: 0 },
    { url: `${IMG}/gallery/suavizantes-pasion.jpg`,   caption: 'Línea Suavizante Pasión — 3 fragancias exclusivas',                 sort_order: 1 },
    { url: `${IMG}/gallery/oxy-activo.jpg`,           caption: 'Tecnología OXY Activo — limpieza profunda garantizada',             sort_order: 2 },
    { url: `${IMG}/gallery/lavavajillas-5l.jpg`,      caption: 'Lavavajillas Profesional 5L — para restaurantes y hostelería',      sort_order: 3 },
    { url: `${IMG}/gallery/fregasuelos-mascotas.jpg`, caption: 'Fregasuelos Mascotas — seguro y eficaz con animales',              sort_order: 4 },
    { url: `${IMG}/gallery/fabrica-malaga.jpg`,       caption: 'Producción en Málaga — calidad española desde 2020',               sort_order: 5 },
  ]
  for (const g of GALLERY) {
    await sb.from('brand_gallery').insert({ supplier_id: rozilId, type: 'image', ...g })
  }
  console.log('✅ Gallery done (6 items)')

  // ── 6. Certifications ──────────────────────────────────────────────────
  console.log('\n→ Inserting certifications…')
  const CERTS = [
    {
      title:       'Registro Sanitario de Productos Químicos — AEMPS',
      issuer:      'Agencia Española de Medicamentos y Productos Sanitarios',
      issued_date: '2020-09-01',
      expiry_date: null,
      image_url:   `${IMG}/certs/registro-sanitario.jpg`,
    },
    {
      title:       'Ficha de Datos de Seguridad (FDS) — Reglamento REACH/CLP',
      issuer:      'Unión Europea — Reglamento (CE) 1907/2006',
      issued_date: '2021-01-01',
      expiry_date: null,
      image_url:   `${IMG}/certs/reach-clp.jpg`,
    },
    {
      title:       'Certificado de Empresa — CIF B93750495',
      issuer:      'Registro Mercantil de Málaga',
      issued_date: '2020-06-15',
      expiry_date: null,
      image_url:   `${IMG}/certs/registro-mercantil.jpg`,
    },
  ]
  for (const c of CERTS) {
    await sb.from('brand_certifications').insert({ supplier_id: rozilId, ...c })
  }
  console.log('✅ Certifications done (3 items)')

  // ── 7. Reviews ─────────────────────────────────────────────────────────
  console.log('\n→ Inserting reviews…')
  const review1 = {
    supplier_id:      rozilId,
    user_id:          reviewerId1,
    rating:           5,
    comment:          'Llevamos 2 años distribuyendo los productos Rozil en nuestra red de supermercados de proximidad en Andalucía. La rotación es excelente, especialmente el Gel Activo MAX y los suavizantes Pasión. Muy buen precio por litro y el servicio de Químicas Rozaf es cercano y rápido.',
    verified_purchase: true,
    supplier_reply:    '¡Muchas gracias por la confianza! Para nosotros cada distribuidor es un socio estratégico y damos mucha importancia al servicio personalizado. ¡Seguimos creciendo juntos! 💚',
    replied_at:        new Date(Date.now() - 10 * 864e5).toISOString(),
  }

  const { error: rev1Err } = await sb.from('brand_reviews').upsert(review1, { onConflict: 'supplier_id,user_id' })
  if (rev1Err) console.warn('  review1 upsert warn:', rev1Err.message)

  if (reviewerId2 !== reviewerId1) {
    const review2 = {
      supplier_id:      rozilId,
      user_id:          reviewerId2,
      rating:           5,
      comment:          'Primer pedido de prueba de 48 unidades del Lavavajillas Profesional 5L para nuestros clientes de hostelería. El producto supera ampliamente lo esperado: rendimiento alto, olor agradable y precio competitivo. Ya hemos hecho el segundo pedido. Muy recomendable.',
      verified_purchase: true,
    }
    const { error: rev2Err } = await sb.from('brand_reviews').upsert(review2, { onConflict: 'supplier_id,user_id' })
    if (rev2Err) console.warn('  review2 upsert warn:', rev2Err.message)
  }
  console.log('✅ Reviews done')

  // ── 8. POS ─────────────────────────────────────────────────────────────
  console.log('\n→ Inserting POS…')
  const posId = await ins('supplier_pos', {
    supplier_id: rozilId,
    name:        'Químicas Rozaf — Fábrica y Oficina Málaga',
    type:        'warehouse',
    status:      'active',
    is_public:   true,
    sort_order:  0,
  })

  await sb.from('pos_locations').insert({
    pos_id:       posId,
    address_line1:'Polígono Industrial, Málaga',
    city:         'Málaga',
    region:       'Andalucía',
    postal_code:  '29000',
    country:      'Spain',
    latitude:     36.7213,
    longitude:    -4.4214,
  })

  await sb.from('pos_details').insert({
    pos_id:           posId,
    manager_name:     'Equipo Químicas Rozaf',
    phone:            '+34 951 937 792',
    whatsapp:         '34951937792',
    email:            'quimicasrozaf@quimicasrozaf.es',
    accepts_walk_ins: false,
    accepts_orders:   true,
    services_offered: ['Pedidos mayorista', 'Catálogo de productos', 'Muestras', 'Recogida en fábrica'],
    notes:            'Fábrica y oficina comercial en Málaga. Pedidos mayoristas por teléfono o email. Recogida en fábrica con cita previa.',
    opening_hours: JSON.stringify({
      monday:    { open: '09:00', close: '18:00', closed: false },
      tuesday:   { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday:  { open: '09:00', close: '18:00', closed: false },
      friday:    { open: '09:00', close: '15:00', closed: false },
      saturday:  { open: '09:00', close: '13:00', closed: false },
      sunday:    { open: '', close: '', closed: true },
    }),
  })
  console.log('✅ POS done')

  // ── 9. Supplier regions ────────────────────────────────────────────────
  console.log('\n→ Inserting supplier regions…')
  await sb.from('supplier_regions').upsert([
    { supplier_id: rozilId, region_key: 'europe' },
    { supplier_id: rozilId, region_key: 'north-africa' },
  ], { onConflict: 'supplier_id,region_key', ignoreDuplicates: true })
  console.log('✅ Regions done')

  // ── Done ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  ✅ Rozil brand seeded successfully!')
  console.log(`  → View at: http://localhost:3000/brand/rozil`)
  console.log(`  → Or live: https://ttaiz.com/brand/rozil`)
  console.log('═══════════════════════════════════════════════════════')
  console.log('\n  Next: upload images to Supabase storage')
  console.log('  1. Put images into:  scripts/rozil-images/')
  console.log('  2. Run:              node scripts/upload-rozil-images.js')
  console.log('═══════════════════════════════════════════════════════\n')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
