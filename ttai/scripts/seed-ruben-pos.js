// Seed Rubén's client store POS for Rozil
// Run: node scripts/seed-ruben-pos.js
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  // 1. Get Rozil supplier ID
  const { data: supplier, error: sErr } = await sb
    .from('suppliers')
    .select('id, trade_name')
    .eq('brand_slug', 'rozil')
    .single()

  if (sErr || !supplier) {
    console.error('❌ Could not find Rozil supplier:', sErr?.message)
    process.exit(1)
  }
  console.log(`✅ Found supplier: ${supplier.trade_name} (${supplier.id})`)

  // 2. Run migration columns first (idempotent ALTER TABLE via Supabase RPC if available)
  // Since we can't run SQL migrations directly, we'll try to insert and handle gracefully

  // 3. Insert POS entry for Rubén
  const { data: pos, error: posErr } = await sb
    .from('supplier_pos')
    .upsert({
      supplier_id: supplier.id,
      name:        'Rubén – Madrid',
      type:        'client_store',
      status:      'active',
      is_public:   true,
      sort_order:  10,
      // shop columns added by migration 0015
      shop_active:  false,
      shop_slug:    'ruben-distribuciones-madrid',
      shop_name:    'Distribuciones Rubén',
      shop_tagline: 'Productos de limpieza Rozil en Madrid',
    }, {
      onConflict: 'supplier_id,name',
      ignoreDuplicates: false,
    })
    .select('id')
    .single()

  // Fallback: try without shop columns if migration not yet applied
  let posId
  if (posErr) {
    console.warn('⚠️  POS upsert with shop columns failed, trying without:', posErr.message)
    const { data: pos2, error: posErr2 } = await sb
      .from('supplier_pos')
      .upsert({
        supplier_id: supplier.id,
        name:        'Rubén – Madrid',
        type:        'client_store',
        status:      'active',
        is_public:   true,
        sort_order:  10,
      }, {
        onConflict: 'supplier_id,name',
        ignoreDuplicates: false,
      })
      .select('id')
      .single()

    if (posErr2) {
      // onConflict by name+supplier_id may not be a constraint — try select first
      const { data: existing } = await sb
        .from('supplier_pos')
        .select('id')
        .eq('supplier_id', supplier.id)
        .eq('name', 'Rubén – Madrid')
        .maybeSingle()

      if (existing) {
        posId = existing.id
        console.log(`♻️  Using existing POS: ${posId}`)
      } else {
        const { data: ins, error: insErr } = await sb
          .from('supplier_pos')
          .insert({
            supplier_id: supplier.id,
            name:        'Rubén – Madrid',
            type:        'client_store',
            status:      'active',
            is_public:   true,
            sort_order:  10,
          })
          .select('id')
          .single()
        if (insErr) { console.error('❌ Insert failed:', insErr.message); process.exit(1) }
        posId = ins.id
      }
    } else {
      posId = pos2?.id
    }
  } else {
    posId = pos?.id
  }

  // Also try updating shop columns separately (works after migration is applied)
  if (posId) {
    await sb
      .from('supplier_pos')
      .update({
        shop_active:  false,
        shop_slug:    'ruben-distribuciones-madrid',
        shop_name:    'Distribuciones Rubén',
        shop_tagline: 'Productos de limpieza Rozil en Madrid',
      })
      .eq('id', posId)
    console.log(`✅ POS created/updated: ${posId}`)
  }

  if (!posId) { console.error('❌ No POS id obtained'); process.exit(1) }

  // 4. Location
  const { error: locErr } = await sb
    .from('pos_locations')
    .upsert({
      pos_id:        posId,
      address_line1: 'Camino de las Hormigueras, 144',
      city:          'Madrid',
      region:        'Comunidad de Madrid',
      postal_code:   '28031',
      country:       'España',
      latitude:      40.3907,
      longitude:     -3.6436,
    }, { onConflict: 'pos_id' })

  if (locErr) console.warn('⚠️  Location upsert:', locErr.message)
  else console.log('✅ Location saved')

  // 5. Public details (manager name, services — no phone here)
  const { error: detErr } = await sb
    .from('pos_details')
    .upsert({
      pos_id:           posId,
      manager_name:     'Rubén',
      accepts_walk_ins: false,
      accepts_orders:   true,
      services_offered: ['Distribución mayorista', 'Recogida en almacén'],
      notes:            'Punto de venta y distribución Rozil en Madrid.',
    }, { onConflict: 'pos_id' })

  if (detErr) console.warn('⚠️  Details upsert:', detErr.message)
  else console.log('✅ Public details saved')

  // 6. Private contact — only visible to authenticated wholesale users
  const { error: privErr } = await sb
    .from('pos_private_details')
    .upsert({
      pos_id:   posId,
      phone:    '+34 XXX XXX XXX',    // Replace with real number when provided
      whatsapp: '34XXXXXXXXX',         // Replace with real number when provided
      notes:    'Contacto directo distribuidor Madrid',
    }, { onConflict: 'pos_id' })

  if (privErr) {
    console.warn('⚠️  Private details upsert (migration may not be applied yet):', privErr.message)
    console.log('   → Run migration 0015_client_shops.sql first, then re-run this script.')
  } else {
    console.log('✅ Private contact saved (wholesale-only)')
  }

  console.log('\n🎉 Rubén POS seed complete!')
  console.log(`   POS ID:   ${posId}`)
  console.log(`   Type:     client_store`)
  console.log(`   Address:  Camino de las Hormigueras, 144 — Madrid`)
  console.log(`   Shop URL: /shop/ruben-distribuciones-madrid (inactive until paid)`)
}

main().catch(e => { console.error(e); process.exit(1) })
