import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { redirect } from 'next/navigation'
import { ProfileEditForm } from '@/app/(dashboard)/account/ProfileEditForm'

export default async function SupplierSettingsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const [profileRes, supplierRes] = await Promise.all([
    supabase.from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase.from('suppliers').select('id').eq('owner_id', user.id).single(),
  ])

  if (!supplierRes.data) redirect('/supplier/onboarding')

  const profile = profileRes.data

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#0B1F4D]">Edit Profile</h1>
        <p className="text-sm text-gray-400 mt-1">Update your public profile information</p>
      </div>
      <ProfileEditForm
        profile={{
          ...(profile as any),
          email: user.email ?? '',
        }}
      />
    </div>
  )
}
