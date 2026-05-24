#!/usr/bin/env node
/**
 * upload-rozil-images.js
 * ──────────────────────
 * Uploads Rozil brand images to Supabase storage (bucket: brand-assets).
 *
 * USAGE
 * ─────
 * 1. Put your image files into scripts/rozil-images/ following this structure:
 *
 *    scripts/rozil-images/
 *    ├── logo.png                            ← Rozil logo (rainbow circle)
 *    ├── banner.jpg                          ← Wide banner / product lineup photo
 *    ├── og-image.jpg                        ← Open Graph (≈1200×630)
 *    ├── products/
 *    │   ├── detergente-oxy.jpg
 *    │   ├── gel-activo-max.jpg
 *    │   ├── mas-color.jpg
 *    │   ├── la-abuela.jpg
 *    │   ├── jabon-marsella.jpg
 *    │   ├── max-power.jpg
 *    │   ├── suavizante-pasion-rojo.jpg
 *    │   ├── suavizante-pasion-azul.jpg
 *    │   ├── suavizante-pasion-rosa.jpg
 *    │   ├── fregasuelos-mascotas.jpg
 *    │   ├── oxy-activo-color.jpg
 *    │   ├── oxy-activo-blanca.jpg
 *    │   ├── limpiahogar.jpg
 *    │   └── lavavajillas-profesional-5l.jpg
 *    ├── gallery/
 *    │   ├── gama-completa.jpg
 *    │   ├── suavizantes-pasion.jpg
 *    │   ├── oxy-activo.jpg
 *    │   ├── lavavajillas-5l.jpg
 *    │   ├── fregasuelos-mascotas.jpg
 *    │   └── fabrica-malaga.jpg
 *    └── certs/
 *        ├── registro-sanitario.jpg
 *        ├── reach-clp.jpg
 *        └── registro-mercantil.jpg
 *
 * 2. Run:
 *    node scripts/upload-rozil-images.js
 *
 * Files that are missing are skipped (not an error). Already-uploaded files
 * are overwritten (upsert: true). The public URL is printed for each upload.
 */

const { createClient } = require('@supabase/supabase-js')
const fs   = require('fs')
const path = require('path')

// ── Config ─────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://vtjtrbdyotsnautbqadi.supabase.co'
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY      || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0anRyYmR5b3RzbmF1dGJxYWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE3NzA2NiwiZXhwIjoyMDkyNzUzMDY2fQ.FjNLcMvvgjWzVMsKScl3NwR8j7LwcWyiQ7cRLmVcL0g'
const BUCKET            = 'brand-assets'
const IMAGES_DIR        = path.join(__dirname, 'rozil-images')

// ── Supabase client (service role bypasses RLS) ────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── File map: local path → Supabase storage path ──────────────────────────
const FILES = [
  // root brand files
  ['logo.jpg',                                 'rozil/logo.jpg'],
  ['banner.jpg',                               'rozil/banner.jpg'],
  ['og-image.jpg',                             'rozil/og-image.jpg'],

  // product images
  ['products/detergente-oxy.jpg',              'rozil/products/detergente-oxy.jpg'],
  ['products/gel-activo-max.jpg',              'rozil/products/gel-activo-max.jpg'],
  ['products/mas-color.jpg',                   'rozil/products/mas-color.jpg'],
  ['products/la-abuela.jpg',                   'rozil/products/la-abuela.jpg'],
  ['products/jabon-marsella.jpg',              'rozil/products/jabon-marsella.jpg'],
  ['products/max-power.jpg',                   'rozil/products/max-power.jpg'],
  ['products/suavizante-pasion-rojo.jpg',      'rozil/products/suavizante-pasion-rojo.jpg'],
  ['products/suavizante-pasion-azul.jpg',      'rozil/products/suavizante-pasion-azul.jpg'],
  ['products/suavizante-pasion-rosa.jpg',      'rozil/products/suavizante-pasion-rosa.jpg'],
  ['products/fregasuelos-mascotas.jpg',        'rozil/products/fregasuelos-mascotas.jpg'],
  ['products/oxy-activo-color.jpg',            'rozil/products/oxy-activo-color.jpg'],
  ['products/oxy-activo-blanca.jpg',           'rozil/products/oxy-activo-blanca.jpg'],
  ['products/limpiahogar.jpg',                 'rozil/products/limpiahogar.jpg'],
  ['products/lavavajillas-profesional-5l.jpg', 'rozil/products/lavavajillas-profesional-5l.jpg'],

  // gallery
  ['gallery/gama-completa.jpg',                'rozil/gallery/gama-completa.jpg'],
  ['gallery/suavizantes-pasion.jpg',           'rozil/gallery/suavizantes-pasion.jpg'],
  ['gallery/oxy-activo.jpg',                   'rozil/gallery/oxy-activo.jpg'],
  ['gallery/lavavajillas-5l.jpg',              'rozil/gallery/lavavajillas-5l.jpg'],
  ['gallery/fregasuelos-mascotas.jpg',         'rozil/gallery/fregasuelos-mascotas.jpg'],
  ['gallery/fabrica-malaga.jpg',               'rozil/gallery/fabrica-malaga.jpg'],

  // certs
  ['certs/registro-sanitario.jpg',             'rozil/certs/registro-sanitario.jpg'],
  ['certs/reach-clp.jpg',                      'rozil/certs/reach-clp.jpg'],
  ['certs/registro-mercantil.jpg',             'rozil/certs/registro-mercantil.jpg'],
]

function mimeType(file) {
  const ext = path.extname(file).toLowerCase()
  if (ext === '.png')  return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif')  return 'image/gif'
  return 'image/jpeg'
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.find(b => b.name === BUCKET)

  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) {
      console.error('❌ Could not create bucket:', error.message)
      process.exit(1)
    }
    console.log(`✅ Created public bucket: ${BUCKET}`)
  } else {
    console.log(`✓  Bucket "${BUCKET}" already exists`)
  }
}

async function uploadFile(localRel, storagePath) {
  const localAbs = path.join(IMAGES_DIR, localRel)

  if (!fs.existsSync(localAbs)) {
    console.log(`⏭  Skipped (not found): ${localRel}`)
    return null
  }

  const fileBuffer = fs.readFileSync(localAbs)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType(localAbs),
      upsert: true,
    })

  if (error) {
    console.error(`❌ Error uploading ${storagePath}: ${error.message}`)
    return null
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
  console.log(`✅ ${storagePath}`)
  console.log(`   → ${publicUrl}`)
  return publicUrl
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Rozil — Supabase Image Upload')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`  Source:  ${IMAGES_DIR}`)
  console.log(`  Bucket:  ${BUCKET}`)
  console.log(`  Project: ${SUPABASE_URL}`)
  console.log('═══════════════════════════════════════════════════════\n')

  if (!fs.existsSync(IMAGES_DIR)) {
    console.log(`📁 Creating images directory: ${IMAGES_DIR}`)
    fs.mkdirSync(IMAGES_DIR, { recursive: true })
    fs.mkdirSync(path.join(IMAGES_DIR, 'products'), { recursive: true })
    fs.mkdirSync(path.join(IMAGES_DIR, 'gallery'),  { recursive: true })
    fs.mkdirSync(path.join(IMAGES_DIR, 'certs'),    { recursive: true })
    console.log('   Put your Rozil images inside this folder and re-run.\n')
    return
  }

  await ensureBucket()
  console.log('')

  let uploaded = 0
  let skipped  = 0

  for (const [local, storage] of FILES) {
    const result = await uploadFile(local, storage)
    if (result) uploaded++
    else skipped++
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`  Done — ${uploaded} uploaded, ${skipped} skipped`)
  if (skipped > 0) {
    console.log('  Add missing files to scripts/rozil-images/ and re-run.')
  }
  console.log('═══════════════════════════════════════════════════════')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
