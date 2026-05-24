#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const sb = createClient(
  'https://vtjtrbdyotsnautbqadi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0anRyYmR5b3RzbmF1dGJxYWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE3NzA2NiwiZXhwIjoyMDkyNzUzMDY2fQ.FjNLcMvvgjWzVMsKScl3NwR8j7LwcWyiQ7cRLmVcL0g'
)

async function run() {
  // 1. Upload owner photo as banner
  const buf = fs.readFileSync('c:/Users/anike/OneDrive/Desktop/tts.es/ttai/WhatsApp Image 2026-05-24 at 20.07.32.jpeg')
  const { error: upErr } = await sb.storage.from('brand-assets').upload('rozil/owner-banner.jpg', buf, { contentType: 'image/jpeg', upsert: true })
  if (upErr) { console.error('upload err:', upErr.message); return }
  console.log('✅ Owner photo uploaded → rozil/owner-banner.jpg')

  const bannerUrl = 'https://vtjtrbdyotsnautbqadi.supabase.co/storage/v1/object/public/brand-assets/rozil/owner-banner.jpg'

  // 2. Update supplier: banner + whatsapp
  const { error: supErr } = await sb.from('suppliers').update({
    banner_image: bannerUrl,
    og_image:     bannerUrl,
    whatsapp:     '34693754083',
    phone:        '+34 693 75 40 83',
  }).eq('brand_slug', 'rozil')
  console.log(supErr ? '❌ supplier: ' + supErr.message : '✅ Supplier: banner + phone/whatsapp updated')

  // 3. Get supplier id
  const { data: sup } = await sb.from('suppliers').select('id').eq('brand_slug', 'rozil').single()
  if (!sup) { console.error('❌ Rozil supplier not found'); return }

  // 4. Create Rozil channel if not exists
  const { data: existing } = await sb.from('supplier_channels').select('id').eq('supplier_id', sup.id).maybeSingle()
  if (!existing) {
    const { error: chErr } = await sb.from('supplier_channels').insert({
      supplier_id:  sup.id,
      name:         'Canal Oficial Rozil',
      description:  'Novedades, ofertas exclusivas y lanzamientos de productos Químicas Rozaf. Únete para recibir las mejores condiciones mayoristas.',
      whatsapp:     '34693754083',
      is_active:    true,
      member_count: 0,
      post_count:   0,
    })
    console.log(chErr ? '❌ channel: ' + chErr.message : '✅ Canal Oficial Rozil created')
  } else {
    await sb.from('supplier_channels').update({ whatsapp: '34693754083' }).eq('id', existing.id)
    console.log('✅ Channel whatsapp updated (already existed)')
  }

  console.log('\n✅ All done. Brand page /brand/rozil ready.')
}

run().catch(e => { console.error(e); process.exit(1) })
