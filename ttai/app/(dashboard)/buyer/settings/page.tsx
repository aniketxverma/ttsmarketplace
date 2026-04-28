import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'

export default async function BuyerSettingsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, preferred_language')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Full Name</span>
            <span className="font-medium">{profile?.full_name ?? '—'}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium">{profile?.phone ?? '—'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Language</span>
            <span className="font-medium">{profile?.preferred_language?.toUpperCase() ?? 'EN'}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">
          To change your password, use the{' '}
          <a href="/reset-password" className="text-primary hover:underline">password reset</a> flow.
        </p>
      </div>
    </div>
  )
}
