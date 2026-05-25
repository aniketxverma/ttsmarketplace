/**
 * Uploads logo.jpeg + owner.jpeg to Supabase Storage (brand-assets bucket)
 * and updates the Rozil supplier row with the new URLs.
 *
 * Run:  node scripts/upload-rozil-assets.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const SUPABASE_URL     = 'https://vtjtrbdyotsnautbqadi.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0anRyYmR5b3RzbmF1dGJxYWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE3NzA2NiwiZXhwIjoyMDkyNzUzMDY2fQ.FjNLcMvvgjWzVMsKScl3NwR8j7LwcWyiQ7cRLmVcL0g'
const BUCKET          = 'brand-assets'
const BRAND_SLUG      = 'rozil'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function upload(localFile, storagePath, contentType) {
  const bytes = readFileSync(localFile)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, {
      contentType,
      upsert: true,          // overwrite if it already exists
    })
  if (error) throw new Error(`Upload failed for ${storagePath}: ${error.message}`)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

async function main() {
  console.log('⬆️  Uploading Rozil assets to Supabase Storage…\n')

  // 1 — Logo
  const logoUrl = await upload(
    resolve(ROOT, 'logo.jpeg'),
    `${BRAND_SLUG}/logo.jpeg`,
    'image/jpeg'
  )
  console.log('✅ Logo  →', logoUrl)

  // 2 — Owner photo
  const ownerUrl = await upload(
    resolve(ROOT, 'owner.jpeg'),
    `${BRAND_SLUG}/owner.jpeg`,
    'image/jpeg'
  )
  console.log('✅ Owner →', ownerUrl)

  // 3 — Update suppliers row
  const { data: supplier, error: findErr } = await supabase
    .from('suppliers')
    .select('id, trade_name')
    .eq('brand_slug', BRAND_SLUG)
    .single()

  if (findErr || !supplier) throw new Error('Rozil supplier not found: ' + (findErr?.message ?? 'no row'))

  const { error: updateErr } = await supabase
    .from('suppliers')
    .update({ logo_url: logoUrl })
    .eq('id', supplier.id)

  if (updateErr) throw new Error('Failed to update logo_url: ' + updateErr.message)
  console.log(`\n✅ suppliers.logo_url updated for "${supplier.trade_name}"`)

  // 4 — Update owner photo in pos_details / supplier row (store in og_image or a dedicated column if present)
  //     We'll also try to set it as the og_image (used in Open Graph meta)
  const { error: ogErr } = await supabase
    .from('suppliers')
    .update({ og_image: ownerUrl })
    .eq('id', supplier.id)

  if (ogErr) {
    console.warn('⚠️  og_image column may not exist — skipping owner OG update:', ogErr.message)
  } else {
    console.log(`✅ suppliers.og_image updated with owner photo`)
  }

  console.log('\n🎉 Done! URLs:')
  console.log('   Logo  :', logoUrl)
  console.log('   Owner :', ownerUrl)
}

main().catch((err) => {
  console.error('\n❌', err.message)
  process.exit(1)
})
