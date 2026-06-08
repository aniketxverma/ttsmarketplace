import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { redirect } from 'next/navigation'
import { BrandProfileEditor } from './BrandProfileEditor'

export default async function SupplierBrandPage() {
  const user = await requireAuth()
  const supabase = createClient()

  // Get supplier record (cast as any — new brand columns not in generated types yet)
  const { data: supplier } = await (supabase
    .from('suppliers') as any)
    .select(`
      id, trade_name, legal_name, brand_slug, tagline, logo_url, banner_image,
      description, about_company, founded_year, employee_count, years_experience,
      countries_served, website, phone, whatsapp, business_email, working_hours,
      google_map_link, instagram, facebook, linkedin, twitter, youtube,
      seo_title, seo_description, seo_keywords, og_image,
      is_featured, badges, section_visibility, theme_settings, status
    `)
    .eq('owner_id', user.id)
    .single() as { data: any }

  if (!supplier) redirect('/supplier')

  // Minimum order value (defensive — column may not be migrated yet).
  try {
    const { data: mv } = await (supabase.from('suppliers') as any).select('min_order_value_cents').eq('id', supplier.id).single()
    if (mv) supplier.min_order_value_cents = mv.min_order_value_cents
  } catch { /* not migrated */ }

  // Fetch gallery and certifications
  const [galleryRes, certsRes] = await Promise.all([
    supabase
      .from('brand_gallery' as any)
      .select('id, url, type, caption, sort_order')
      .eq('supplier_id', supplier.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('brand_certifications' as any)
      .select('id, title, issuer, issued_date, expiry_date, image_url')
      .eq('supplier_id', supplier.id),
  ])

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Brand Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your public brand page — shown to buyers at{' '}
          {supplier.brand_slug ? (
            <a href={`/brand/${supplier.brand_slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">
              /brand/{supplier.brand_slug}
            </a>
          ) : (
            <span className="text-gray-400">set a slug below to publish</span>
          )}
        </p>
      </div>

      <BrandProfileEditor
        supplier={supplier as any}
        gallery={(galleryRes.data ?? []) as any[]}
        certifications={(certsRes.data ?? []) as any[]}
      />
    </div>
  )
}
