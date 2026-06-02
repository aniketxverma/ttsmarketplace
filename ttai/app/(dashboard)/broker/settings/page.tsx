import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { ProfileEditForm } from '@/app/(dashboard)/account/ProfileEditForm'

export default async function BrokerSettingsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: profile } = await supabase.from('profiles')
    .select('id,full_name,username,phone,bio,company_name,business_type,category,country_name,city,continent,website_url,products_offered,avatar_url,role')
    .eq('id', user.id)
    .single()

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
