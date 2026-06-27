import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { requireAuth } from '@/lib/auth/rbac'
import { ProfileEditForm } from '@/app/(dashboard)/account/ProfileEditForm'

export default async function BuyerSettingsPage() {
  
  const tt = await localizeUI(["Edit Profile", "Update your public profile information"], getLocale())
  const user = await requireAuth()
  const supabase = createClient()

  const { data: profile } = await supabase.from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#0B1F4D]">{tt("Edit Profile")}</h1>
        <p className="text-sm text-gray-400 mt-1">{tt("Update your public profile information")}</p>
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
