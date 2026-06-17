import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { redirect } from 'next/navigation'
import { ProfileEditForm } from '@/app/(dashboard)/account/ProfileEditForm'
import { LocationEditor } from '@/components/supplier/LocationEditor'
import { ShopTypeChooser } from '@/components/supplier/ShopTypeChooser'
import { OutletRoleChooser } from '@/components/supplier/OutletRoleChooser'
import { tierRank } from '@/lib/business-chain'

export default async function SupplierSettingsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const [profileRes, supplierRes] = await Promise.all([
    supabase.from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    // Location columns may be missing pre-migration — fall back to id-only.
    (async () => {
      const full = await (supabase.from('suppliers') as any)
        .select('id, marketplace_context, country_id, province_id, city_id, town_id, neighborhood_id, delivery_radius_km, countries(name)')
        .eq('owner_id', user.id).single()
      if (!full.error) return full
      return supabase.from('suppliers').select('id, marketplace_context').eq('owner_id', user.id).single()
    })(),
  ])

  if (!supplierRes.data) redirect('/supplier/onboarding')

  const profile = profileRes.data
  const sup = supplierRes.data as any
  const paid = tierRank((profile as any)?.tier) >= 1

  // Industrial park slug (separate, defensive — column may be pre-migration).
  let initialPark: string | null = null
  try {
    const { data } = await (supabase.from('suppliers') as any).select('industrial_park').eq('owner_id', user.id).single()
    initialPark = data?.industrial_park ?? null
  } catch { /* column not migrated yet */ }

  // Outlet Zone role (defensive — column may be pre-migration).
  let initialRole: string | null = null
  try {
    const { data } = await (supabase.from('suppliers') as any).select('outlet_role').eq('owner_id', user.id).single()
    initialRole = data?.outlet_role ?? null
  } catch { /* column not migrated yet */ }

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-extrabold text-[#0B1F4D]">Edit Profile</h1>
        <p className="text-sm text-gray-400 mt-1">Update your public profile information</p>
      </div>

      <ShopTypeChooser initial={(sup.marketplace_context as any) ?? 'wholesale'} paid={paid} />

      <OutletRoleChooser initial={initialRole} />

      <ProfileEditForm
        profile={{
          ...(profile as any),
          email: user.email ?? '',
        }}
      />

      <div className="pt-4">
        <LocationEditor
          countryId={sup.country_id ?? null}
          countryName={(sup.countries as any)?.name ?? 'Spain'}
          initial={{
            country_id: sup.country_id ?? null,
            province_id: sup.province_id ?? null,
            city_id: sup.city_id ?? null,
            town_id: sup.town_id ?? null,
            neighborhood_id: sup.neighborhood_id ?? null,
            delivery_radius_km: sup.delivery_radius_km ?? null,
            industrial_park: initialPark,
          }}
        />
      </div>
    </div>
  )
}
