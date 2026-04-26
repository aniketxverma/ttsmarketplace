import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/domain'

export async function getSession() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function getProfile() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function requireAuth() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireRole(roles: UserRole | UserRole[]) {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  const allowed = Array.isArray(roles) ? roles : [roles]

  if (!allowed.includes(profile.role as UserRole)) {
    redirect('/')
  }

  return profile
}

export function hasRole(profileRole: string, roles: UserRole[]): boolean {
  return roles.includes(profileRole as UserRole)
}
